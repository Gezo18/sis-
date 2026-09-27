-- ==============================================================================
-- PRODUCTION-GRADE AUTHENTICATION & ACCOUNT MANAGEMENT DATABASE SCHEMA
-- Target Engine: PostgreSQL 14+ (Compatible with Supabase, Cloud SQL, RDS)
-- Standard ANSI SQL compliant with strict cryptographic and cybersecurity controls
-- ==============================================================================

-- Enable UUID Extension (PostgreSQL 13+ pgcrypto / uuid-ossp or native gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USERS TABLE (Core Authentication Entity)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    -- Surrogate Primary Key using UUIDv4 to eliminate enumeration attacks
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Normalized, case-insensitive unique email address
    email VARCHAR(255) NOT NULL,
    normalized_email VARCHAR(255) GENERATED ALWAYS AS (LOWER(TRIM(email))) STORED,

    -- Cryptographic password hash in standard PHC string format
    -- Holds Argon2id ($argon2id$v=19$m=65536,t=3,p=4$...) or bcrypt ($2b$12$...) hashes
    password_hash VARCHAR(255) NOT NULL,

    -- Verification flags
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_number VARCHAR(32) NULL,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,

    -- Multi-Factor Authentication (MFA) flag
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- Account lifecycle status with strict enum constraint
    account_status VARCHAR(32) NOT NULL DEFAULT 'pending_verification'
        CONSTRAINT check_user_account_status CHECK (
            account_status IN ('pending_verification', 'active', 'suspended', 'locked', 'soft_deleted')
        ),

    -- Brute-Force & Lockout Controls
    failed_login_attempts INT NOT NULL DEFAULT 0
        CONSTRAINT check_failed_login_attempts CHECK (failed_login_attempts >= 0),
    locked_until TIMESTAMPTZ NULL,

    -- Audit Timestamps
    last_login_at TIMESTAMPTZ NULL,
    last_login_ip INET NULL,
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,

    -- Constraints
    CONSTRAINT uq_users_normalized_email UNIQUE (normalized_email),
    CONSTRAINT check_email_format CHECK (
        normalized_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Partial index for active users lookup
CREATE INDEX IF NOT EXISTS idx_users_active_lookup 
ON public.users (normalized_email) 
WHERE account_status = 'active';

-- Index for scheduled deletion cleanup of soft-deleted accounts
CREATE INDEX IF NOT EXISTS idx_users_deleted_at 
ON public.users (deleted_at) 
WHERE deleted_at IS NOT NULL;


-- ==============================================================================
-- 2. USER PROFILES TABLE (1-to-1 Non-Auth Metadata)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    -- Shared Primary Key / Foreign Key for strict 1:1 relationship
    user_id UUID PRIMARY KEY,

    -- Public Display Metadata
    display_name VARCHAR(120) NOT NULL,
    first_name VARCHAR(60) NULL,
    last_name VARCHAR(60) NULL,
    avatar_url VARCHAR(1024) NULL,
    bio TEXT NULL,

    -- User Preferences & Internationalization
    locale VARCHAR(10) NOT NULL DEFAULT 'en-US',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

    -- Semi-structured user settings (theme, notifications, privacy)
    preferences JSONB NOT NULL DEFAULT '{
        "theme": "system",
        "email_notifications": {
            "security_alerts": true,
            "product_updates": false
        },
        "mfa_method_preference": "totp"
    }'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Strict cascading delete: profile purged if user is permanently removed
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) ON DELETE CASCADE
);

-- GIN Index for fast JSONB querying inside user preferences
CREATE INDEX IF NOT EXISTS idx_user_profiles_preferences_gin 
ON public.user_profiles USING GIN (preferences);


-- ==============================================================================
-- 3. USER SESSIONS & REFRESH TOKENS TABLE (Session & Device Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Associated user
    user_id UUID NOT NULL,

    -- Cryptographic hash (SHA-256) of the JWT refresh token
    -- Raw refresh token is NEVER stored in the database
    refresh_token_hash CHAR(64) NOT NULL,

    -- Client Device Fingerprint & Metadata
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    device_name VARCHAR(100) NULL,
    os_name VARCHAR(50) NULL,
    browser_name VARCHAR(50) NULL,

    -- Session Lifecycle
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ NULL,
    revocation_reason VARCHAR(100) NULL, -- 'user_logout', 'password_reset', 'security_rotation', 'admin_action'

    last_active_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT uq_sessions_refresh_token_hash UNIQUE (refresh_token_hash),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT check_session_expiration CHECK (expires_at > created_at)
);

-- Fast lookup index for active session validation during token refresh
CREATE INDEX IF NOT EXISTS idx_user_sessions_active 
ON public.user_sessions (refresh_token_hash) 
WHERE is_revoked = FALSE;

-- Composite index to list user active devices
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active 
ON public.user_sessions (user_id, last_active_at DESC) 
WHERE is_revoked = FALSE;


-- ==============================================================================
-- 4. PASSWORD RESET & EMAIL VERIFICATION TOKENS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.security_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    -- Purpose of token: 'password_reset', 'email_verification', 'magic_link', 'phone_verification'
    token_type VARCHAR(32) NOT NULL
        CONSTRAINT check_token_type CHECK (
            token_type IN ('password_reset', 'email_verification', 'magic_link', 'phone_verification')
        ),

    -- SHA-256 Hash of the random one-time token sent to the user
    token_hash CHAR(64) NOT NULL,

    -- Single-use security tracking
    is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
    consumed_at TIMESTAMPTZ NULL,
    consumed_by_ip INET NULL,

    -- Security metadata for issuance
    requested_by_ip INET NOT NULL,
    user_agent TEXT NULL,

    -- Expiration (e.g., 15 minutes for reset, 24 hours for email verification)
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT uq_security_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_security_tokens_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT check_token_expiration CHECK (expires_at > created_at)
);

