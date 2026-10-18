import React, { useState, useRef, useEffect } from "react";
import { Search, CheckCircle } from "lucide-react";
import { ROLES } from "../../lib/constants";

const UserSearchSelect = ({
  users,
  onSelect,
  placeholder,
  excludeIds = [],
  value,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const u = users.find((x) => x.id === value);
    setQuery(u ? (u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim()) : "");
  }, [value, users]);

  useEffect(() => {
    const h = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const getName = (u) =>
    u.name ||
    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
    String(u.id || "");

  const filtered = (users || []).filter((u) => {
    if (excludeIds.includes(u.id)) return false;
    const q = query.toLowerCase();
    const nameMatch = getName(u).toLowerCase().includes(q);
    const roleLabel = (ROLES[u.role]?.label || u.role || "").toLowerCase();
    return nameMatch || roleLabel.includes(q);
  });

  return (
    <div className="relative font-sans w-full" ref={wrapperRef}>
      <div className="flex items-center border border-stone-200 rounded-lg bg-white p-2 shadow-sm focus-within:border-stone-500 transition-colors">
        <Search size={14} className="text-stone-400 mr-2" />
        <input
          className="flex-1 text-sm outline-none bg-transparent w-full font-bold text-stone-800"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onSelect("");
          }}
          onFocus={() => setIsOpen(true)}
        />
        {value && (
          <CheckCircle
            size={14}
            className="text-green-500 ml-2 animate-bounce"
          />
        )}
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((u) => (
              <div
                key={u.id}
                className="p-3 hover:bg-stone-50 cursor-pointer text-xs flex justify-between items-center border-b border-stone-50 last:border-0"
                onClick={() => {
                  onSelect(u.id);
                  setQuery(getName(u));
                  setIsOpen(false);
                }}
              >
                <span className="font-bold text-stone-800">{getName(u)}</span>
                <span className="text-stone-400 text-[9px] uppercase tracking-widest">
                  {ROLES[u.role]?.label || u.role || ""}
                </span>
              </div>
            ))
          ) : (
            <div className="p-3 text-stone-400 text-xs italic text-center">
              Aucun résultat
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearchSelect;
