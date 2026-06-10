import React from "react";

const SIZE_PX = { 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112 };

const Avatar = ({ citizen, size = 8, rounded = "full", className = "" }) => {
  const dim = `w-${size} h-${size}`;
  const shape = rounded === "full" ? "rounded-full" : "rounded";
  const initial = (citizen?.firstName || citizen?.name || "?")[0].toUpperCase();
  const px = SIZE_PX[size];
  const inlineStyle = px ? { width: px, height: px, minWidth: px, minHeight: px } : undefined;
  if (citizen?.avatarUrl) {
    return <img src={citizen.avatarUrl} alt="" className={`${dim} ${shape} object-cover shrink-0 ${className}`} style={{ ...inlineStyle, objectFit: "cover" }} />;
  }
  return (
    <div className={`${dim} ${shape} bg-stone-700 flex items-center justify-center text-[10px] font-black text-stone-400 shrink-0 ${className}`} style={inlineStyle}>
      {initial}
    </div>
  );
};

export default Avatar;
