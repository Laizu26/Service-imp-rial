import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

const SecureDeleteButton = ({ onClick, className = "" }) => {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let t;
    if (confirming) t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        confirming ? onClick(e) : setConfirming(true);
      }}
      className={`transition-all duration-200 p-2 rounded-lg flex items-center gap-2 ${
        confirming
          ? "bg-red-600 text-white px-4 scale-105"
          : "text-red-400 hover:text-red-600 hover:bg-red-50"
      } ${className}`}
      title="Supprimer"
    >
      <Trash2 size={16} className={confirming ? "animate-pulse" : ""} />
      {confirming && (
        <span className="text-[10px] font-black uppercase whitespace-nowrap">
          Confirmer ?
        </span>
      )}
    </button>
  );
};

export default SecureDeleteButton;
