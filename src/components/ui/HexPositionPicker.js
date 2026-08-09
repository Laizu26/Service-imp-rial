import React from "react";
import { hexGrid, axialToPixel, hexPoints } from "../../lib/gameUtils";

const SIZE = 22;
const RADIUS = 4; // grille complète de 61 cellules

/**
 * Sélecteur de position sur grille hexagonale — utilisé par l'Atlas pour placer un pays, une
 * région ou un bien sur une cellule précise (coordonnées axiales q,r), au lieu d'un point libre.
 * Les "voisins" (autres éléments du même niveau, déjà placés) s'affichent grisés pour se repérer.
 */
const HexPositionPicker = ({ q = 0, r = 0, siblings = [], onChange, accentColor = "#d97706", height = 220 }) => {
  const cells = hexGrid(RADIUS).map(([cq, cr]) => {
    const [x, y] = axialToPixel(cq, cr, SIZE);
    return { q: cq, r: cr, x, y };
  });
  const xs = cells.map((c) => c.x), ys = cells.map((c) => c.y);
  const pad = SIZE * 1.5;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;

  const siblingAt = (cq, cr) => siblings.find((s) => s.q === cq && s.r === cr);

  return (
    <div>
      <svg
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        className="w-full rounded-lg border-2 border-dashed border-stone-300 bg-stone-50"
        style={{ height }}
      >
        {cells.map(({ q: cq, r: cr, x, y }) => {
          const sib = siblingAt(cq, cr);
          const isSelected = cq === q && cr === r;
          return (
            <g key={`${cq}_${cr}`} onClick={() => onChange(cq, cr)} style={{ cursor: "pointer" }}>
              <polygon
                points={hexPoints(x, y, SIZE - 1.5)}
                fill={isSelected ? accentColor : sib ? "#a8a29e" : "#ffffff"}
                stroke="#d6d3d1"
                strokeWidth={1}
                opacity={isSelected ? 1 : sib ? 0.75 : 0.5}
              />
              {sib && <title>{sib.label}</title>}
            </g>
          );
        })}
      </svg>
      <div className="text-[9px] text-stone-400 font-mono mt-1">Cellule : {q}, {r} — cliquez sur une case pour repositionner</div>
    </div>
  );
};

export default HexPositionPicker;
