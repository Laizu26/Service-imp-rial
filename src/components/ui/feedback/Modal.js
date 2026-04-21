import React, { useEffect } from "react";
import { X } from "lucide-react";
import IconButton from "../controls/IconButton";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * Modale de base (overlay + shell).
 *   <Modal open={open} onClose={…} title="…" size="md" footer={…}>…</Modal>
 */
const Modal = ({
  open,
  onClose,
  title,
  icon: Icon,
  size = "md",
  footer,
  children,
  className = "",
  closeOnOverlay = true,
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={() => {
        if (closeOnOverlay && onClose) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          w-full ${SIZES[size] || SIZES.md}
          bg-surface border border-hairline rounded-tile shadow-imperial
          overflow-hidden max-h-[90vh] flex flex-col
          ${className}
        `}
      >
        {(title || onClose) && (
          <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-hairline">
            <div className="flex items-center gap-2 min-w-0">
              {Icon && <Icon size={16} className="text-imperial-600 shrink-0" />}
              {title && (
                <h3 className="font-display text-lg font-bold text-ink truncate">
                  {title}
                </h3>
              )}
            </div>
            {onClose && (
              <IconButton
                icon={X}
                aria-label="Fermer"
                onClick={onClose}
                size="sm"
              />
            )}
          </header>
        )}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <footer className="px-5 py-3 border-t border-hairline bg-surface-2/50 flex items-center justify-end gap-2">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export default Modal;
