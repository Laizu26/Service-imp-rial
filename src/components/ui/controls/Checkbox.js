import React from "react";

const Checkbox = React.forwardRef(function Checkbox(
  { label, helper, id, className = "", ...rest },
  ref
) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-2 cursor-pointer select-none ${className}`}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-outline text-imperial-600 focus:ring-imperial focus:ring-2"
        {...rest}
      />
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
    </label>
  );
});

export default Checkbox;
