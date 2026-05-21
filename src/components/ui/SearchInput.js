import React from "react";
import { Search, X } from "lucide-react";

const SearchInput = ({ value, onChange, placeholder = "Rechercher…", className = "", inputClassName = "" }) => (
  <div className={`relative ${className}`}>
    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full bg-stone-800 border border-stone-700 rounded-lg pl-8 pr-8 py-2 text-xs text-stone-200 outline-none focus:border-amber-500/50 ${inputClassName}`}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange({ target: { value: "" } })}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
      >
        <X size={11} />
      </button>
    )}
  </div>
);

export default SearchInput;
