import React from "react";

const Avatar = ({ citizen, size = 8, rounded = "full", className = "" }) => {
  const dim = `w-${size} h-${size}`;
  const shape = rounded === "full" ? "rounded-full" : "rounded";
  const initial = (citizen?.firstName || citizen?.name || "?")[0].toUpperCase();
  if (citizen?.avatarUrl) {
    return <img src={citizen.avatarUrl} alt="" className={`${dim} ${shape} object-cover shrink-0 ${className}`} />;
  }
  return (
    <div className={`${dim} ${shape} bg-stone-700 flex items-center justify-center text-[10px] font-black text-stone-400 shrink-0 ${className}`}>
      {initial}
    </div>
  );
};

export default Avatar;
