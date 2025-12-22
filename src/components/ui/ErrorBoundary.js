import React from "react";
import { ServerCrash } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError)
      return (
        <div className="flex items-center justify-center h-screen bg-stone-900 text-stone-400 p-4 flex-col gap-4 text-center font-sans">
          <div className="bg-stone-800 p-10 rounded-2xl border-2 border-red-500 shadow-2xl">
            <ServerCrash
              size={64}
              className="mx-auto mb-6 text-red-500 animate-pulse"
            />
            <p className="font-bold text-xl text-white uppercase tracking-tighter mb-2">
              Panne Critique Système
            </p>
            <div className="bg-black/40 p-4 rounded-lg text-left max-w-md overflow-auto max-h-40 text-red-400 border border-white/10 mb-6 font-mono text-[10px]">
              {String(this.state.error?.message || "Erreur inconnue")}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl uppercase font-black text-xs tracking-widest"
            >
              Redémarrer
            </button>
          </div>
        </div>
      );
    return this.props.children;
  }
}

export default ErrorBoundary;
