import React from "react";
import { Newspaper, Calendar } from "lucide-react";

const GazetteView = ({ gazette }) => {
  const safeGazette = gazette || [];

  return (
    <div className="h-full bg-[#fdf6e3] rounded-2xl border border-stone-300 p-6 overflow-auto font-sans shadow-inner">
      <div className="flex items-center justify-between border-b-4 border-stone-900 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-stone-900 text-white p-4 rounded-full shadow-lg">
            <Newspaper size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-stone-900 font-serif uppercase tracking-tighter">
              La Gazette Impériale
            </h2>
            <p className="text-xs text-stone-500 uppercase tracking-[0.4em] font-bold mt-1">
              Informations Officielles & Décrets
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {safeGazette.length === 0 && (
          <div className="text-center py-20 text-stone-400 italic font-serif text-lg">
            L'encre est sèche. Aucune nouvelle pour le moment.
          </div>
        )}

        {safeGazette.map((article) => (
          <div
            key={article.id}
            className="bg-white p-6 rounded-xl border border-stone-200 shadow-md relative overflow-hidden group hover:shadow-lg transition-all"
          >
            <div
              className={`absolute top-0 left-0 w-2 h-full ${
                article.scope === "GLOBAL" ? "bg-yellow-600" : "bg-blue-600"
              }`}
            ></div>

            <div className="flex justify-between items-start mb-4 pl-4">
              <h3 className="text-2xl font-black font-serif text-stone-800">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-widest bg-stone-50 px-3 py-1 rounded-full border border-stone-100">
                <Calendar size={12} />
                {article.date}
              </div>
            </div>

            <div className="pl-4">
              <p className="text-stone-600 leading-relaxed font-serif text-justify italic border-l-2 border-stone-100 pl-4 mb-4">
                "{article.content}"
              </p>

              <div className="flex justify-end mt-4">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-black text-stone-300 tracking-widest">
                    Signé
                  </div>
                  <div className="font-bold text-stone-900 text-sm">
                    {article.author}
                  </div>
                  <div className="text-xs text-stone-500">
                    {article.authorRole}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GazetteView;
