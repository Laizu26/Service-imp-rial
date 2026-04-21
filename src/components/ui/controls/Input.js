import React from "react";
import Field, { inputClasses } from "./Field";

const Input = React.forwardRef(function Input(
  {
    label,
    helper,
    error,
    required,
    id,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = "",
    ...rest
  },
  ref
) {
  const hasError = !!error;
  const input = (
    <div className="relative">
      {LeftIcon && (
        <LeftIcon
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none"
        />
      )}
      <input
        ref={ref}
        id={id}
        className={`
          ${inputClasses(hasError)}
          ${LeftIcon ? "pl-9" : ""}
          ${RightIcon ? "pr-9" : ""}
        `}
        aria-invalid={hasError || undefined}
        {...rest}
      />
      {RightIcon && (
        <RightIcon
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute pointer-events-none"
        />
      )}
    </div>
  );
  if (!label && !helper && !error) return <div className={className}>{input}</div>;
  return (
    <Field
      label={label}
      helper={helper}
      error={error}
      required={required}
      htmlFor={id}
      className={className}
    >
      {input}
    </Field>
  );
});

export default Input;
