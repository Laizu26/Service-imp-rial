import React from "react";
import Input from "./Input";

/**
 * Champ numérique avec suffixe (unité).
 *   <NumberInput label="Montant" suffix="Écus" value={amount} onChange={…} />
 */
const NumberInput = React.forwardRef(function NumberInput(
  { suffix, step = "0.1", min, max, value, onChange, className = "", ...rest },
  ref
) {
  return (
    <div className="relative">
      <Input
        ref={ref}
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className={className}
        {...rest}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-mute uppercase tracking-wider pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
});

export default NumberInput;
