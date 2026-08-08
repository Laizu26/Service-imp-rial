import {
  Mail,
  Briefcase,
  Heart,
  ShieldAlert,
  Coins,
  Scroll,
  MapPin,
  Crown,
  Lock,
  Building2,
  TrendingUp,
  UserPlus,
  MessageCircle,
} from "lucide-react";

// Icônes disponibles pour notif.icon (voir useNotifications.js) — table partagée entre
// la cloche du header et le Centre de Notifications pour rester en phase.
export const NOTIF_ICON_MAP = {
  Mail,
  Briefcase,
  Heart,
  ShieldAlert,
  Coins,
  Scroll,
  MapPin,
  Crown,
  Lock,
  Building2,
  TrendingUp,
  UserPlus,
  MessageCircle,
};

// Une couleur par catégorie (voir les valeurs de `category` posées dans useNotifications.js).
// bg/border utilisent une opacité hexadécimale (20/30) pour rester lisibles en clair et en sombre ;
// text/textDark donnent le bon contraste selon le thème.
export const NOTIF_CATEGORY_COLORS = {
  Messages:         { hex: "#3b82f6", bg: "#3b82f620", border: "#3b82f630", text: "#3b82f6", textDark: "#60a5fa", dot: "#3b82f6" },
  Emploi:           { hex: "#a855f7", bg: "#a855f720", border: "#a855f730", text: "#9333ea", textDark: "#c084fc", dot: "#a855f7" },
  "Liens & Unions": { hex: "#f43f5e", bg: "#f43f5e20", border: "#f43f5e30", text: "#e11d48", textDark: "#fb7185", dot: "#f43f5e" },
  "Vie Civile":     { hex: "#f43f5e", bg: "#f43f5e20", border: "#f43f5e30", text: "#e11d48", textDark: "#fb7185", dot: "#f43f5e" },
  "Main d'Oeuvre":  { hex: "#ef4444", bg: "#ef444420", border: "#ef444430", text: "#dc2626", textDark: "#f87171", dot: "#ef4444" },
  Finances:         { hex: "#eab308", bg: "#eab30820", border: "#eab30830", text: "#b45309", textDark: "#fbbf24", dot: "#eab308" },
  Gazette:          { hex: "#d4af37", bg: "#d4af3720", border: "#d4af3730", text: "#92702a", textDark: "#e8c766", dot: "#d4af37" },
  "Bureau de Poste":{ hex: "#f59e0b", bg: "#f59e0b20", border: "#f59e0b30", text: "#b45309", textDark: "#fbbf24", dot: "#f59e0b" },
  Mushtagram:       { hex: "#e1306c", bg: "#e1306c20", border: "#e1306c30", text: "#be185d", textDark: "#f472b6", dot: "#e1306c" },
};

export const NOTIF_DEFAULT_COLORS = { hex: "#78716c", bg: "#78716c20", border: "#78716c30", text: "#57534e", textDark: "#a8a29e", dot: "#78716c" };

export function notifCategoryColors(category) {
  return NOTIF_CATEGORY_COLORS[category] || NOTIF_DEFAULT_COLORS;
}
