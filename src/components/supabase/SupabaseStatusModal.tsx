import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, X, RefreshCw } from 'lucide-react';
import { supabaseService, type SupabaseConnectionReport } from '../../lib/supabase';
import schemaSql from '../../../supabase/schema.sql?raw';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<SupabaseConnectionReport | null>(null);

  if (!isOpen) return null;

  const isConfigured = supabaseService.isConfigured();
  const projectUrl = supabaseService.getProjectUrl();

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(schemaSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? `Could not copy schema SQL: ${err.message}` : 'Could not copy schema SQL.',
        tables: [],
      });
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await supabaseService.testConnection());
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Unable to check the Supabase connection.',
        tables: [],
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#125875] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#0e4359]">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Supabase Database Status
              </h3>
              <p className="text-[11px] text-gray-300">
                Connection checks, schema setup, and access-policy guidance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-[13px] text-gray-700">
          {/* Status Box */}
          <div className={`p-4 rounded-lg border flex items-start gap-3 ${
            testResult?.success ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
          }`}>
            {testResult?.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">
                  {isConfigured ? 'Supabase credentials configured' : 'Supabase not configured'}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  testResult?.success ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {testResult?.success ? 'Verified' : isConfigured ? 'Not yet verified' : 'Local mode'}
                </span>
              </div>
              <p className="mt-1 text-gray-600 leading-relaxed">
                {isConfigured
                  ? `Project URL: ${projectUrl}. Credentials alone do not establish connectivity; run the table checks below.`
                  : 'Supabase is not configured. Configure a project URL and public anon/publishable key in database settings to enable cloud access.'}
              </p>

              {isConfigured && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    <span>{testing ? 'Testing connection...' : 'Test Supabase Connection'}</span>
                  </button>
                </div>
              )}

              {testResult && (
                <div className={`mt-2 p-2 rounded text-xs font-medium border ${
                  testResult.success ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-white border-red-300 text-red-700'
                }`}>
                  <p>{testResult.message}</p>
                  {testResult.tables.length > 0 && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 mt-2 font-normal">
                      {testResult.tables.map((table) => (
                        <li key={table.table} className="flex justify-between gap-2 py-0.5">
                          <span className="font-mono">{table.table}</span>
                          <span>{table.status === 'ready' ? 'Ready' : table.status === 'restricted' ? 'Protected' : table.status === 'missing' ? 'Missing' : 'Unavailable'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-2.5">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>Setup Checklist for Supabase</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600 pl-1">
              <li>
                Create a project at{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-700 hover:underline inline-flex items-center gap-0.5 font-semibold"
                >
                  supabase.com <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                For a new project, run the schema below in the <strong>SQL Editor</strong>. For an existing project, apply the migrations in <code>supabase/migrations</code> in order.
              </li>
              <li>
                Set the project URL and public anon/publishable key in database settings or your deployment environment:
                <div className="bg-gray-800 text-gray-200 p-2 rounded mt-1 font-mono text-[11px] select-all">
                  VITE_SUPABASE_URL=https://your-project.supabase.co<br />
                  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
                </div>
              </li>
              <li>
                Create Auth users for staff, then bootstrap the first administrator from the SQL Editor. Ordinary authenticated users are not admins.
                <pre className="bg-gray-800 text-gray-200 p-2 rounded mt-1 font-mono text-[10px] overflow-x-auto">{`INSERT INTO public.admins (user_id, email)\nSELECT id, email FROM auth.users WHERE lower(email) = lower('admin@example.com')\nON CONFLICT (user_id) DO NOTHING;`}</pre>
              </li>
            </ol>
          </div>

          {/* Copyable SQL Schema */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">Fresh-install PostgreSQL schema</span>
              <button
                type="button"
                onClick={handleCopySchema}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-semibold cursor-pointer border border-gray-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
              </button>
            </div>
            <pre className="bg-[#1e2330] text-gray-200 p-3 rounded text-[11px] font-mono max-h-48 overflow-y-auto border border-gray-800">{schemaSql}</pre>
            <p className="text-[11px] text-gray-500">
              The full schema file is also saved at <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">supabase/schema.sql</code>.
              <strong className="text-gray-700"> Click "Copy SQL Schema" for the complete script with all secure policies.</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0c4ca3] hover:bg-[#093a7d] text-white rounded font-medium text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
