import React, { useState, useEffect } from 'react';
import { 
  Database, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, ExternalLink, X, Key, Globe, Shield
} from 'lucide-react';
import { 
  getSupabaseConfig, setSupabaseCredentials, clearSupabaseCredentials, 
  isSupabaseConfigured, supabaseService, type SupabaseConnectionReport
} from '../../lib/supabase';
import schemaSql from '../../../supabase/schema.sql?raw';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged?: () => void;
}

export const DatabaseConfigModal: React.FC<Props> = ({ isOpen, onClose, onConnectionChanged }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<SupabaseConnectionReport | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Please provide both the Supabase Project URL and Anon Public Key.',
        tables: [],
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      setSupabaseCredentials(cleanUrl, cleanKey);
      const result = await supabaseService.testConnection();
      setTestResult(result);
      if (onConnectionChanged) onConnectionChanged();
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to configure Supabase.',
        tables: [],
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = () => {
    try {
      clearSupabaseCredentials();
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      onConnectionChanged?.();
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Could not disconnect Supabase.',
        tables: [],
      });
    }
  };

  const copySqlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(schemaSql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? `Could not copy schema SQL: ${err.message}` : 'Could not copy schema SQL.',
        tables: [],
      });
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-[#202738] via-[#243048] to-[#125875] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-400/30">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Supabase Database Connection</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                }`}>
                  {isConfigured ? 'Configured' : 'Not Connected'}
                </span>
              </h2>
              <p className="text-xs text-gray-300">
                Configure and verify the SIS Supabase database connection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          <div className={`p-3.5 rounded-lg border ${
            testResult?.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : testResult
                ? 'bg-red-50 border-red-300 text-red-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            <p className="font-bold text-[13px]">
              {testResult
                ? testResult.success ? 'Supabase database verified' : 'Supabase connection check failed'
                : isConfigured ? 'Credentials configured; connection not verified' : 'Supabase not configured'}
            </p>
            <p className="text-[11px] mt-1">
              {url ? `Project: ${(() => { try { return new URL(url).host; } catch { return url; } })()}` : 'Set a project URL and public anon/publishable key below.'}
            </p>
          </div>

          {/* Test connection result notice */}
          {testResult && (
            <div className={`p-3 rounded-md border flex items-start gap-2 ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-[11.5px]">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.tables.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 mt-2">
                    {testResult.tables.map((table) => (
                      <li key={table.table} className="flex justify-between gap-2 py-0.5">
                        <span className="font-mono">{table.table}</span>
                        <span>{table.status === 'ready' ? 'Ready' : table.status === 'restricted' ? 'Protected' : table.status === 'missing' ? 'Missing' : 'Unavailable'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSaveAndTest} className="space-y-3.5">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  Supabase Project URL:
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Found in Project Settings &gt; API
                </span>
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzprojectid.supabase.co"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0c4ca3] focus:border-[#0c4ca3] font-mono text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-gray-400" />
                  Supabase Anon Key (Public):
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Project API keys &gt; anon public
                </span>
              </label>
              <input
                type="text"
                required
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0c4ca3] focus:border-[#0c4ca3] font-mono text-xs bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={testing}
                className="flex-1 bg-[#0c4ca3] hover:bg-[#093d84] text-white py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Connection...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Connect & Test Supabase</span>
                  </>
                )}
              </button>

              {isConfigured && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-200 hover:border-red-200 py-2 px-3 rounded-md font-semibold text-xs transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              )}
            </div>

          </form>

          {/* Quick SQL Schema Helper */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#0c4ca3]" />
                Database Schema SQL
              </span>
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="text-[#0c4ca3] hover:text-[#093d84] font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">
              For a new project, run this script in <strong>Supabase Dashboard &gt; SQL Editor</strong>. For an existing project, apply the versioned migrations instead.
            </p>
            <button
              type="button"
              onClick={() => setShowSchema(!showSchema)}
              className="text-[10.5px] text-gray-600 hover:text-gray-900 underline cursor-pointer"
            >
              {showSchema ? 'Hide SQL schema preview' : 'View SQL schema preview'}
            </button>
            {showSchema && (
              <pre className="mt-2 p-2.5 bg-gray-900 text-gray-100 rounded text-[10px] font-mono overflow-x-auto max-h-48 leading-relaxed">{schemaSql}</pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-semibold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
