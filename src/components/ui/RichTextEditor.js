import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Minus, Image, RotateCcw, RotateCw,
} from "lucide-react";

function ToolBtn({ children, onMouseDown, title }) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      title={title}
      className="p-1.5 rounded transition-colors text-stone-600 hover:bg-stone-200 flex-shrink-0 leading-none"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-stone-200 mx-0.5 flex-shrink-0" aria-hidden="true" />;
}

function ToolSelect({ label, options, onMouseDown, onChange }) {
  return (
    <select
      title={label}
      onMouseDown={onMouseDown}
      onChange={onChange}
      defaultValue=""
      className="text-[10px] bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 text-stone-600 cursor-pointer outline-none hover:border-stone-300 flex-shrink-0"
    >
      <option value="" disabled>{label}</option>
      {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
    </select>
  );
}

const isHtmlStr = (s) => /<[a-z][\s\S]*?>/i.test(s || "");

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Rédigez ici…",
  minHeight = 300,
}) {
  const editorRef = useRef(null);
  const savedRange = useRef(null);
  const isComposing = useRef(false);
  const [showImg, setShowImg] = useState(false);
  const [imgUrl, setImgUrl] = useState("");

  // Sync external value into DOM (only on real external change)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = value || "";
    if (el.innerHTML === next) return;
    if (isHtmlStr(next)) {
      el.innerHTML = next;
    } else {
      // Backward compat: plain-text content from old textarea
      el.innerText = next;
    }
  }, [value]);

  const notify = useCallback(() => {
    if (onChange && editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    notify();
  }, [notify]);

  const saveRange = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  }, []);

  const execRestored = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      try { sel.removeAllRanges(); sel.addRange(savedRange.current.cloneRange()); } catch {}
    }
    document.execCommand(cmd, false, val);
    notify();
  }, [notify]);

  const insertImage = () => {
    const url = imgUrl.trim();
    if (!url) return;
    const safe = url.replace(/"/g, "&quot;").replace(/</g, "&lt;");
    execRestored(
      "insertHTML",
      `<img src="${safe}" style="max-width:100%;height:auto;border-radius:6px;margin:8px 0;display:block;" alt="" />`
    );
    setImgUrl("");
    setShowImg(false);
  };

  const isEmpty =
    !value || value === "<br>" || value === "<div><br></div>" || value.trim() === "";

  const mk = (onMD, child, title) => (
    <ToolBtn onMouseDown={onMD} title={title}>{child}</ToolBtn>
  );

  return (
    <div className="border border-stone-300 rounded-lg overflow-hidden bg-white focus-within:border-purple-400 transition-colors">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-stone-200 bg-stone-50">
        {mk((e) => { e.preventDefault(); exec("undo"); },   <RotateCcw size={13} />, "Annuler (Ctrl+Z)")}
        {mk((e) => { e.preventDefault(); exec("redo"); },   <RotateCw  size={13} />, "Rétablir (Ctrl+Y)")}
        <Sep />
        {mk((e) => { e.preventDefault(); exec("bold"); },          <Bold      size={13} />, "Gras (Ctrl+B)")}
        {mk((e) => { e.preventDefault(); exec("italic"); },        <Italic    size={13} />, "Italique (Ctrl+I)")}
        {mk((e) => { e.preventDefault(); exec("underline"); },     <Underline size={13} />, "Souligné (Ctrl+U)")}
        {mk((e) => { e.preventDefault(); exec("strikeThrough"); }, <span className="text-[11px] font-bold">S̶</span>, "Barré")}
        <Sep />
        {mk((e) => { e.preventDefault(); exec("formatBlock", "h2"); },         <span className="text-[10px] font-black">H1</span>,  "Grand titre")}
        {mk((e) => { e.preventDefault(); exec("formatBlock", "h3"); },         <span className="text-[10px] font-black">H2</span>,  "Sous-titre")}
        {mk((e) => { e.preventDefault(); exec("formatBlock", "p"); },          <span className="text-[10px] font-black">¶</span>,   "Paragraphe normal")}
        {mk((e) => { e.preventDefault(); exec("formatBlock", "blockquote"); }, <span className="text-[12px] italic font-bold">❝</span>, "Citation / extrait")}
        <Sep />
        {mk((e) => { e.preventDefault(); exec("insertUnorderedList"); }, <List        size={13} />, "Liste à puces")}
        {mk((e) => { e.preventDefault(); exec("insertOrderedList"); },   <ListOrdered size={13} />, "Liste numérotée")}
        <Sep />
        {mk((e) => { e.preventDefault(); exec("justifyLeft"); },   <AlignLeft   size={13} />, "Aligner à gauche")}
        {mk((e) => { e.preventDefault(); exec("justifyCenter"); }, <AlignCenter size={13} />, "Centrer")}
        {mk((e) => { e.preventDefault(); exec("justifyRight"); },  <AlignRight  size={13} />, "Aligner à droite")}
        <Sep />
        <ToolSelect
          label="Taille"
          onMouseDown={saveRange}
          onChange={(e) => { execRestored("fontSize", e.target.value); e.target.value = ""; }}
          options={[
            ["1", "Très petit"], ["2", "Petit"], ["3", "Normal"],
            ["4", "Moyen"],      ["5", "Grand"], ["6", "Très grand"], ["7", "Énorme"],
          ]}
        />
        <ToolSelect
          label="Police"
          onMouseDown={saveRange}
          onChange={(e) => { execRestored("fontName", e.target.value); e.target.value = ""; }}
          options={[
            ["Georgia, serif",                    "Georgia"],
            ["'Palatino Linotype', serif",         "Palatino"],
            ["Arial, sans-serif",                  "Arial"],
            ["'Courier New', monospace",           "Courier"],
            ["'Book Antiqua', Palatino, serif",    "Antiqua"],
          ]}
        />
        <Sep />
        {mk((e) => { e.preventDefault(); exec("insertHorizontalRule"); }, <Minus size={13} />, "Séparateur horizontal")}
        {mk(
          (e) => { e.preventDefault(); saveRange(); setShowImg((v) => !v); },
          <Image size={13} />,
          "Insérer une image"
        )}
      </div>

      {/* ── Image URL bar ── */}
      {showImg && (
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border-b border-purple-100">
          <span className="text-[10px] font-bold text-purple-700 shrink-0">URL image :</span>
          <input
            autoFocus
            type="url"
            value={imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); insertImage(); }
              if (e.key === "Escape") setShowImg(false);
            }}
            placeholder="https://…"
            className="flex-1 text-xs bg-white border border-purple-200 rounded px-2 py-1 outline-none focus:border-purple-400"
          />
          <button
            type="button"
            onClick={insertImage}
            className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-3 py-1 rounded transition-colors"
          >
            Insérer
          </button>
          <button
            type="button"
            onClick={() => setShowImg(false)}
            className="text-purple-400 hover:text-purple-700 text-sm px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Editor area ── */}
      <div className="relative">
        {isEmpty && (
          <div
            className="absolute top-0 left-0 px-4 pt-4 text-sm text-stone-400 italic pointer-events-none select-none font-serif leading-relaxed"
            aria-hidden="true"
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => { if (!isComposing.current) notify(); }}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => { isComposing.current = false; notify(); }}
          onKeyDown={(e) => {
            if (e.key === "Tab") { e.preventDefault(); exec("insertHTML", "    "); }
          }}
          className="erudit-editor px-4 py-4 font-serif text-sm text-stone-800 leading-relaxed outline-none overflow-auto"
          style={{ minHeight: `${minHeight}px`, maxHeight: "600px" }}
        />
      </div>
    </div>
  );
}
