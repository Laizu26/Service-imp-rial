import React from "react";

/**
 * Barre filtres/actions au-dessus d'une DataList.
 *   <Toolbar><SearchField .../><Select .../><Button .../></Toolbar>
 */
const Toolbar = ({ children, className = "", justify = "between" }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center gap-3 justify-${justify} ${className}`}
  >
    {children}
  </div>
);

export default Toolbar;
