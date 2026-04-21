import React from "react";

const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
};

/**
 * Grille responsive uniforme pour empiler StatTile / Section côte à côte.
 *   <SectionGroup cols={4} gap={3}>…</SectionGroup>
 */
const SectionGroup = ({ cols = 3, gap = 4, className = "", children }) => (
  <div className={`grid ${COLS[cols] || COLS[3]} gap-${gap} ${className}`}>
    {children}
  </div>
);

export default SectionGroup;
