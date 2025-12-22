import React from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const colors = {
    success: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <div
      className={`fixed bottom-4 right-4 left-4 md:left-auto z-[100] p-4 rounded-lg shadow-xl border flex items-center gap-3 animate-slideIn ${
        colors[type] || colors.info
      }`}
    >
      {type === "success" && <CheckCircle size={16} />}
      {type === "error" && <AlertCircle size={16} />}
      <span className="text-sm font-bold font-sans flex-1">
        {typeof message === "object" ? message.message : message}
      </span>
      <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
