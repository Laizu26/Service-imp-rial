import React from "react";

const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
};

/**
 * Grille de formulaire (2 colonnes par défaut).
 *   <FormGrid cols={2}>
 *     <FormRow><Input .../></FormRow>
 *     <FormRow><Select .../></FormRow>
 *   </FormGrid>
 */
export const FormGrid = ({ cols = 2, gap = 4, className = "", children }) => (
  <div className={`grid ${COLS[cols] || COLS[2]} gap-${gap} ${className}`}>
    {children}
  </div>
);

/**
 * Ligne d'un formulaire. Étend `span` pour occuper plusieurs colonnes.
 *   <FormRow span={2}>…</FormRow>
 */
export const FormRow = ({ span = 1, className = "", children }) => {
  const spanClass = span === 2 ? "md:col-span-2" : span === 3 ? "md:col-span-3" : "";
  return <div className={`${spanClass} ${className}`}>{children}</div>;
};

export default FormGrid;
