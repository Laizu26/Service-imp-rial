import React from "react";

/**
 * Conteneur racine unique pour toute vue citoyenne.
 * Applique largeur max, centrage, animation d'entrée et padding bas.
 */
const PageContainer = ({ children, className = "", maxWidth = "5xl" }) => (
  <div
    className={`max-w-${maxWidth} mx-auto animate-fadeIn pb-10 space-y-6 ${className}`}
  >
    {children}
  </div>
);

export default PageContainer;
