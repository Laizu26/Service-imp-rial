import { useState, useCallback } from "react";

/**
 * Wrappe une action async : gère loading / error / success.
 *
 *   const submit = useFormSubmit(async () => { await doStuff(); });
 *   <Button loading={submit.loading} onClick={submit.run}>Enregistrer</Button>
 *   {submit.error && <p className="text-red-500 text-xs">{submit.error}</p>}
 */
export default function useFormSubmit(action, { onSuccess, onError } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = action ? await action(...args) : undefined;
        if (onSuccess) onSuccess(result);
        return { ok: true, result };
      } catch (err) {
        const message = err?.message || String(err) || "Une erreur est survenue";
        setError(message);
        if (onError) onError(err);
        return { ok: false, error: err };
      } finally {
        setLoading(false);
      }
    },
    [action, onSuccess, onError]
  );

  return { run, loading, error, reset: () => setError(null) };
}
