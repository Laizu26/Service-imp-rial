import React from "react";
import EmptyState from "./EmptyState";
import Skeleton from "./Skeleton";

/**
 * Liste générique (colonnes déclaratives).
 *
 *   <DataList
 *     items={rows}
 *     columns={[
 *       { key: "name",   header: "Nom",     render: (row) => row.name },
 *       { key: "amount", header: "Montant", render: (row) => <MoneyAmount value={row.amount}/>, align: "right" },
 *     ]}
 *     getKey={(row) => row.id}
 *     empty={<EmptyState title="Aucun élément" />}
 *     loading={false}
 *     onRowClick={(row) => …}
 *     variant="rows" // "rows" | "table"
 *     maxHeight="max-h-[600px]"
 *   />
 */
const DataList = ({
  items = [],
  columns = [],
  getKey,
  empty,
  loading = false,
  loadingRows = 4,
  onRowClick,
  variant = "rows",
  maxHeight,
  renderRow,
  className = "",
}) => {
  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <Skeleton rows={loadingRows} className="h-12 w-full" gap={2} />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className={className}>
        {empty || <EmptyState title="Aucun élément" />}
      </div>
    );
  }

  const scrollClass = maxHeight ? `${maxHeight} overflow-y-auto` : "";

  // Mode "renderRow" libre : la vue décide intégralement comment rendre chaque ligne
  if (renderRow) {
    return (
      <div className={`${scrollClass} divide-y divide-hairline ${className}`}>
        {items.map((row, i) => (
          <div key={getKey ? getKey(row) : row.id || i}>{renderRow(row, i)}</div>
        ))}
      </div>
    );
  }

  // Mode "table" : entête + cellules alignées
  if (variant === "table") {
    return (
      <div className={`${scrollClass} ${className}`}>
        <table className="w-full">
          <thead className="bg-surface-2 border-b border-hairline">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`text-eyebrow px-3 py-2 ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {items.map((row, i) => (
              <tr
                key={getKey ? getKey(row) : row.id || i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={
                  onRowClick ? "cursor-pointer hover:bg-surface-hover" : ""
                }
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-2 text-sm ${
                      c.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Mode "rows" : chaque ligne occupe toute la largeur, colonnes rendues en flex
  return (
    <div className={`${scrollClass} divide-y divide-hairline ${className}`}>
      {items.map((row, i) => {
        const key = getKey ? getKey(row) : row.id || i;
        return (
          <div
            key={key}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`flex items-center gap-3 px-4 py-3 ${
              onRowClick ? "cursor-pointer hover:bg-surface-hover" : ""
            }`}
          >
            {columns.map((c) => (
              <div
                key={c.key}
                className={`${c.flex || "flex-1"} min-w-0 ${
                  c.align === "right" ? "text-right" : ""
                }`}
              >
                {c.render ? c.render(row) : row[c.key]}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default DataList;