-- Index for validating active, unexpired tokens
CREATE INDEX IF NOT EXISTS idx_tokens_active_verification 
ON public.security_verification_tokens (token_hash, token_type) 
WHERE is_consumed = FALSE;


-- ==============================================================================
-- 5. ROLE-BASED ACCESS CONTROL (RBAC): ROLES & PERMISSIONS
-- ==============================================================================

-- 5a. System Roles Definition
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE, -- Prevents accidental deletion of admin/user roles
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_roles_slug UNIQUE (slug)
);

-- 5b. Granular Permissions Definition
CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- e.g., 'users:read', 'users:delete', 'reports:export'
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_permissions_slug UNIQUE (slug)
);

-- 5c. Role <-> Permission Association (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id)
        REFERENCES public.roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_perm FOREIGN KEY (permission_id)
        REFERENCES public.permissions (id) ON DELETE CASCADE
);

-- 5d. User <-> Role Association (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL,
    role_id INT NOT NULL,
    assigned_by UUID NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id)
        REFERENCES public.roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigner FOREIGN KEY (assigned_by)
        REFERENCES public.users (id) ON DELETE SET NULL
);

-- Index for rapid user authorization evaluation
CREATE INDEX IF NOT EXISTS idx_user_roles_user_lookup 
ON public.user_roles (user_id);


-- ==============================================================================
-- 6. MULTI-FACTOR AUTHENTICATION (MFA / TOTP) CREDENTIALS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_mfa_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,

    -- MFA Type: 'totp_authenticator', 'webauthn_passkey', 'sms_backup'
    mfa_type VARCHAR(32) NOT NULL DEFAULT 'totp_authenticator'
        CONSTRAINT check_mfa_type CHECK (mfa_type IN ('totp_authenticator', 'webauthn_passkey', 'sms_backup')),

    -- Encrypted Secret Key (AES-256-GCM cipher text)
    -- NEVER store raw TOTP secret seeds in plaintext
    encrypted_secret VARCHAR(512) NOT NULL,
    secret_iv VARCHAR(64) NOT NULL, -- Initialization vector for AES-GCM
    key_version INT NOT NULL DEFAULT 1, -- For KMS key rotation support

    -- Hashed Backup / Recovery Codes (Bcrypt or Argon2id hashed single-use codes)
    hashed_backup_codes JSONB NOT NULL DEFAULT '[]'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_mfa_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_mfa_user_active 
ON public.user_mfa_credentials (user_id) 
WHERE is_active = TRUE;


-- ==============================================================================
-- 7. SECURITY AUDIT LOG TABLE (Append-Only Event Ledger)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id BIGSERIAL PRIMARY KEY,

    -- Event Categorization
    event_type VARCHAR(64) NOT NULL, 
    -- Examples: 'auth.login.success', 'auth.login.failed', 'auth.logout',
    --           'auth.password.reset_requested', 'auth.password.changed',
    --           'auth.mfa.verified', 'auth.account.locked', 'rbac.role.granted'

    -- Principal & Target Actor References
    actor_user_id UUID NULL,  -- NULL if unauthenticated (e.g., failed login attempt)
    target_user_id UUID NULL, -- User account modified or inspected

    -- Security Telemetry Context
    ip_address INET NOT NULL,
    user_agent TEXT NULL,
    geo_country CHAR(2) NULL, -- ISO-3166-1 alpha-2 country code
    geo_city VARCHAR(100) NULL,

    -- Event Status & Detailed Audit Payload
    status VARCHAR(16) NOT NULL
        CONSTRAINT check_audit_status CHECK (status IN ('SUCCESS', 'FAILURE', 'BLOCKED', 'WARNING')),
    failure_reason VARCHAR(255) NULL,
    event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Tamper-resistant append-only timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id)
        REFERENCES public.users (id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_target FOREIGN KEY (target_user_id)
        REFERENCES public.users (id) ON DELETE SET NULL
);

-- Essential indices for SIEM querying, forensic timeline analysis, and suspicious IP detection
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_timestamp 
ON public.security_audit_logs (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_timestamp 
ON public.security_audit_logs (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_timestamp 
ON public.security_audit_logs (ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_attempts 
ON public.security_audit_logs (ip_address, created_at DESC) 
WHERE status = 'FAILURE';


-- ==============================================================================
-- 8. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users table
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Attach trigger to user_profiles table
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


-- ==============================================================================
-- 9. SEED DEFAULT RBAC DATA (Idempotent)
-- ==============================================================================
INSERT INTO public.roles (name, slug, description, is_system_role)
VALUES 
    ('Super Administrator', 'super_admin', 'Unrestricted administrative access to all portal modules', TRUE),
    ('Faculty Advisor', 'teacher', 'Supervises assigned students, academic audits, and grade entry', TRUE),
    ('Student', 'student', 'Enrolled student with self-service academic portal access', TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.permissions (name, slug, resource, action, description)
VALUES
    ('View Own Profile', 'profile:read:own', 'profile', 'read', 'Read own student or user profile'),
    ('Update Own Profile', 'profile:update:own', 'profile', 'update', 'Update own preferences and bio'),
    ('View Advisees', 'students:read:assigned', 'students', 'read', 'Inspect assigned student profiles and grades'),
    ('Manage Academic Plans', 'academic:manage:all', 'academic', 'manage', 'Modify course requirements and curriculum'),
    ('Administer System Telemetry', 'system:telemetry:admin', 'telemetry', 'read', 'Inspect deep backend health and APM logs')
ON CONFLICT (slug) DO NOTHING;
