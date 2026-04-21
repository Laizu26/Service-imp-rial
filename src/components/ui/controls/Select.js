import React from "react";
import Field, { inputClasses } from "./Field";

const Select = React.forwardRef(function Select(
  {
    label,
    helper,
    error,
    required,
    id,
    options = [],
    placeholder,
    children,
    className = "",
    ...rest
  },
  ref
) {
  const hasError = !!error;
  const select = (
    <select
      ref={ref}
      id={id}
      className={`${inputClasses(hasError)} appearance-none bg-no-repeat pr-9`}
      style={{
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23a8a29e\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')",
        backgroundPosition: "right 10px center",
      }}
      aria-invalid={hasError || undefined}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.length > 0
        ? options.map((opt) =>
            typeof opt === "string" ? (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ) : (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            )
          )
        : children}
    </select>
  );
  if (!label && !helper && !error) return <div className={className}>{select}</div>;
  return (
    <Field
      label={label}
      helper={helper}
      error={error}
      required={required}
      htmlFor={id}
      className={className}
    >
      {select}
    </Field>
  );
});

export default Select;
