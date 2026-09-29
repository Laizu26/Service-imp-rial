import React, { useState } from "react";
import {
  MapPin, Shield, MessageSquare, Lock, Home, Utensils, Eye,
  Package, Hammer, ShoppingBag, Calendar, Plus, Trash2, X, ArrowLeft,
  Crown, UserPlus, Pencil, Save, TrendingUp, Building2,
  Navigation, Unlock, CheckCircle, UserCheck, Landmark, Mail,
  ChevronDown, ChevronUp,
} from "lucide-react";
import Card from "../ui/Card";
import UserSearchSelect from "../ui/UserSearchSelect";

const PROP_TYPES = {
  MAISON: "Maison", DOMAINE: "Domaine", TERRAIN: "Terrain",
  COMMERCE: "Local Commercial", FERME: "Ferme",
  MANOIR: "Manoir / Château", ATELIER: "Atelier", AUBERGE: "Auberge / Taverne",
};

const TYPE_COLORS = {
  MAISON:   "#78716C",
  DOMAINE:  "#16A34A",
  TERRAIN:  "#F59E0B",
  COMMERCE: "#3B82F6",
  FERME:    "#22C55E",
  MANOIR:   "#EAB308",
  ATELIER:  "#F97316",
  AUBERGE:  "#EC4899",
};

// Tous les onglets possibles par type
const TYPE_TABS = {
  MANOIR:   ["garnison", "cachot", "audiences", "voyage", "banque", "poste", "personnel", "evenements"],
  AUBERGE:  ["chambres", "taverne", "rumeurs", "menu", "voyage", "banque", "poste", "personnel", "evenements"],
  FERME:    ["production", "voyage", "banque", "poste", "personnel", "evenements"],
  ATELIER:  ["fabrication", "voyage", "banque", "poste", "personnel", "evenements"],
  COMMERCE: ["boutique", "voyage", "banque", "poste", "personnel", "evenements"],
  MAISON:   ["voyage", "banque", "poste", "personnel", "evenements"],
  DOMAINE:  ["voyage", "banque", "poste", "personnel", "evenements"],
  TERRAIN:  ["voyage", "banque", "poste", "personnel", "evenements"],
};

// Onglets désactivés par défaut — activables par le propriétaire
const DEFAULT_DISABLED = ["voyage", "banque", "poste"];

const TAB_LABELS = {
  garnison:    "Garnison",
  cachot:      "Cachot",
  audiences:   "Audiences",
  chambres:    "Chambres",
  taverne:     "Taverne",
  rumeurs:     "Rumeurs",
  menu:        "Menu",
  production:  "Production",
  fabrication: "Fabrication",
  boutique:    "Boutique",
  voyage:      "Voyages",
  banque:      "Banque",
  poste:       "Poste",
  personnel:   "Personnel",
  evenements:  "Événements",
};

/* ─────────────────────────────────────────────────────────
   Écran "magie dormante" — affiché quand un onglet est désactivé
───────────────────────────────────────────────────────── */
const DORMANT_MESSAGES = {
  voyage:      { title: "Les routes dorment", text: "Les chemins existent, les cartes sont tracées… mais nul ne s'est encore levé pour partir.", color: "#6366F1" },
  garnison:    { title: "Les casernes sont vides", text: "Les armures rouillent en silence. Personne ne monte la garde.", color: "#64748B" },
  cachot:      { title: "Le cachot sommeille", text: "Les chaînes reposent, froides et inutilisées. La pierre attend.", color: "#475569" },
  audiences:   { title: "Le trône est désert", text: "La salle résonne du silence des non-dits. Aucune requête ne peut être entendue.", color: "#A16207" },
  chambres:    { title: "Les chambres sont fermées", text: "Les clés pendent au mur, les lits restent défaits. Aucun voyageur ne peut se reposer ici.", color: "#0369A1" },
  taverne:     { title: "La taverne est close", text: "Le feu de l'âtre est éteint. Pas un murmure, pas un rire.", color: "#92400E" },
  rumeurs:     { title: "Le silence règne", text: "Le tableau est vierge. Les secrets restent secrets.", color: "#78716C" },
  menu:        { title: "Les cuisines sont froides", text: "Aucun repas ne se prépare. La faim restera insatisfaite.", color: "#15803D" },
  production:  { title: "Les champs reposent", text: "La terre est fertile, mais aucune graine n'a encore été semée.", color: "#16A34A" },
  fabrication: { title: "L'atelier est silencieux", text: "Les outils attendent. Le feu de la forge n'a pas encore été allumé.", color: "#C2410C" },
  boutique:    { title: "L'étal est vide", text: "Le commerce n'a pas encore débuté. Rien à acheter, rien à vendre.", color: "#1D4ED8" },
  banque:      { title: "Le coffre est vide", text: "Les pièces n'ont pas encore trouvé leur chemin jusqu'ici. Nul ne peut déposer ni retirer en ces murs.", color: "#D97706" },
  poste:       { title: "Le bureau est fermé", text: "Les lettres s'accumulent, sans destinataire ni sceau. Nul courrier ne peut transiter par ici.", color: "#7C3AED" },
  personnel:   { title: "Aucun serviteur", text: "Ces murs n'ont pas encore connu le pas des employés fidèles.", color: "#6D28D9" },
  evenements:  { title: "Aucune fête prévue", text: "Le calendrier est vierge. Aucune célébration n'a été annoncée.", color: "#BE185D" },
};

