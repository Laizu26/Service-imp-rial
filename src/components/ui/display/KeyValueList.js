import React from "react";

/**
 * Liste label → valeur stylée uniformément.
 *   <KeyValueList items={[{ label: "Nom", value: "Marc" }, …]} />
 */
const KeyValueList = ({
  items = [],
  columns = 1,
  size = "md",
  className = "",
}) => {
  const text = size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs";
  const gridClass =
    columns === 2
      ? "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5"
      : columns === 3
      ? "grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1.5"
      : "space-y-1.5";
  return (
    <dl className={`${gridClass} ${className}`}>
      {items.map((item, i) => (
        <div
          key={item.key || item.label || i}
          className="flex justify-between items-baseline gap-3"
        >
          <dt className={`text-ink-mute ${text} truncate`}>{item.label}</dt>
          <dd className={`font-bold text-ink ${text} text-right truncate`}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default KeyValueList;
