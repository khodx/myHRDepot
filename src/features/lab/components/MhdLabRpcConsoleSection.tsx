import { useState } from 'react';
import { Play, TriangleAlert } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { supabaseClient as mhdSupabase } from '@/lib/supabase/supabaseClient';
import { cn } from '@/utils/cn';

/**
 * Calls supabase.rpc(name, params) directly under the CURRENT session — real
 * or impersonated. This does NOT bypass any server-side authorization: every
 * function still runs its own SECURITY DEFINER checks exactly as it would
 * from any other page, so a call this console makes can fail with the same
 * 42501 a real UI action would. That is the point — it is a raw window onto
 * the same RPCs the app calls, for debugging, not a privilege-escalation
 * shortcut.
 */
export function MhdLabRpcConsoleSection() {
  const [functionName, setFunctionName] = useState('');
  const [paramsText, setParamsText] = useState('{}');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  async function handleRun() {
    setError(null);
    setResult(null);

    const trimmedName = functionName.trim();
    if (!trimmedName) {
      setError('Function name is required.');
      return;
    }

    let params: Record<string, unknown>;
    try {
      params = paramsText.trim().length > 0 ? JSON.parse(paramsText) : {};
    } catch {
      setError('Params must be valid JSON (e.g. {"p_role": "Viewer"}).');
      return;
    }

    setIsRunning(true);
    try {
      // The generated client types `rpc()` to a closed union of known
      // function names — this console exists specifically to call an
      // arbitrary, operator-typed one, so the name/params types are
      // deliberately widened here rather than threaded through as `never`.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
      const { data, error: rpcError } = await (mhdSupabase.rpc as any)(trimmedName, params);
      if (rpcError) {
        setError(`${rpcError.message}${rpcError.hint ? ` — ${rpcError.hint}` : ''}`);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          This runs a real RPC against your current session (respecting whatever role you are
          currently viewing as). Mutating functions here have the exact same effect they would
          from any other page in the app — there is no dry-run mode.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Function name
        </label>
        <input
          type="text"
          value={functionName}
          onChange={(event) => setFunctionName(event.target.value)}
          placeholder="mhd_current_user_roles"
          className="mb-3 h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Params (JSON)
        </label>
        <textarea
          value={paramsText}
          onChange={(event) => setParamsText(event.target.value)}
          rows={6}
          spellCheck={false}
          className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        />

        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={isRunning}
          className={cn(buttonBaseClasses, buttonVariantClasses.primary, 'gap-1.5')}
        >
          <Play className="h-4 w-4" aria-hidden />
          {isRunning ? 'Running…' : 'Run'}
        </button>
      </div>

      {error && (
        <p className="whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result !== null && (
        <pre className="max-h-96 overflow-auto rounded-md border border-border bg-muted p-3 text-xs">
          {result}
        </pre>
      )}
    </div>
  );
}
