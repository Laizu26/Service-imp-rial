import React from "react";
import { XCircle } from "lucide-react";

const MessageModal = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div
      className="fixed inset-0 z-[200] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#fdf6e3] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border-4 border-double border-stone-800 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6 md:mb-8 border-b border-stone-300 pb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-stone-900 mb-1 font-serif">
                {message.subject}
              </h2>
              <div className="text-xs font-mono text-stone-500 flex items-center gap-3">
                <span className="bg-stone-200 px-2 py-0.5 rounded-full font-bold">
                  Sceau: {message.seal}
                </span>
                <span>{message.date}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-red-500 p-2"
            >
              <XCircle size={28} />
            </button>
          </div>
          <div className="space-y-6 font-sans">
            <div className="text-sm">
              <span className="font-bold uppercase text-[10px] text-stone-500 block mb-2 tracking-widest">
                Expéditeur:
              </span>
              <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-inner font-bold text-stone-800">
                {message.from}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-bold uppercase text-[10px] text-stone-500 block mb-2 tracking-widest">
                Message:
              </span>
              <div className="bg-white p-4 md:p-6 rounded-lg border border-stone-200 shadow-inner min-h-[180px] whitespace-pre-wrap italic font-serif leading-relaxed text-stone-800 text-base md:text-lg">
                "{message.content}"
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <button
              onClick={onClose}
              className="bg-stone-800 text-white px-10 py-3 rounded-lg text-[10px] font-bold uppercase hover:bg-stone-700 tracking-[0.2em] shadow-md w-full md:w-auto"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
