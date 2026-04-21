import React from "react";

/**
 * Placeholder animé.
 *   <Skeleton className="h-10 w-full" />
 *   <Skeleton rows={4} />
 */
const Skeleton = ({ rows = 1, className = "h-4 w-full", gap = 2 }) => {
  if (rows === 1) {
    return (
      <div
        className={`bg-surface-2 rounded animate-pulse ${className}`}
        aria-hidden
      />
    );
  }
  return (
    <div className={`space-y-${gap}`} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`bg-surface-2 rounded animate-pulse ${className}`}
        />
      ))}
    </div>
  );
};

export default Skeleton;