const DormantScreen = ({ tabId, isOwner, onActivate }) => {
  const msg = DORMANT_MESSAGES[tabId] || { title: "Fonctionnalité dormante", text: "Cette magie est présente, mais en bien trop faible quantité pour fonctionner.", color: "#6366F1" };
  const c = msg.color;

  return (
    <div className="relative overflow-hidden rounded-xl min-h-[320px] flex flex-col items-center justify-center p-8 text-center select-none"
      style={{ background: `linear-gradient(160deg, #0f0e17 0%, #1a1625 50%, #0f0e17 100%)` }}
    >
      <style>{`
        @keyframes dormant-orb {
          0%, 100% { box-shadow: 0 0 24px 6px ${c}44, 0 0 60px 12px ${c}22; transform: scale(1); }
          50%       { box-shadow: 0 0 48px 16px ${c}88, 0 0 100px 30px ${c}33; transform: scale(1.04); }
        }
        @keyframes dormant-ring {
          0%   { transform: rotate(0deg) scale(1);   opacity: 0.15; }
          50%  { transform: rotate(180deg) scale(1.08); opacity: 0.35; }
          100% { transform: rotate(360deg) scale(1);  opacity: 0.15; }
        }
        @keyframes dormant-particle {
          0%   { opacity: 0;   transform: translateY(0px)   scale(0.4); }
          20%  { opacity: 0.9; }
          80%  { opacity: 0.5; }
          100% { opacity: 0;   transform: translateY(-90px) scale(0.1); }
        }
        @keyframes dormant-text {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.85; }
        }
        @keyframes dormant-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>

      {/* Anneau tournant */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full border opacity-20"
          style={{ borderColor: c, animation: "dormant-ring 8s linear infinite" }} />
        <div className="absolute w-48 h-48 rounded-full border opacity-10"
          style={{ borderColor: c, animation: "dormant-ring 5s linear infinite reverse" }} />
      </div>

      {/* Particules */}
      {[
        { left: "20%", delay: "0s",    size: 5 },
        { left: "35%", delay: "0.8s",  size: 3 },
        { left: "50%", delay: "1.6s",  size: 6 },
        { left: "65%", delay: "0.4s",  size: 4 },
        { left: "78%", delay: "1.2s",  size: 3 },
        { left: "42%", delay: "2.0s",  size: 5 },
        { left: "58%", delay: "2.4s",  size: 3 },
        { left: "27%", delay: "1.9s",  size: 4 },
      ].map((p, i) => (
        <div key={i}
          className="absolute bottom-16 rounded-full pointer-events-none"
          style={{
            left: p.left,
            width: p.size, height: p.size,
            backgroundColor: c,
            animation: `dormant-particle 3.5s ease-in infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Orbe central */}
      <div className="relative z-10 mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${c}cc, ${c}44 60%, transparent)`,
            animation: "dormant-orb 3s ease-in-out infinite",
          }}
        >
          <Lock size={28} style={{ color: c, opacity: 0.8 }} />
        </div>
      </div>

      {/* Titre */}
      <h3 className="text-lg font-black font-serif mb-2 z-10"
        style={{ color: c, filter: "brightness(1.4)", animation: "dormant-text 3s ease-in-out infinite" }}
      >
        {msg.title}
      </h3>

      {/* Texte principal avec effet shimmer */}
      <p className="text-sm font-serif italic z-10 max-w-xs leading-relaxed"
        style={{
          background: `linear-gradient(90deg, #ffffff44 0%, #ffffffcc 40%, #ffffffee 50%, #ffffffcc 60%, #ffffff44 100%)`,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "dormant-shimmer 4s linear infinite",
        }}
      >
        {msg.text}
      </p>

      <p className="text-xs mt-3 z-10"
        style={{ color: c + "99", animation: "dormant-text 3s ease-in-out infinite", animationDelay: "1.5s" }}
      >
        Cette magie est présente, mais en bien trop faible quantité pour fonctionner.
      </p>

      {/* Bouton propriétaire */}
      {isOwner && (
        <button
          onClick={onActivate}
          className="mt-6 z-10 flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all hover:scale-105"
          style={{
            backgroundColor: c + "22",
            color: c,
            border: `1px solid ${c}55`,
          }}
        >
          <Unlock size={13} /> Activer cette fonctionnalité
        </button>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Composant principal
───────────────────────────────────────────────────────── */
const PropertyDetailView = ({
  property,
  citizens = [],
  user,
  session,
  isOwner,
  onUpdatePropertyFeature,
  onAddGarrison, onRemoveGarrison,
  onImprison, onReleasePrisoner,
  onRequestAudience, onRespondAudience,
  onSetupRooms, onBookRoom, onCheckoutRoom,
  onPostTavernMessage, onPostRumor, onDeleteRumor,
  onBuyFromMenu, onBuyFromShop,
  onAddPropertyStaff, onRemovePropertyStaff,
  onAddPropertyEvent, onRemovePropertyEvent,
  onBack,
}) => {
  const prop = property;
  const type = prop?.type || "MAISON";
  const tabs = TYPE_TABS[type] || ["voyage", "personnel", "evenements"];

  // Features désactivées (par défaut : voyage)
  const disabledFeatures = prop.disabledFeatures ?? DEFAULT_DISABLED;
  const isTabDisabled = (tab) => disabledFeatures.includes(tab);

  const toggleFeature = (tab) => {
    if (!onUpdatePropertyFeature) return;
    const current = prop.disabledFeatures ?? DEFAULT_DISABLED;
    const next = current.includes(tab)
      ? current.filter((t) => t !== tab)
      : [...current, tab];
    onUpdatePropertyFeature(prop.id, "disabledFeatures", next);
  };

  const [activeTab, setActiveTab] = useState(tabs[0]);

  // Formulaires
  const [staffCitizenId, setStaffCitizenId] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [staffSalary, setStaffSalary] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [tavernMsg, setTavernMsg] = useState("");
  const [rumorText, setRumorText] = useState("");
  const [audienceSubject, setAudienceSubject] = useState("");
  const [audienceText, setAudienceText] = useState("");
  const [prisonCitizen, setPrisonCitizen] = useState("");
  const [prisonReason, setPrisonReason] = useState("");
  const [garrisonCitizen, setGarrisonCitizen] = useState("");
  // Chambres
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPrice, setNewRoomPrice] = useState("");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomPrice, setEditRoomPrice] = useState("");
  // Production
  const [prodItem, setProdItem] = useState(prop?.production?.itemName || "");
  const [prodQty, setProdQty] = useState(prop?.production?.qtyPerDay || "");
  // Boutique
  const [shopItemName, setShopItemName] = useState("");
  const [shopItemQty, setShopItemQty] = useState("");
  const [shopItemPrice, setShopItemPrice] = useState("");
  // Menu
  const [menuItemName, setMenuItemName] = useState("");
  const [menuItemPrice, setMenuItemPrice] = useState("");
  const [menuItemStock, setMenuItemStock] = useState("");
  // Atelier
  const [recipeInputItem, setRecipeInputItem] = useState("");
  const [recipeInputQty, setRecipeInputQty] = useState("");
  const [recipeOutputItem, setRecipeOutputItem] = useState("");
  const [recipeOutputQty, setRecipeOutputQty] = useState("");
  // Banque
  const [vaultAmount, setVaultAmount] = useState("");
  const [vaultNote, setVaultNote] = useState("");
  // Poste
  const [letterTo, setLetterTo] = useState("");
  const [letterSubject, setLetterSubject] = useState("");
  const [letterContent, setLetterContent] = useState("");
  const [letterSeal, setLetterSeal] = useState("NORMAL");
  const [expandedLetter, setExpandedLetter] = useState(null);
  // Voyage
  const [voyageDest, setVoyageDest] = useState("");
  const [voyageDate, setVoyageDate] = useState("");
  const [voyageDesc, setVoyageDesc] = useState("");
  const [voyageSpots, setVoyageSpots] = useState("");

  if (!prop) return null;

  const accentColor = TYPE_COLORS[type] || "#78716C";

  const handleVoyageSignup = (voyageId) => {
    if (!onUpdatePropertyFeature) return;
    const updated = (prop.voyages || []).map((v) =>
      v.id === voyageId
        ? { ...v, signups: [...(v.signups || []), { id: user.id, name: user.name }] }
        : v
    );
    onUpdatePropertyFeature(prop.id, "voyages", updated);
  };

  const handleVoyageLeave = (voyageId) => {
    if (!onUpdatePropertyFeature) return;
    const updated = (prop.voyages || []).map((v) =>
      v.id === voyageId
        ? { ...v, signups: (v.signups || []).filter((s) => s.id !== user.id) }
        : v
    );
    onUpdatePropertyFeature(prop.id, "voyages", updated);
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-10">

      {/* ── HEADER ── */}
      <div
        className="bg-white border-l-8 p-6 rounded-r-xl shadow-lg flex flex-col md:flex-row justify-between items-start gap-4"
        style={{ borderColor: accentColor }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={onBack} className="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded hover:bg-stone-100">
              <ArrowLeft size={18} />
            </button>
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ color: accentColor, backgroundColor: accentColor + "18" }}
            >
              {PROP_TYPES[type] || type}
            </span>
            {isOwner && (
              <span className="bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-yellow-200">
                Propriétaire
              </span>
            )}
          </div>

          <h1 className="text-3xl font-black font-serif text-stone-900 leading-tight">{prop.name}</h1>

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-stone-500">
            {prop.location && (
              <span className="flex items-center gap-1"><MapPin size={12} className="text-stone-400" /> {prop.location}</span>
            )}
            {prop.ownerName && (
              <span className="flex items-center gap-1">
                <Building2 size={12} className="text-stone-400" />
                {prop.ownerName}{prop.ownerType === "COMPANY" ? " (Entreprise)" : ""}
              </span>
            )}
          </div>

          {prop.description && (
            <p className="text-sm text-stone-500 mt-3 leading-relaxed max-w-lg italic">"{prop.description}"</p>
          )}
        </div>

        {(prop.price > 0 || (prop.income || 0) > 0) && (
          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            {prop.price > 0 && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-right min-w-[150px]">
                <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Valeur estimée</div>
                <div className="text-2xl font-mono font-black text-stone-800">
                  {prop.price.toLocaleString()} <span className="text-sm font-bold text-stone-500">Écus</span>
                </div>
              </div>
            )}
            {(prop.income || 0) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-right min-w-[150px]">
                <div className="text-[10px] font-black uppercase text-green-500 tracking-widest mb-1 flex items-center justify-end gap-1">
                  <TrendingUp size={10} /> Revenu / jour
                </div>
                <div className="text-2xl font-mono font-black text-green-700">
                  +{prop.income} <span className="text-sm font-bold text-green-500">Écus</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BARRE D'ONGLETS ── */}
      <div className="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto items-end">
        {tabs.map((tab) => {
          const disabled = isTabDisabled(tab);
          const active = activeTab === tab;
          return (
            <div key={tab} className="relative group">
              <button
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  active
                    ? "bg-stone-800 text-white"
                    : disabled
                    ? "text-stone-300 hover:bg-stone-50"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                {disabled && <Lock size={9} className={active ? "text-stone-400" : "text-stone-300"} />}
                {TAB_LABELS[tab]}
              </button>
              {/* Toggle propriétaire au survol */}
              {isOwner && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFeature(tab); }}
                  title={disabled ? "Activer" : "Désactiver"}
                  className="absolute -top-2 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-stone-200 rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:bg-stone-50"
                >
                  {disabled
                    ? <Unlock size={9} className="text-green-500" />
                    : <Lock size={9} className="text-stone-400" />
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── CONTENU : écran dormant si désactivé ── */}
      {isTabDisabled(activeTab) ? (
        <DormantScreen
          tabId={activeTab}
          isOwner={isOwner}
          onActivate={() => toggleFeature(activeTab)}
        />
      ) : (
        <>
          {/* ── GARNISON ── */}
          {activeTab === "garnison" && (
            <Card title="Garnison" icon={Shield}>
              <div className="space-y-2">
                {(prop.garrison || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucun garde assigné.</p>}
                {(prop.garrison || []).map((g) => (
                  <div key={g.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2 text-sm border border-stone-100">
                    <span className="font-bold text-stone-700">{g.name}</span>
                    {isOwner && <button onClick={() => onRemoveGarrison(prop.id, g.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>}
                  </div>
                ))}
                {isOwner && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                    <div className="flex-1"><UserSearchSelect users={citizens} onSelect={setGarrisonCitizen} value={garrisonCitizen} placeholder="Ajouter un garde..." /></div>
                    <button onClick={() => { if (garrisonCitizen) { onAddGarrison(prop.id, garrisonCitizen); setGarrisonCitizen(""); } }} disabled={!garrisonCitizen} className="bg-stone-800 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50 flex items-center gap-1">
                      <Plus size={12} /> Ajouter
                    </button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── CACHOT ── */}
          {activeTab === "cachot" && (
            <Card title="Cachot" icon={Lock}>
              <div className="space-y-2">
                {(prop.dungeon || []).length === 0 && <p className="text-stone-400 text-xs italic">Le cachot est vide.</p>}
                {(prop.dungeon || []).map((d) => (
                  <div key={d.citizenId} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs">
                    <div><span className="font-bold text-red-700">{d.citizenName}</span>{d.reason && <span className="text-red-500 ml-2">— {d.reason}</span>}</div>
                    {isOwner && <button onClick={() => onReleasePrisoner(prop.id, d.citizenId)} className="text-green-700 text-[10px] font-bold uppercase border border-green-200 bg-green-50 px-2 py-1 rounded hover:bg-green-100">Libérer</button>}
                  </div>
                ))}
                {isOwner && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                    <div className="flex-1"><UserSearchSelect users={citizens} onSelect={setPrisonCitizen} value={prisonCitizen} placeholder="Emprisonner..." /></div>
                    <input className="w-32 p-1.5 border rounded text-xs" placeholder="Motif" value={prisonReason} onChange={(e) => setPrisonReason(e.target.value)} />
                    <button onClick={() => { if (prisonCitizen) { onImprison(prop.id, prisonCitizen, prisonReason); setPrisonCitizen(""); setPrisonReason(""); } }} disabled={!prisonCitizen} className="bg-red-700 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase disabled:opacity-50">Enfermer</button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── AUDIENCES ── */}
          {activeTab === "audiences" && (
            <Card title="Salle du Trône — Audiences" icon={Crown}>
              <div className="space-y-3">
                {(prop.audiences || []).filter((a) => a.status === "PENDING").length === 0 && <p className="text-stone-400 text-xs italic">Aucune audience en attente.</p>}
                {(prop.audiences || []).filter((a) => a.status === "PENDING").map((a) => (
                  <div key={a.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
                    <div className="font-bold text-stone-700">{a.from} — {a.subject}</div>
                    {a.text && <p className="text-stone-600 mt-1">{a.text}</p>}
                    {isOwner && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => onRespondAudience(prop.id, a.id, "ACCEPTED")} className="bg-green-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase">Accepter</button>
                        <button onClick={() => onRespondAudience(prop.id, a.id, "REFUSED")} className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase">Refuser</button>
                      </div>
                    )}
                  </div>
                ))}
                {!isOwner && (
                  <div className="space-y-2 pt-3 border-t border-stone-100">
                    <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-2">Soumettre une requête</div>
                    <input className="w-full p-2 border rounded text-sm" placeholder="Sujet de l'audience" value={audienceSubject} onChange={(e) => setAudienceSubject(e.target.value)} />
                    <textarea className="w-full p-2 border rounded text-sm" rows={2} placeholder="Votre requête..." value={audienceText} onChange={(e) => setAudienceText(e.target.value)} />
                    <button onClick={() => { if (audienceSubject.trim()) { onRequestAudience(prop.id, audienceSubject, audienceText); setAudienceSubject(""); setAudienceText(""); } }} disabled={!audienceSubject.trim()} className="bg-stone-800 text-yellow-500 px-4 py-2 rounded text-xs font-bold uppercase disabled:opacity-50">Demander une audience</button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── CHAMBRES ── */}
          {activeTab === "chambres" && (
            <Card title="Chambres" icon={Home}>
              <div className="space-y-2">
                {(prop.rooms || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucune chambre configurée.</p>}
                {(prop.rooms || []).map((r) => (
                  <div key={r.id} className="bg-stone-50 rounded-lg border border-stone-100 px-3 py-2">
                    {editingRoomId === r.id ? (
                      <div className="flex items-center gap-2">
                        <input className="flex-1 p-1.5 border rounded text-xs font-bold" value={editRoomName} onChange={(e) => setEditRoomName(e.target.value)} />
                        <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" value={editRoomPrice} onChange={(e) => setEditRoomPrice(e.target.value)} />
                        <button onClick={() => { const rooms = (prop.rooms || []).map((rm) => rm.id === r.id ? { ...rm, name: editRoomName.trim() || rm.name, pricePerNight: parseInt(editRoomPrice) || 0 } : rm); onSetupRooms(prop.id, rooms); setEditingRoomId(null); }} className="text-green-600 hover:text-green-500 p-1"><Save size={14} /></button>
                        <button onClick={() => setEditingRoomId(null)} className="text-stone-400 hover:text-stone-600 p-1"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-stone-700 text-sm">{r.name}</span>
                          <span className="ml-2 font-mono text-yellow-700 text-xs">{r.pricePerNight} Écus/nuit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.tenantId ? (
                            <>
                              <span className="text-xs text-blue-600 font-bold">{r.tenantName}</span>
                              {(isOwner || r.tenantId === user?.id) && <button onClick={() => onCheckoutRoom(prop.id, r.id)} className="text-red-400 text-[10px] font-bold uppercase border border-red-200 px-2 py-0.5 rounded hover:bg-red-50">Libérer</button>}
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-green-600 italic">Libre</span>
                              {!isOwner && <button onClick={() => onBookRoom(prop.id, r.id)} disabled={(user?.balance || 0) < r.pricePerNight} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50">Réserver</button>}
                            </>
                          )}
                          {isOwner && (
                            <>
                              <button onClick={() => { setEditingRoomId(r.id); setEditRoomName(r.name); setEditRoomPrice(String(r.pricePerNight || 0)); }} className="text-stone-400 hover:text-stone-600 p-1" title="Modifier"><Pencil size={12} /></button>
                              <button onClick={() => { if (!r.tenantId) onSetupRooms(prop.id, (prop.rooms || []).filter((rm) => rm.id !== r.id)); }} className={`p-1 ${r.tenantId ? "text-stone-200 cursor-not-allowed" : "text-red-400 hover:text-red-600"}`} title={r.tenantId ? "Chambre occupée" : "Supprimer"}><Trash2 size={12} /></button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isOwner && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                    <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Nom de la chambre" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
                    <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Prix/nuit" value={newRoomPrice} onChange={(e) => setNewRoomPrice(e.target.value)} />
                    <button onClick={() => { if (newRoomName.trim()) { onSetupRooms(prop.id, [...(prop.rooms || []), { id: Date.now(), name: newRoomName.trim(), pricePerNight: parseInt(newRoomPrice) || 0, tenantId: null, tenantName: null }]); setNewRoomName(""); setNewRoomPrice(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase flex items-center gap-1"><Plus size={12} /></button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── TAVERNE ── */}
          {activeTab === "taverne" && (
            <Card title="Taverne" icon={MessageSquare}>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(prop.tavernMessages || []).length === 0 && <p className="text-stone-400 text-xs italic">La taverne est silencieuse...</p>}
                {(prop.tavernMessages || []).map((m) => (
                  <div key={m.id} className="bg-stone-50 rounded-lg px-3 py-2 text-xs border border-stone-100">
                    <span className="font-bold text-stone-700">{m.authorName}</span><span className="text-stone-400 mx-1">·</span><span className="text-stone-600">{m.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                <input className="flex-1 p-2 border rounded text-sm" placeholder="Dire quelque chose..." value={tavernMsg} onChange={(e) => setTavernMsg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && tavernMsg.trim()) { onPostTavernMessage(prop.id, tavernMsg.trim()); setTavernMsg(""); } }} />
                <button onClick={() => { if (tavernMsg.trim()) { onPostTavernMessage(prop.id, tavernMsg.trim()); setTavernMsg(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"><MessageSquare size={13} /></button>
              </div>
            </Card>
          )}

          {/* ── RUMEURS ── */}
          {activeTab === "rumeurs" && (
            <Card title="Tableau des Rumeurs" icon={Eye}>
              <div className="space-y-2">
                {(prop.rumors || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucune rumeur affichée.</p>}
                {(prop.rumors || []).map((r) => (
                  <div key={r.id} className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs flex items-start justify-between gap-2">
                    <span className="italic text-stone-600">"{r.text}"</span>
                    {isOwner && <button onClick={() => onDeleteRumor(prop.id, r.id)} className="text-red-400 shrink-0 hover:text-red-600"><Trash2 size={11} /></button>}
                  </div>
                ))}
                <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                  <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Poster une rumeur anonyme..." value={rumorText} onChange={(e) => setRumorText(e.target.value)} />
                  <button onClick={() => { if (rumorText.trim()) { onPostRumor(prop.id, rumorText.trim()); setRumorText(""); } }} className="bg-yellow-500 text-stone-900 px-3 rounded text-[10px] font-bold uppercase">Poster</button>
                </div>
              </div>
            </Card>
          )}

          {/* ── MENU ── */}
          {activeTab === "menu" && (
            <Card title="Menu / Restauration" icon={Utensils}>
              <div className="space-y-2">
                {(prop.menu || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucun article au menu.</p>}
                {(prop.menu || []).map((m, i) => (
                  <div key={i} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2 text-sm border border-stone-100">
                    <div><span className="font-bold text-stone-700">{m.itemName}</span><span className="font-mono text-yellow-700 ml-2 text-xs">{m.price} Écus</span><span className="text-stone-400 text-xs ml-1">(stock : {m.stock})</span></div>
                    {!isOwner && m.stock > 0 && <button onClick={() => onBuyFromMenu(prop.id, m.itemName)} disabled={(user?.balance || 0) < m.price} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50">Acheter</button>}
                  </div>
                ))}
                {isOwner && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                    <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Article" value={menuItemName} onChange={(e) => setMenuItemName(e.target.value)} />
                    <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Prix" value={menuItemPrice} onChange={(e) => setMenuItemPrice(e.target.value)} />
                    <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Stock" value={menuItemStock} onChange={(e) => setMenuItemStock(e.target.value)} />
                    <button onClick={() => { if (menuItemName.trim()) { onUpdatePropertyFeature(prop.id, "menu", [...(prop.menu || []), { itemName: menuItemName.trim(), price: parseInt(menuItemPrice) || 0, stock: parseInt(menuItemStock) || 0 }]); setMenuItemName(""); setMenuItemPrice(""); setMenuItemStock(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"><Plus size={12} /></button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── VOYAGE ── */}
          {activeTab === "voyage" && (
            <Card title="Voyages & Expéditions" icon={Navigation}>
              <div className="space-y-3">
                {(prop.voyages || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucune expédition annoncée.</p>}
                {(prop.voyages || []).map((v) => {
                  const alreadySigned = (v.signups || []).some((s) => s.id === user?.id);
                  const spotsLeft = v.maxSpots ? v.maxSpots - (v.signups || []).length : null;
                  return (
                    <div key={v.id} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-stone-800 text-sm flex items-center gap-2 flex-wrap">
                            <Navigation size={13} className="text-indigo-500 shrink-0" />
                            {v.destination}
                            {v.date && <span className="text-[10px] font-mono bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">{v.date}</span>}
                            {spotsLeft !== null && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${spotsLeft > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                                {spotsLeft > 0 ? `${spotsLeft} place${spotsLeft > 1 ? "s" : ""}` : "Complet"}
                              </span>
                            )}
                          </div>
                          {v.description && <p className="text-xs text-stone-500 mt-1 ml-5">{v.description}</p>}
                          {(v.signups || []).length > 0 && (
                            <div className="mt-2 ml-5 flex flex-wrap gap-1">
                              {(v.signups || []).map((s) => (
                                <span key={s.id} className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <UserCheck size={9} /> {s.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {!isOwner && (
                            alreadySigned ? (
                              <button onClick={() => handleVoyageLeave(v.id)} className="text-red-500 text-[10px] font-bold uppercase border border-red-200 px-2 py-1 rounded hover:bg-red-50 flex items-center gap-1">
                                <X size={10} /> Se désinscrire
                              </button>
                            ) : (
                              <button onClick={() => handleVoyageSignup(v.id)} disabled={spotsLeft !== null && spotsLeft <= 0} className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-40 flex items-center gap-1 hover:bg-indigo-500">
                                <CheckCircle size={10} /> Participer
                              </button>
                            )
                          )}
                          {isOwner && (
                            <button onClick={() => { onUpdatePropertyFeature(prop.id, "voyages", (prop.voyages || []).filter((x) => x.id !== v.id)); }} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isOwner && (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2 mt-2">
                    <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Annoncer une expédition</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="col-span-2 p-1.5 border rounded text-xs" placeholder="Destination" value={voyageDest} onChange={(e) => setVoyageDest(e.target.value)} />
                      <input className="p-1.5 border rounded text-xs" placeholder="Date de départ" value={voyageDate} onChange={(e) => setVoyageDate(e.target.value)} />
                      <input className="p-1.5 border rounded text-xs font-mono" type="number" placeholder="Nb places max (optionnel)" value={voyageSpots} onChange={(e) => setVoyageSpots(e.target.value)} />
                      <input className="col-span-2 p-1.5 border rounded text-xs" placeholder="Description (optionnel)" value={voyageDesc} onChange={(e) => setVoyageDesc(e.target.value)} />
                    </div>
                    <button
                      onClick={() => {
                        if (voyageDest.trim()) {
                          onUpdatePropertyFeature(prop.id, "voyages", [
                            ...(prop.voyages || []),
                            { id: Date.now(), destination: voyageDest.trim(), date: voyageDate, description: voyageDesc, maxSpots: parseInt(voyageSpots) || null, signups: [] },
                          ]);
                          setVoyageDest(""); setVoyageDate(""); setVoyageDesc(""); setVoyageSpots("");
                        }
                      }}
                      disabled={!voyageDest.trim()}
                      className="bg-indigo-600 text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase w-full disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <Navigation size={12} /> Annoncer l'expédition
                    </button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── PRODUCTION AGRICOLE ── */}
          {activeTab === "production" && (
            <Card title="Production Agricole" icon={Package}>
              <div className="space-y-4">
                {prop.production?.itemName ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="text-[10px] font-black uppercase text-green-500 tracking-widest mb-2">Production active</div>
                    <div className="text-lg font-bold text-green-800">{prop.production.itemName}</div>
                    <div className="font-mono text-green-600 font-bold">+{prop.production.qtyPerDay} unité{prop.production.qtyPerDay > 1 ? "s" : ""} / jour RP</div>
                    {prop.production.lastProduced && <div className="text-[10px] text-stone-400 mt-2">Dernière production : {prop.production.lastProduced}</div>}
                  </div>
                ) : (
                  <p className="text-stone-400 text-xs italic">Aucune production configurée.</p>
                )}
                {isOwner && (
                  <div className="flex gap-2 pt-3 border-t border-stone-100">
                    <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Nom du produit (ex : Blé, Vin...)" value={prodItem} onChange={(e) => setProdItem(e.target.value)} />
                    <input className="w-20 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté/j" value={prodQty} onChange={(e) => setProdQty(e.target.value)} />
                    <button onClick={() => { if (prodItem.trim()) { onUpdatePropertyFeature(prop.id, "production", { itemName: prodItem.trim(), qtyPerDay: parseInt(prodQty) || 1, lastProduced: prop.production?.lastProduced }); } }} className="bg-green-600 text-white px-3 rounded text-[10px] font-bold uppercase">Configurer</button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── FABRICATION ── */}
          {activeTab === "fabrication" && (
            <Card title="Atelier de Fabrication" icon={Hammer}>
              <div className="space-y-2">
                {(prop.craftRecipes || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucune recette configurée.</p>}
                {(prop.craftRecipes || []).map((r) => (
                  <div key={r.id} className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
                    <span className="text-stone-500">{r.inputQty}× {r.inputItem}</span>
                    <span className="text-stone-400">→</span>
                    <span className="font-bold text-stone-700">{r.outputQty}× {r.outputItem}</span>
                  </div>
                ))}
                {isOwner && (
                  <div className="bg-stone-50 rounded-lg p-3 space-y-2 mt-2 border border-stone-200">
                    <div className="text-[10px] font-bold uppercase text-stone-400">Ajouter une recette</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="p-1.5 border rounded text-xs" placeholder="Matière première" value={recipeInputItem} onChange={(e) => setRecipeInputItem(e.target.value)} />
                      <input className="p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté entrée" value={recipeInputQty} onChange={(e) => setRecipeInputQty(e.target.value)} />
                      <input className="p-1.5 border rounded text-xs" placeholder="Produit fini" value={recipeOutputItem} onChange={(e) => setRecipeOutputItem(e.target.value)} />
                      <input className="p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté sortie" value={recipeOutputQty} onChange={(e) => setRecipeOutputQty(e.target.value)} />
                    </div>
                    <button onClick={() => { if (recipeInputItem && recipeOutputItem) { onUpdatePropertyFeature(prop.id, "craftRecipes", [...(prop.craftRecipes || []), { id: Date.now(), inputItem: recipeInputItem, inputQty: parseInt(recipeInputQty) || 1, outputItem: recipeOutputItem, outputQty: parseInt(recipeOutputQty) || 1 }]); setRecipeInputItem(""); setRecipeInputQty(""); setRecipeOutputItem(""); setRecipeOutputQty(""); } }} className="bg-stone-800 text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase w-full">Ajouter recette</button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── BOUTIQUE ── */}
          {activeTab === "boutique" && (
            <Card title="Étal / Boutique" icon={ShoppingBag}>
              <div className="space-y-2">
                {(prop.shopStock || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucun article en stock.</p>}
                {(prop.shopStock || []).map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2 text-sm border border-stone-100">
                    <div><span className="font-bold text-stone-700">{s.itemName}</span><span className="font-mono text-yellow-700 ml-2 text-xs">{s.price} Écus</span><span className="text-stone-400 text-xs ml-1">(stock : {s.qty})</span></div>
                    {!isOwner && s.qty > 0 && <button onClick={() => onBuyFromShop(prop.id, s.itemName)} disabled={(user?.balance || 0) < s.price} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50">Acheter</button>}
                  </div>
                ))}
                {isOwner && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                    <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Article" value={shopItemName} onChange={(e) => setShopItemName(e.target.value)} />
                    <input className="w-14 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Qté" value={shopItemQty} onChange={(e) => setShopItemQty(e.target.value)} />
                    <input className="w-14 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Prix" value={shopItemPrice} onChange={(e) => setShopItemPrice(e.target.value)} />
                    <button onClick={() => { if (shopItemName.trim()) { onUpdatePropertyFeature(prop.id, "shopStock", [...(prop.shopStock || []), { itemName: shopItemName.trim(), qty: parseInt(shopItemQty) || 0, price: parseInt(shopItemPrice) || 0 }]); setShopItemName(""); setShopItemQty(""); setShopItemPrice(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase"><Plus size={12} /></button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── BANQUE ── */}
          {activeTab === "banque" && (() => {
            const vault = prop.vault || { balance: 0, log: [] };
            const handleVaultMove = (sign) => {
              const amt = parseInt(vaultAmount);
              if (!amt || amt <= 0) return;
              const newBalance = vault.balance + sign * amt;
              const entry = { id: Date.now(), date: new Date().toLocaleDateString("fr-FR"), authorName: user.name, amount: sign * amt, note: vaultNote.trim() };
              onUpdatePropertyFeature(prop.id, "vault", { balance: newBalance, log: [entry, ...(vault.log || [])] });
              setVaultAmount(""); setVaultNote("");
            };
            return (
              <Card title="Coffre-fort" icon={Landmark}>
                {/* Solde */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center mb-4">
                  <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">Solde du coffre</div>
                  <div className={`text-4xl font-mono font-black ${vault.balance >= 0 ? "text-amber-800" : "text-red-700"}`}>
                    {vault.balance.toLocaleString()} <span className="text-lg font-bold text-amber-600">Écus</span>
                  </div>
                </div>
                {/* Formulaire propriétaire */}
                {isOwner && (
                  <div className="flex gap-2 mb-4">
                    <input className="w-28 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Montant" value={vaultAmount} onChange={(e) => setVaultAmount(e.target.value)} />
                    <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Note (optionnel)" value={vaultNote} onChange={(e) => setVaultNote(e.target.value)} />
                    <button onClick={() => handleVaultMove(1)} disabled={!vaultAmount} className="bg-green-600 text-white px-3 rounded text-[10px] font-bold uppercase disabled:opacity-50 flex items-center gap-1">
                      <Plus size={11} /> Créditer
                    </button>
                    <button onClick={() => handleVaultMove(-1)} disabled={!vaultAmount || parseInt(vaultAmount) > vault.balance} className="bg-red-600 text-white px-3 rounded text-[10px] font-bold uppercase disabled:opacity-50 flex items-center gap-1">
                      <Trash2 size={11} /> Débiter
                    </button>
                  </div>
                )}
                {/* Journal */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {(vault.log || []).length === 0 && <p className="text-stone-400 text-xs italic text-center py-4">Aucun mouvement enregistré.</p>}
                  {(vault.log || []).map((e) => (
                    <div key={e.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${e.amount >= 0 ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                      <div>
                        <span className="font-bold text-stone-700">{e.authorName}</span>
                        {e.note && <span className="text-stone-500 ml-2 italic">— {e.note}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-mono font-black text-sm ${e.amount >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {e.amount >= 0 ? "+" : ""}{e.amount.toLocaleString()} Écus
                        </span>
                        <span className="text-[10px] text-stone-400">{e.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}

          {/* ── POSTE ── */}
          {activeTab === "poste" && (() => {
            const SEALS = {
              NORMAL:   { label: "Normal",   color: "#78716C", bg: "bg-stone-100",  text: "text-stone-600" },
              URGENT:   { label: "Urgent",   color: "#DC2626", bg: "bg-red-100",    text: "text-red-700"   },
              OFFICIAL: { label: "Officiel", color: "#1D4ED8", bg: "bg-blue-100",   text: "text-blue-700"  },
              SECRET:   { label: "Secret",   color: "#7C3AED", bg: "bg-purple-100", text: "text-purple-700"},
            };
            const letters = prop.postLetters || [];
            const handlePost = () => {
              if (!letterSubject.trim() || !letterContent.trim()) return;
              onUpdatePropertyFeature(prop.id, "postLetters", [
                { id: Date.now(), fromName: user.name, fromId: user.id, to: letterTo.trim(), subject: letterSubject.trim(), content: letterContent.trim(), date: new Date().toLocaleDateString("fr-FR"), seal: letterSeal },
                ...letters,
              ]);
              setLetterTo(""); setLetterSubject(""); setLetterContent(""); setLetterSeal("NORMAL");
            };
            return (
              <Card title="Bureau de Poste" icon={Mail}>
                <div className="space-y-2 mb-4">
                  {letters.length === 0 && <p className="text-stone-400 text-xs italic text-center py-4">Aucun courrier affiché.</p>}
                  {letters.map((l) => {
                    const seal = SEALS[l.seal] || SEALS.NORMAL;
                    const open = expandedLetter === l.id;
                    return (
                      <div key={l.id} className="border border-stone-200 rounded-xl overflow-hidden">
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
                          onClick={() => setExpandedLetter(open ? null : l.id)}
                        >
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${seal.bg} ${seal.text}`}>{seal.label}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-stone-800 text-xs truncate">{l.subject}</div>
                            <div className="text-[10px] text-stone-400">
                              De <span className="font-bold">{l.fromName}</span>
                              {l.to && <> → <span className="font-bold">{l.to}</span></>}
                              <span className="ml-2">{l.date}</span>
                            </div>
                          </div>
                          {isOwner && (
                            <button onClick={(e) => { e.stopPropagation(); onUpdatePropertyFeature(prop.id, "postLetters", letters.filter((x) => x.id !== l.id)); }} className="text-red-400 hover:text-red-600 shrink-0 p-1">
                              <Trash2 size={11} />
                            </button>
                          )}
                          {open ? <ChevronUp size={13} className="text-stone-400 shrink-0" /> : <ChevronDown size={13} className="text-stone-400 shrink-0" />}
                        </button>
                        {open && (
                          <div className="px-4 py-3 bg-white border-t border-stone-100">
                            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{l.content}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Formulaire de rédaction */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
                  <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Rédiger un courrier</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="p-1.5 border rounded text-xs" placeholder="Destinataire (optionnel)" value={letterTo} onChange={(e) => setLetterTo(e.target.value)} />
                    <select className="p-1.5 border rounded text-xs bg-white" value={letterSeal} onChange={(e) => setLetterSeal(e.target.value)}>
                      {Object.entries(SEALS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                    </select>
                  </div>
                  <input className="w-full p-1.5 border rounded text-xs" placeholder="Sujet" value={letterSubject} onChange={(e) => setLetterSubject(e.target.value)} />
                  <textarea className="w-full p-1.5 border rounded text-xs resize-none" rows={3} placeholder="Contenu du courrier..." value={letterContent} onChange={(e) => setLetterContent(e.target.value)} />
                  <button onClick={handlePost} disabled={!letterSubject.trim() || !letterContent.trim()} className="bg-stone-800 text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase w-full disabled:opacity-50 flex items-center justify-center gap-1">
                    <Mail size={12} /> Afficher le courrier
                  </button>
                </div>
              </Card>
            );
          })()}

          {/* ── PERSONNEL ── */}
          {activeTab === "personnel" && (
            <Card title={`Personnel${(prop.staff || []).length > 0 ? ` (${prop.staff.length})` : ""}`} icon={UserPlus}>
              <div className="space-y-2">
                {(prop.staff || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucun personnel.</p>}
                {(prop.staff || []).map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2 text-sm border border-stone-100">
                    <div>
                      <span className="font-bold text-stone-700">{s.name}</span>
                      <span className="text-xs text-stone-400 ml-2">{s.role}</span>
                      {s.salary > 0 && <span className="ml-2 font-mono text-yellow-700 text-xs">{s.salary} Écus/jour</span>}
                    </div>
                    {isOwner && <button onClick={() => onRemovePropertyStaff(prop.id, s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>}
                  </div>
                ))}
                {isOwner && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                    <div className="flex-1"><UserSearchSelect users={citizens} onSelect={setStaffCitizenId} value={staffCitizenId} placeholder="Embaucher..." /></div>
                    <input className="w-24 p-1.5 border rounded text-xs" placeholder="Rôle" value={staffRole} onChange={(e) => setStaffRole(e.target.value)} />
                    <input className="w-16 p-1.5 border rounded text-xs font-mono" type="number" placeholder="Salaire" value={staffSalary} onChange={(e) => setStaffSalary(e.target.value)} />
                    <button onClick={() => { if (staffCitizenId) { onAddPropertyStaff(prop.id, staffCitizenId, staffRole || "Employé", staffSalary); setStaffCitizenId(""); setStaffRole(""); setStaffSalary(""); } }} disabled={!staffCitizenId} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase disabled:opacity-50 flex items-center gap-1"><Plus size={12} /></button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── ÉVÉNEMENTS ── */}
          {activeTab === "evenements" && (
            <Card title={`Événements${(prop.propertyEvents || []).length > 0 ? ` (${prop.propertyEvents.length})` : ""}`} icon={Calendar}>
              <div className="space-y-2">
                {(prop.propertyEvents || []).length === 0 && <p className="text-stone-400 text-xs italic">Aucun événement prévu.</p>}
                {(prop.propertyEvents || []).map((e) => (
                  <div key={e.id} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-stone-700 flex items-center gap-2">
                        {e.title}
                        {e.date && <span className="text-[10px] font-mono text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">{e.date}</span>}
                      </div>
                      {e.desc && <p className="text-stone-500 mt-0.5">{e.desc}</p>}
                    </div>
                    {isOwner && <button onClick={() => onRemovePropertyEvent(prop.id, e.id)} className="text-red-400 shrink-0 hover:text-red-600"><Trash2 size={11} /></button>}
                  </div>
                ))}
                {isOwner && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-stone-100">
                    <div className="flex gap-2">
                      <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Titre" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                      <input className="w-28 p-1.5 border rounded text-xs" placeholder="Date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <input className="flex-1 p-1.5 border rounded text-xs" placeholder="Description" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} />
                      <button onClick={() => { if (eventTitle.trim()) { onAddPropertyEvent(prop.id, { title: eventTitle.trim(), desc: eventDesc, date: eventDate }); setEventTitle(""); setEventDesc(""); setEventDate(""); } }} className="bg-stone-800 text-white px-3 rounded text-[10px] font-bold uppercase flex items-center gap-1"><Plus size={12} /></button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyDetailView;
