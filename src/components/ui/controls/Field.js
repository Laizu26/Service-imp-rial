import React from "react";

/**
 * Wrapper interne : label + helper + error, utilisé par Input/Select/Textarea/…
 * Export nommé `Field` + helpers de classes input partagés.
 */
export const inputClasses = (hasError = false) => `
  w-full px-3 py-2.5 rounded-lg
  bg-surface text-ink placeholder:text-ink-mute
  border ${hasError ? "border-red-400" : "border-outline"}
  focus:outline-none focus:border-imperial-500 focus:shadow-focus-ring
  transition-all text-sm
`;

export const Label = ({ children, htmlFor, required, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`text-eyebrow mb-1.5 block ${className}`}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const Field = ({
  label,
  helper,
  error,
  required,
  htmlFor,
  className = "",
  children,
}) => (
  <div className={className}>
    {label && (
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
    )}
    {children}
    {(error || helper) && (
      <p
        className={`text-[10px] mt-1 ${
          error ? "text-red-500 font-bold" : "text-ink-mute"
        }`}
      >
        {error || helper}
      </p>
    )}
  </div>
);

export default Field;
