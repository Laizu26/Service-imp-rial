import React from "react";
import { Search } from "lucide-react";
import Input from "./Input";

/**
 * Barre de recherche standardisée.
 *   <SearchField value={q} onChange={setQ} placeholder="Rechercher…" />
 */
const SearchField = React.forwardRef(function SearchField(
  { value, onChange, placeholder = "Rechercher…", className = "", ...rest },
  ref
) {
  return (
    <Input
      ref={ref}
      type="search"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      leftIcon={Search}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  );
});

export default SearchField;
