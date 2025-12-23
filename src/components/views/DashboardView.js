import React, { useState, useMemo } from "react";
import {
  Crown,
  Coins,
  Users,
  Sun,
  History,
  Newspaper,
  Send,
  Calendar,
  Edit3,
  Save,
  Flag,
  Globe,
} from "lucide-react";
import Card from "../ui/Card";

const DashboardView = ({ state, roleInfo, session, onUpdateState }) => {
  const [newArticle, setNewArticle] = useState({ title: "", content: "" });
  const [editingDate, setEditingDate] = useState(false);

  // Initialisation de la date temporaire avec la date du state (ou défaut)
  const defaultDate = { day: 1, month: 1, year: 1200 };
  const currentDate = state.gameDate || defaultDate;
  const [tempDate, setTempDate] = useState(currentDate);

  const isGlobal = roleInfo.scope === "GLOBAL";

  const myCountry = useMemo(() => {
    return state.countries.find((c) => c.id === session.countryId);
  }, [state.countries, session.countryId]);

  const stats = useMemo(() => {
    if (isGlobal) {
      const totalPop = state.countries.reduce(
        (acc, c) => acc + (c.population || 0),
        0
      );
      return {
        treasury: state.treasury,
        pop: totalPop,
        label: "Trésor Impérial",
        subLabel: "Population Totale",
        color: "text-yellow-500",
      };
    } else {
      return {
        treasury: myCountry ? myCountry.treasury : 0,
        pop: myCountry ? myCountry.population : 0,
        label: `Trésor : ${myCountry?.name}`,
        subLabel: "Sujets du Royaume",
        color: "text-blue-500",
      };
    }
  }, [isGlobal, state, myCountry]);

  const worldLedger = useMemo(() => {
    return (state.globalLedger || [])
      .filter((tx) => {
        const isEmpire =
          tx.fromName.includes("Empire") || tx.toName.includes("Empire");
        return isEmpire || tx.amount > 1000;
      })
      .slice(0, 8);
  }, [state.globalLedger]);

  // --- ACTIONS ---

  const handleUpdateDate = () => {
    onUpdateState({
      ...state,
      gameDate: {
        day: parseInt(tempDate.day),
        month: parseInt(tempDate.month),
        year: parseInt(tempDate.year),
      },
    });
    setEditingDate(false);
  };

  const handlePublishNews = () => {
    if (!newArticle.title || !newArticle.content) return;

    // Formatage de la date pour l'article
    const dateStr = `Le ${currentDate.day}/${currentDate.month}/${currentDate.year}`;

    const article = {
      id: Date.now(),
      date: dateStr,
      author: session.name,
      authorRole: roleInfo.label,
      title: newArticle.title,
      content: newArticle.content,
      scope: isGlobal ? "GLOBAL" : "LOCAL",
      countryId: isGlobal ? null : session.countryId,
    };
    onUpdateState({ ...state, gazette: [article, ...(state.gazette || [])] });
    setNewArticle({ title: "", content: "" });
  };

  const visibleNews = (state.gazette || []).filter(
    (n) => isGlobal || n.scope === "GLOBAL" || n.countryId === session.countryId
  );

  return (
    <div className="space-y-6 font-sans pb-20 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center border-b-4 border-stone-800 pb-6 mb-8">
        <div>
          <h2 className="text-4xl font-black font-serif uppercase tracking-tight text-stone-900 flex items-center gap-4">
            {isGlobal ? (
              <Globe size={42} className="text-yellow-600" />
            ) : (
              <Flag size={42} className="text-blue-600" />
            )}
            {isGlobal
              ? "Grand Empire"
              : `Gouvernance : ${myCountry?.name || "Locale"}`}
          </h2>
          <p className="text-stone-500 uppercase tracking-[0.3em] text-xs mt-2 font-bold pl-2">
            {roleInfo.label} • {session.name}
          </p>
        </div>

        {/* GESTION DATE AVANCÉE */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-stone-200">
          <div className="bg-stone-100 p-2 rounded-lg text-stone-600">
            <Calendar size={20} />
          </div>
          {editingDate ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-12 p-1 border rounded font-bold text-center"
                value={tempDate.day}
                onChange={(e) =>
                  setTempDate({ ...tempDate, day: e.target.value })
                }
                placeholder="JJ"
              />{" "}
              /
              <input
                type="number"
                className="w-12 p-1 border rounded font-bold text-center"
                value={tempDate.month}
                onChange={(e) =>
                  setTempDate({ ...tempDate, month: e.target.value })
                }
                placeholder="MM"
              />{" "}
              /
              <input
                type="number"
                className="w-16 p-1 border rounded font-bold text-center"
                value={tempDate.year}
                onChange={(e) =>
                  setTempDate({ ...tempDate, year: e.target.value })
                }
                placeholder="AAAA"
              />
              <button
                onClick={handleUpdateDate}
                className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 ml-2"
              >
                <Save size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-xl font-black font-serif">
                {currentDate.day} / {currentDate.month} / {currentDate.year}
              </div>
              <button
                onClick={() => setEditingDate(true)}
                className="text-stone-400 hover:text-stone-600"
              >
                <Edit3 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-stone-900 text-white p-6 rounded-xl shadow-lg border-2 border-stone-800 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
              {stats.label}
            </div>
            <div className={`text-4xl font-black font-serif ${stats.color}`}>
              {stats.treasury?.toLocaleString()}{" "}
              <span className="text-sm text-white opacity-50 font-sans">
                Écus
              </span>
            </div>
          </div>
          <Coins className="absolute -right-4 -bottom-4 opacity-10" size={96} />
        </div>
        <div className="bg-white text-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-[10px] uppercase tracking-widest text-stone-400 font-black mb-1">
              {stats.subLabel}
            </div>
            <div className="text-4xl font-black font-serif">
              {stats.pop?.toLocaleString()}
            </div>
          </div>
          <Users
            className="absolute -right-4 -bottom-4 text-stone-100"
            size={96}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Gazette Officielle (Rédaction)" icon={Newspaper}>
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 mb-6">
              <div className="text-xs font-bold uppercase text-stone-400 mb-2 tracking-widest">
                Rédiger un décret ou une annonce
              </div>
              <input
                className="w-full p-2 mb-2 border rounded font-serif font-bold"
                placeholder="Titre de l'annonce..."
                value={newArticle.title}
                onChange={(e) =>
                  setNewArticle({ ...newArticle, title: e.target.value })
                }
              />
              <textarea
                className="w-full p-2 mb-2 border rounded text-sm min-h-[80px]"
                placeholder="Contenu..."
                value={newArticle.content}
                onChange={(e) =>
                  setNewArticle({ ...newArticle, content: e.target.value })
                }
              />
              <div className="flex justify-end">
                <button
                  onClick={handlePublishNews}
                  disabled={!newArticle.title || !newArticle.content}
                  className="bg-stone-900 text-yellow-500 px-4 py-2 rounded text-[10px] font-black uppercase flex items-center gap-2 hover:bg-stone-800 disabled:opacity-50"
                >
                  <Send size={12} /> Publier
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {visibleNews.map((n) => (
                <div
                  key={n.id}
                  className="border-b border-stone-100 pb-4 last:border-0 relative pl-4"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${
                      n.scope === "GLOBAL" ? "bg-yellow-500" : "bg-blue-500"
                    }`}
                  ></div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-lg font-serif">{n.title}</h4>
                    <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded">
                      {n.date}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed italic">
                    {n.content}
                  </p>
                  <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-stone-300">
                    Par {n.author} ({n.authorRole})
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-stone-300 shadow-lg overflow-hidden h-full flex flex-col">
            <div className="p-5 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-stone-200 p-2 rounded text-stone-600">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 uppercase tracking-wide">
                    Flux Majeurs
                  </h3>
                  <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">
                    Transactions d'État
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-0 max-h-[500px]">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-stone-100">
                  {worldLedger.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-yellow-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-stone-700 text-xs">
                              {tx.fromName}
                            </span>
                            <span className="text-stone-300">➜</span>
                            <span className="font-bold text-stone-700 text-xs text-right">
                              {tx.toName}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-mono font-black text-stone-900 bg-stone-100 px-1 rounded">
                              {tx.amount.toLocaleString()}{" "}
                              <span className="text-[9px]">Écus</span>
                            </span>
                            <span className="text-[9px] text-stone-400 font-mono">
                              {new Date(tx.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
