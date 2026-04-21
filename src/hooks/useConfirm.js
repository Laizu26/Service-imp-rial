import React, { useState, useCallback } from "react";
import ConfirmDialog from "../components/ui/feedback/ConfirmDialog";

/**
 * Hook de confirmation basé sur ConfirmDialog.
 * Remplace tous les `window.confirm`.
 *
 *   const { confirm, dialog } = useConfirm();
 *   …
 *   const ok = await confirm({ title: "Rembourser ?", message: "…", danger: true });
 *   if (ok) onPay();
 *   …
 *   return (<>{…}{dialog}</>);
 */
export default function useConfirm() {
  const [state, setState] = useState({ open: false, opts: null, resolve: null });

  const confirm = useCallback(
    (opts = {}) =>
      new Promise((resolve) => {
        setState({ open: true, opts, resolve });
      }),
    []
  );

  const close = useCallback(
    (value) => {
      if (state.resolve) state.resolve(value);
      setState({ open: false, opts: null, resolve: null });
    },
    [state]
  );

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.opts?.title}
      message={state.opts?.message}
      confirmLabel={state.opts?.confirmLabel}
      cancelLabel={state.opts?.cancelLabel}
      danger={state.opts?.danger}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );

  return { confirm, dialog };
}
