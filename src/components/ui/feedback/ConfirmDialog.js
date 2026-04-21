import React from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import Button from "../controls/Button";

/**
 * Boîte de confirmation unique. Remplace window.confirm.
 *   <ConfirmDialog
 *     open={true}
 *     title="Rembourser ?"
 *     message="Confirmer le remboursement de 150 Écus ?"
 *     confirmLabel="Rembourser"
 *     danger
 *     onConfirm={…}
 *     onCancel={…}
 *   />
 */
const ConfirmDialog = ({
  open,
  title = "Confirmer",
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Modal
    open={open}
    onClose={loading ? undefined : onCancel}
    title={title}
    icon={danger ? AlertTriangle : undefined}
    size="sm"
    closeOnOverlay={!loading}
    footer={
      <>
        <Button
          variant="subtle"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    {typeof message === "string" ? (
      <p className="text-sm text-ink-soft leading-relaxed">{message}</p>
    ) : (
      message
    )}
  </Modal>
);

export default ConfirmDialog;
