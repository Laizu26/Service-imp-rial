import React from "react";
import { Calendar } from "lucide-react";

/**
 * Tag de date/horodatage uniforme.
 *   <DateTag timestamp={ts} format="datetime" />
 *   <DateTag text="Fin du cycle" />
 */
const DateTag = ({
  timestamp,
  text,
  format = "datetime",
  icon = true,
  className = "",
}) => {
  let label = text;
  if (timestamp && !text) {
    const d = new Date(timestamp);
    if (format === "date") {
      label = d.toLocaleDateString("fr-FR");
    } else if (format === "long") {
      label = d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      label = d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] text-numeric text-ink-mute ${className}`}
    >
      {icon && <Calendar size={10} />}
      {label || "—"}
    </span>
  );
};

export default DateTag;
