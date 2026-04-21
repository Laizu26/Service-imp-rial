import React from "react";

const Switch = React.forwardRef(function Switch(
  { label, helper, checked, onChange, disabled, className = "" },
  ref
) {
  return (
    <label
      className={`flex items-center justify-between gap-3 cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <span className="min-w-0 flex-1">
        {label && (
          <span className="text-sm text-ink block leading-tight">{label}</span>
        )}
        {helper && (
          <span className="text-[10px] text-ink-mute block mt-0.5">
            {helper}
          </span>
        )}
      </span>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
          transition-colors focus-ring
          ${checked ? "bg-imperial-600" : "bg-stone-300"}
        `}
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-5" : "translate-x-0.5"}
          `}
        />
      </button>
    </label>
  );
});

export default Switch;
