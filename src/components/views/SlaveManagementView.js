import React, { useState } from "react";
import {
  User,
  Unlock,
  Coins,
  Hand,
  Box,
  Mail,
  Globe,
  Shield,
  Eye,
  AlertTriangle,
  X,
  RotateCcw,
  Heart,
  HeartCrack,
  Search,
  Trash2,
} from "lucide-react";
import Card from "../ui/Card";
import { ROLES, MARRIAGE_CONTRACT_TYPES } from "../../lib/constants";
import { formatMoney } from "../../lib/gameUtils";

const SlaveManagementView = ({
  slaves,
  citizens = [],
  onUpdateCitizen,
  onConfiscateSlaveMoney,
  onSelfManumit,
  onDismissSlaveAlert,
  onRestoreHiddenTransfer,
  onOwnerProposeMarriage,
  onOwnerAcceptMarriage,
  onOwnerRejectMarriage,
  onOwnerBreakMarriage,
  notify,
  catalog,
  session,
  countries = [],
}) => {
  const [selectedSlave, setSelectedSlave] = useState(null);
  const [price, setPrice] = useState("");

  // État civil
  const [propSearch, setPropSearch] = useState("");
  const [showPropDropdown, setShowPropDropdown] = useState(false);
  const [propTargetId, setPropTargetId] = useState(null);
  const [propTargetName, setPropTargetName] = useState("");
  const [propContractType, setPropContractType] = useState("sacre");

  const defaultLaws = {
    allowExternalDebits: false,
    allowLocalConfiscation: true,
    allowLocalSales: true,
    allowPermissionEditsByLocalAdmins: true,
    requireRulerApprovalForSales: false,
    // Société & Maison de Asia
    allowSelfManumission: false,
    militaryServitude: false,
    banPublicSlaveMarket: false,
  };

  const getCountryLaws = (slave) => {
    // Les lois s'appliquent selon le pays de localisation physique, pas l'allégeance
    const locId = slave?.locationCountryId || slave?.countryId;
    if (!slave || !locId) return defaultLaws;
    const c = (countries || []).find((x) => x.id === locId);
    return c?.laws || defaultLaws;
  };

  const isGlobalAdmin = ["EMPEREUR", "GRAND_FONC_GLOBAL"].includes(
    session?.role
  );
  const isLocalAdmin = [
    "ROI",
    "INTENDANT",
    "GRAND_FONC_LOCAL",
    "FONCTIONNAIRE",
  ].includes(session?.role);

  const canManage = (slave) => {
    if (!slave) return false;
    // Owner can always manage their slaves
    if (session?.id === slave.ownerId) return true;
    // Global admins can manage any slave
    if (isGlobalAdmin) return true;
    // Local admins can manage slaves physically located in their country
    const slaveLocation = slave.locationCountryId || slave.countryId;
    if (
      isLocalAdmin &&
      slaveLocation &&
      session?.countryId &&
      slaveLocation === session.countryId
    )
      return true;
    return false;
  };

  // Toggle dédié pour le grade : explicitement true ou false (jamais undefined)
  const toggleGradePermission = (slave) => {
    const currentGrade = slave.permissions?.grade;
    const newGrade = currentGrade === false ? true : false;
    const newPermissions = { ...(slave.permissions || {}), grade: newGrade };
    onUpdateCitizen({ ...slave, permissions: newPermissions });
    if (selectedSlave && selectedSlave.id === slave.id) {
      setSelectedSlave({ ...slave, permissions: newPermissions });
    }
  };

  // Fonction pour basculer une permission
  const togglePermission = (slave, permission) => {
    const currentPermissions = slave.permissions || {};
    const newPermissions = {
      ...currentPermissions,
      [permission]: !currentPermissions[permission],
    };
    onUpdateCitizen({ ...slave, permissions: newPermissions });
    // Mise à jour locale pour l'affichage immédiat
    if (selectedSlave && selectedSlave.id === slave.id) {
      setSelectedSlave({ ...slave, permissions: newPermissions });
    }
  };

  const handleFree = (slave) => {
    if (!canManage(slave)) {
      notify("Action interdite: hors juridiction.", "error");
      return;
    }
    const laws = getCountryLaws(slave);
    if (
      !isGlobalAdmin &&
      !laws.allowLocalConfiscation &&
      session.id !== slave.ownerId
    ) {
      notify("Libération interdite par la loi du pays.", "error");
      return;
    }
    if (window.confirm(`Voulez-vous vraiment affranchir ${slave.name} ?`)) {
      onUpdateCitizen({
        ...slave,
        status: "Actif",
        ownerId: null,
        permissions: {},
      });
      notify(`${slave.name} est désormais libre.`, "success");
      setSelectedSlave(null);
    }
  };

  const handleTakeMoney = (slave) => {
    if (!canManage(slave)) {
      notify("Action interdite: hors juridiction.", "error");
      return;
    }
    const laws = getCountryLaws(slave);
    if (!isGlobalAdmin && !laws.allowLocalConfiscation) {
      notify("Confiscation interdite par la loi du pays.", "error");
      return;
    }
    if (!slave.balance || slave.balance <= 0) return;
    if (typeof onConfiscateSlaveMoney === "function") {
      onConfiscateSlaveMoney(slave.id);
    } else {
      onUpdateCitizen({ ...slave, balance: 0 });
      notify(`Vous avez confisqué ${formatMoney(slave.balance)} à ${slave.name}.`, "info");
    }
    if (selectedSlave) setSelectedSlave({ ...selectedSlave, balance: 0 });
  };

  // Résolution de l'inventaire
  const getInventoryItems = (inventory) => {
    if (!inventory) return [];
    return inventory
      .map((slot) => {
        const itemDef = catalog.find((i) => i.id === slot.itemId);
        return { ...slot, ...itemDef };
      })
      .filter((i) => i.name);
  };

  const slaveAlerts = session?.slaveAlerts || [];

  return (
    <div className="h-full flex flex-col gap-4 font-sans">
      {/* ALERTES DE DISSIMULATION */}
      {slaveAlerts.length > 0 && (
        <div className="space-y-2 shrink-0">
          {slaveAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3 animate-fadeIn"
            >
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <div className="flex-1 text-xs text-red-800">
                <strong>{alert.slaveName}</strong> a tenté de dissimuler{" "}
                <strong>{formatMoney(alert.amount)}</strong> !
                <span className="text-[10px] text-red-400 ml-2">
                  {alert.timestamp
                    ? new Date(alert.timestamp).toLocaleString()
                    : ""}
                </span>
              </div>
              {onRestoreHiddenTransfer && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Restituer ${formatMoney(alert.amount)} de ${alert.slaveName} vers votre compte ?`
                      )
                    ) {
                      onRestoreHiddenTransfer(alert.id, alert.slaveId, alert.amount);
                    }
                  }}
                  className="px-2 py-1 text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 flex items-center gap-1 whitespace-nowrap"
                  title="Restituer le montant découvert"
                >
                  <RotateCcw size={11} /> Restituer
                </button>
              )}
              {onDismissSlaveAlert && (
                <button
                  onClick={() => onDismissSlaveAlert(alert.id)}
                  className="p-1 text-red-400 hover:text-red-700 rounded hover:bg-red-100"
                  title="Ignorer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 flex gap-6 min-h-0">
      {/* LISTE DES ESCLAVES (COLONNE GAUCHE) */}
      <div className="w-1/3 bg-[#fdf6e3] rounded-xl border border-stone-300 flex flex-col overflow-hidden shadow-md">
        <div className="p-4 bg-stone-100 border-b font-bold uppercase text-[11px] tracking-[0.2em] text-stone-500 flex items-center gap-2">
          <Hand size={14} /> Vos Sujets
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {slaves.length === 0 && (
            <div className="text-center p-4 text-xs text-stone-400 italic">
              Aucun esclave.
            </div>
          )}
          {slaves.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                setSelectedSlave(s);
                setPrice(s.salePrice || "");
              }}
              className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                selectedSlave?.id === s.id
                  ? "bg-stone-800 text-white border-stone-900 shadow-md"
                  : "bg-white hover:bg-stone-50 border-stone-200"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                {s.avatarUrl ? (
                  <img
                    src={s.avatarUrl}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <User size={16} className="text-stone-500" />
                )}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs truncate uppercase flex items-center gap-2">
                  {s.name}
                  {s.isForSale && (
                    <span className="ml-2 inline-block bg-yellow-100 text-yellow-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                      EN VENTE
                    </span>
                  )}
                </div>
                <div className="text-[9px] opacity-70">Mat: {s.id}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DÉTAIL DE L'ESCLAVE (COLONNE DROITE) */}
      <div className="flex-1 bg-[#fdf6e3] rounded-xl border border-stone-300 p-6 overflow-auto shadow-xl relative">
        {selectedSlave ? (
          <>
            {/* EN-TÊTE FICHE */}
            <div className="flex justify-between items-start border-b-4 border-stone-800 pb-4">
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-stone-200 rounded-xl border-4 border-stone-800 overflow-hidden shadow-lg">
                  {selectedSlave.avatarUrl ? (
                    <img
                      src={selectedSlave.avatarUrl}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={32} className="text-stone-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase font-serif text-stone-900">
                    {selectedSlave.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="bg-red-900 text-white text-[9px] px-2 py-0.5 rounded uppercase tracking-widest font-bold">
                      Esclave
                    </span>
                    {selectedSlave.role && selectedSlave.role !== "CITOYEN" && ROLES[selectedSlave.role] && (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-300 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest font-bold">
                        <Shield size={10} /> Grade : {ROLES[selectedSlave.role].label}
                      </span>
                    )}
                    {selectedSlave.isForSale && (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded font-bold">
                        En vente: {selectedSlave.salePrice}¢
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                      Occupation: {selectedSlave.occupation || "Aucune"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleFree(selectedSlave)}
                  disabled={!canManage(selectedSlave)}
                  className={`px-4 py-2 rounded text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-sm ${
                    !canManage(selectedSlave)
                      ? "bg-stone-200 text-stone-400 border border-stone-200"
                      : "bg-white border border-red-200 text-red-700 hover:bg-red-50"
                  }`}
                >
                  <Unlock size={14} /> Affranchir
                </button>

                {/* Self-manumission: allow slave to buy freedom if law permits and funds available */}
                {session.id === selectedSlave.id &&
                  selectedSlave.status === "Esclave" &&
                  selectedSlave.salePrice > 0 &&
                  selectedSlave.balance >= (selectedSlave.salePrice || 0) &&
                  getCountryLaws(selectedSlave).allowSelfManumission && (
                    <button
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Acheter votre liberté pour ${formatMoney(selectedSlave.salePrice)} ?`
                          )
                        )
                          return;
                        if (onSelfManumit) onSelfManumit(selectedSlave.id);
                      }}
                      className="px-4 py-2 rounded text-[10px] font-black uppercase bg-green-700 text-white hover:bg-green-600 transition-all"
                    >
                      <Coins size={14} /> Racheter liberté
                    </button>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* GESTION DROITS (PERMISSIONS) */}
              <Card title="Permissions & Droits" icon={Shield}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stone-100 rounded text-stone-600">
                        <Mail size={16} />
                      </div>
                      <div className="text-xs font-bold uppercase text-stone-700">
                        Accès Poste
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={selectedSlave.permissions?.post || false}
                        onChange={() => {
                          if (!canManage(selectedSlave)) {
                            notify(
                              "Action interdite: hors juridiction.",
                              "error"
                            );
                            return;
                          }
                          const laws = getCountryLaws(selectedSlave);
                          if (
                            !isGlobalAdmin &&
                            session.id !== selectedSlave.ownerId &&
                            !laws.allowPermissionEditsByLocalAdmins
                          ) {
                            notify(
                              "Modification des permissions interdite par la loi du pays.",
                              "error"
                            );
                            return;
                          }
                          togglePermission(selectedSlave, "post");
                        }}
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stone-100 rounded text-stone-600">
                        <Coins size={16} />
                      </div>
                      <div className="text-xs font-bold uppercase text-stone-700">
                        Accès Banque
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={selectedSlave.permissions?.bank || false}
                        onChange={() => {
                          if (!canManage(selectedSlave)) {
                            notify(
                              "Action interdite: hors juridiction.",
                              "error"
                            );
                            return;
                          }
                          const laws = getCountryLaws(selectedSlave);
                          if (
                            !isGlobalAdmin &&
                            session.id !== selectedSlave.ownerId &&
                            !laws.allowPermissionEditsByLocalAdmins
                          ) {
                            notify(
                              "Modification des permissions interdite par la loi du pays.",
                              "error"
                            );
                            return;
                          }
                          togglePermission(selectedSlave, "bank");
                        }}
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stone-100 rounded text-stone-600">
                        <Globe size={16} />
                      </div>
                      <div className="text-xs font-bold uppercase text-stone-700">
                        Droit de Voyage
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={selectedSlave.permissions?.travel || false}
                        onChange={() => {
                          if (!canManage(selectedSlave)) {
                            notify(
                              "Action interdite: hors juridiction.",
                              "error"
                            );
                            return;
                          }
                          const laws = getCountryLaws(selectedSlave);
                          if (
                            !isGlobalAdmin &&
                            session.id !== selectedSlave.ownerId &&
                            !laws.allowPermissionEditsByLocalAdmins
                          ) {
                            notify(
                              "Modification des permissions interdite par la loi du pays.",
                              "error"
                            );
                            return;
                          }
                          togglePermission(selectedSlave, "travel");
                        }}
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Toggle grade admin — visible uniquement si l'esclave a un grade administratif */}
                  {selectedSlave.role &&
                    selectedSlave.role !== "CITOYEN" &&
                    ROLES[selectedSlave.role]?.level >= 20 && (
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded text-blue-700">
                            <Shield size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-bold uppercase text-blue-800">
                              Utilisation du Grade Admin
                            </div>
                            <div className="text-[9px] text-blue-500 italic">
                              {ROLES[selectedSlave.role]?.label}
                            </div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={selectedSlave.permissions?.grade !== false}
                            onChange={() => {
                              if (!canManage(selectedSlave)) {
                                notify(
                                  "Action interdite: hors juridiction.",
                                  "error"
                                );
                                return;
                              }
                              toggleGradePermission(selectedSlave);
                            }}
                          />
                          <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    )}
                </div>
              </Card>

              {/* FINANCES */}
              <Card title="Finances" icon={Coins}>
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="text-4xl font-black text-stone-800 font-serif mb-2">
                    {selectedSlave.balance || 0}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-stone-400 mb-4">
                    Écus Possédés
                  </div>
                  <button
                    onClick={() => handleTakeMoney(selectedSlave)}
                    disabled={
                      !selectedSlave.balance ||
                      !canManage(selectedSlave) ||
                      (!isGlobalAdmin &&
                        !getCountryLaws(selectedSlave).allowLocalConfiscation)
                    }
                    className={`w-full py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      !selectedSlave.balance ||
                      !canManage(selectedSlave) ||
                      (!isGlobalAdmin &&
                        !getCountryLaws(selectedSlave).allowLocalConfiscation)
                        ? "bg-stone-400 text-stone-200"
                        : "bg-stone-900 text-yellow-500"
                    }`}
                  >
                    Confisquer les fonds
                  </button>
                  {!isGlobalAdmin &&
                    !getCountryLaws(selectedSlave).allowLocalConfiscation && (
                      <div className="mt-2 text-xs text-red-600">
                        Confiscation interdite par la loi du pays.
                      </div>
                    )}
                </div>
              </Card>

              {/* MARCHÉ - VENTE */}
              <div className="col-span-1 md:col-span-2">
                <Card title="Marché" icon={Hand}>
                  <div className="p-4 space-y-2 min-h-[6.5rem]">
                    {selectedSlave.isForSale ? (
                      <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <div className="flex-1 bg-yellow-100 text-yellow-800 p-3 rounded text-center font-bold text-sm border border-yellow-200">
                          En vente :{" "}
                          <span className="font-mono">
                            {selectedSlave.salePrice}¢
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (!canManage(selectedSlave)) {
                              notify(
                                "Action interdite: hors juridiction.",
                                "error"
                              );
                              return;
                            }
                            const laws = getCountryLaws(selectedSlave);
                            if (
                              !isGlobalAdmin &&
                              !laws.allowLocalSales &&
                              session.id !== selectedSlave.ownerId
                            ) {
                              notify(
                                "Annulation de vente interdite par la loi du pays.",
                                "error"
                              );
                              return;
                            }
                            if (
                              !window.confirm(
                                `Annuler la vente de ${selectedSlave.name} ?`
                              )
                            )
                              return;
                            onUpdateCitizen({
                              ...selectedSlave,
                              isForSale: false,
                              salePrice: 0,
                            });
                            setSelectedSlave({
                              ...selectedSlave,
                              isForSale: false,
                              salePrice: 0,
                            });
                            setPrice("");
                            notify("Vente annulée.", "info");
                          }}
                          className={`w-full sm:w-auto px-3 rounded text-sm font-bold transition ${
                            !canManage(selectedSlave)
                              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                              : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <input
                          type="number" step="0.1"
                          aria-label="Prix en écus"
                          placeholder="Prix en Écus"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full sm:flex-1 p-3 text-sm border rounded bg-white text-stone-800 placeholder:text-stone-400"
                        />
                        <button
                          onClick={() => {
                            if (!canManage(selectedSlave)) {
                              notify(
                                "Action interdite: hors juridiction.",
                                "error"
                              );
                              return;
                            }
                            const laws = getCountryLaws(selectedSlave);
                            if (
                              !isGlobalAdmin &&
                              !laws.allowLocalSales &&
                              session.id !== selectedSlave.ownerId
                            ) {
                              notify(
                                "Mise en vente interdite par la loi du pays.",
                                "error"
                              );
                              return;
                            }
                            if (!isGlobalAdmin && laws.banPublicSlaveMarket) {
                              notify(
                                "Mise en vente publique interdite par la loi du pays.",
                                "error"
                              );
                              return;
                            }
                            if (
                              laws.requireRulerApprovalForSales &&
                              !isGlobalAdmin &&
                              session.role !== "ROI" &&
                              session.id !== selectedSlave.ownerId
                            ) {
                              notify(
                                "Mise en vente : approbation du souverain requise.",
                                "error"
                              );
                              return;
                            }
                            const p = parseFloat(price);
                            if (!p || p <= 0) {
                              notify("Prix invalide.", "error");
                              return;
                            }
                            if (
                              !window.confirm(
                                `Mettre ${selectedSlave.name} en vente pour ${formatMoney(p)} ?`
                              )
                            )
                              return;
                            onUpdateCitizen({
                              ...selectedSlave,
                              isForSale: true,
                              salePrice: p,
                            });
                            setSelectedSlave({
                              ...selectedSlave,
                              isForSale: true,
                              salePrice: p,
                            });
                            setPrice("");
                            notify(
                              `${selectedSlave.name} mis en vente pour ${formatMoney(p)}.`,
                              "success"
                            );
                          }}
                          className={`w-full sm:w-auto px-4 py-2 rounded text-sm font-bold transition ${
                            !canManage(selectedSlave) || parseFloat(price) <= 0
                              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                              : "bg-stone-900 text-white hover:bg-stone-800"
                          }`}
                          disabled={
                            !price ||
                            parseFloat(price) <= 0 ||
                            !canManage(selectedSlave) ||
                            (!isGlobalAdmin &&
                              !getCountryLaws(selectedSlave).allowLocalSales)
                          }
                        >
                          Vendre
                        </button>
                        {!isGlobalAdmin &&
                          !getCountryLaws(selectedSlave).allowLocalSales && (
                            <div className="mt-2 text-xs text-red-600">
                              Mise en vente interdite par la loi du pays.
                            </div>
                          )}
                      </div>
                    )}

                    <div className="text-[11px] text-stone-400 italic">
                      La mise en vente rendra ce sujet visible dans le marché
                      global.
                    </div>
                  </div>
                </Card>
              </div>

              {/* ÉTAT CIVIL */}
              <div className="col-span-1 md:col-span-2">
                <Card title="État Civil & Mariage" icon={Heart}>
                  <div className="space-y-5">
                    {/* --- Mariages en cours --- */}
                    {(() => {
                      const spouses = selectedSlave.spouses || (selectedSlave.spouseId ? [{ id: selectedSlave.spouseId }] : []);
                      if (spouses.length === 0) return (
                        <p className="text-xs text-stone-400 italic text-center py-2">Aucune union enregistrée.</p>
                      );
                      return (
                        <div className="space-y-2">
                          <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Unions actuelles</div>
                          {spouses.map((sp) => {
                            const spouseData = citizens.find((c) => c.id === sp.id);
                            const ctLabel = (MARRIAGE_CONTRACT_TYPES || []).find((t) => t.id === sp.contractType)?.label || sp.contractType || "Union";
                            return (
                              <div key={sp.id} className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                                {spouseData?.avatarUrl ? (
                                  <img src={spouseData.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-rose-300 shrink-0" alt="" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                                    <Heart size={14} className="text-rose-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm text-stone-800 truncate">{spouseData?.name || sp.name || sp.id}</div>
                                  <div className="text-[9px] text-stone-500 uppercase tracking-widest">{ctLabel}{sp.regime && sp.regime !== "separation" ? ` · ${sp.regime}` : ""}</div>
                                </div>
                                {canManage(selectedSlave) && onOwnerBreakMarriage && (
                                  <button
                                    onClick={() => {
                                      if (!window.confirm(`Rompre l'union de ${selectedSlave.name} avec ${spouseData?.name || sp.id} ? Cette action est irréversible.`)) return;
                                      onOwnerBreakMarriage(selectedSlave.id, sp.id);
                                      setSelectedSlave({ ...selectedSlave, spouses: (selectedSlave.spouses || []).filter((s) => s.id !== sp.id), spouseId: null });
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-300 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-50 transition-colors shrink-0"
                                    title="Rompre l'union"
                                  >
                                    <HeartCrack size={12} /> Rompre
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* --- Propositions reçues --- */}
                    {(selectedSlave.marriageProposals || []).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Propositions reçues</div>
                        {(selectedSlave.marriageProposals || []).map((p) => {
                          const proposerData = citizens.find((c) => c.id === p.fromId);
                          const ctLabel = (MARRIAGE_CONTRACT_TYPES || []).find((t) => t.id === p.contractType)?.label || p.contractType || "Union";
                          return (
                            <div key={p.fromId} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                              {proposerData?.avatarUrl ? (
                                <img src={proposerData.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-amber-300 shrink-0" alt="" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                  <User size={14} className="text-amber-500" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-stone-800 truncate">{proposerData?.name || p.fromName || p.fromId}</div>
                                <div className="text-[9px] text-stone-500 uppercase tracking-widest">{ctLabel}</div>
                              </div>
                              {canManage(selectedSlave) && (
                                <div className="flex gap-1.5 shrink-0">
                                  {onOwnerAcceptMarriage && (
                                    <button
                                      onClick={() => {
                                        onOwnerAcceptMarriage(selectedSlave.id, p.fromId);
                                        setSelectedSlave({
                                          ...selectedSlave,
                                          marriageProposals: (selectedSlave.marriageProposals || []).filter((x) => x.fromId !== p.fromId),
                                        });
                                      }}
                                      className="px-2 py-1.5 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                      Accepter
                                    </button>
                                  )}
                                  {onOwnerRejectMarriage && (
                                    <button
                                      onClick={() => {
                                        onOwnerRejectMarriage(selectedSlave.id, p.fromId);
                                        setSelectedSlave({
                                          ...selectedSlave,
                                          marriageProposals: (selectedSlave.marriageProposals || []).filter((x) => x.fromId !== p.fromId),
                                        });
                                      }}
                                      className="px-2 py-1.5 bg-white border border-stone-300 text-stone-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-stone-50 transition-colors"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* --- Proposer un mariage --- */}
                    {canManage(selectedSlave) && onOwnerProposeMarriage && (
                      <div className="border-t border-stone-200 pt-4 space-y-3">
                        <div className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Proposer une union</div>

                        {/* Recherche de la cible */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-stone-400 tracking-widest">Destinataire</label>
                          {propTargetId ? (
                            <div className="flex items-center gap-3 p-2.5 bg-white border-2 border-green-300 rounded-xl">
                              <User size={14} className="text-stone-400 shrink-0" />
                              <span className="font-bold text-sm text-stone-800 flex-1">{propTargetName}</span>
                              <button
                                onClick={() => { setPropTargetId(null); setPropTargetName(""); }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="flex items-center gap-2 border-2 border-stone-200 rounded-xl bg-white px-3 focus-within:border-stone-500">
                                <Search size={13} className="text-stone-400 shrink-0" />
                                <input
                                  className="flex-1 p-2 outline-none text-sm font-bold bg-transparent"
                                  placeholder="Chercher un citoyen…"
                                  value={propSearch}
                                  onChange={(e) => { setPropSearch(e.target.value); setShowPropDropdown(true); }}
                                  onFocus={() => setShowPropDropdown(true)}
                                />
                              </div>
                              {showPropDropdown && propSearch && (
                                <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-40 overflow-y-auto border border-stone-200 rounded-xl bg-white shadow-xl p-1.5 space-y-1">
                                  {citizens
                                    .filter((c) =>
                                      c.id !== selectedSlave.id &&
                                      (c.name?.toLowerCase().includes(propSearch.toLowerCase()) || c.id?.includes(propSearch))
                                    )
                                    .slice(0, 8)
                                    .map((c) => (
                                      <button
                                        key={c.id}
                                        onClick={() => { setPropTargetId(c.id); setPropTargetName(c.name); setPropSearch(""); setShowPropDropdown(false); }}
                                        className="w-full text-left p-2 rounded-lg hover:bg-stone-100 flex items-center gap-2 transition-colors"
                                      >
                                        {c.avatarUrl ? (
                                          <img src={c.avatarUrl} className="w-6 h-6 rounded-full object-cover border border-stone-200" alt="" />
                                        ) : (
                                          <User size={12} className="text-stone-400 shrink-0" />
                                        )}
                                        <span className="font-bold text-sm text-stone-800 truncate">{c.name}</span>
                                        <span className="text-[9px] text-stone-400 ml-auto shrink-0 font-mono">{c.id}</span>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Type de contrat */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-stone-400 tracking-widest">Type d'union</label>
                          <select
                            className="w-full p-2.5 border-2 border-stone-200 rounded-xl bg-white outline-none text-sm font-bold"
                            value={propContractType}
                            onChange={(e) => setPropContractType(e.target.value)}
                          >
                            {(MARRIAGE_CONTRACT_TYPES || []).map((ct) => (
                              <option key={ct.id} value={ct.id}>{ct.label}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          disabled={!propTargetId}
                          onClick={() => {
                            if (!propTargetId) return;
                            onOwnerProposeMarriage(selectedSlave.id, propTargetId, { contractType: propContractType });
                            setPropTargetId(null);
                            setPropTargetName("");
                            setPropContractType("sacre");
                          }}
                          className="w-full py-2.5 bg-stone-900 text-yellow-400 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
                        >
                          Envoyer la proposition
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* INVENTAIRE */}
              <div className="col-span-1 md:col-span-2">
                <Card title="Inventaire" icon={Box}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {getInventoryItems(selectedSlave.inventory).length ===
                      0 && (
                      <div className="col-span-full text-center text-xs text-stone-400 italic py-4">
                        Inventaire vide.
                      </div>
                    )}
                    {getInventoryItems(selectedSlave.inventory).map(
                      (item, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2 rounded border border-stone-200 flex flex-col items-center text-center"
                        >
                          <div className="font-bold text-xs text-stone-800">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            x{item.qty}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50">
            <Eye size={64} className="mb-4" />
            <div className="uppercase font-black tracking-widest text-sm">
              Sélectionnez un sujet
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default SlaveManagementView;
