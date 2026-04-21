import React from "react";
import Field, { inputClasses } from "./Field";

const Textarea = React.forwardRef(function Textarea(
  {
    label,
    helper,
    error,
    required,
    id,
    rows = 4,
    className = "",
    ...rest
  },
  ref
) {
  const hasError = !!error;
  const textarea = (
    <textarea
      ref={ref}
      id={id}
      rows={rows}
      className={`${inputClasses(hasError)} resize-y min-h-[80px]`}
      aria-invalid={hasError || undefined}
      {...rest}
    />
  );
  if (!label && !helper && !error) return <div className={className}>{textarea}</div>;
  return (
    <Field
      label={label}
      helper={helper}
      error={error}
      required={required}
      htmlFor={id}
      className={className}
    >
      {textarea}
    </Field>
  );
});

export default Textarea;
