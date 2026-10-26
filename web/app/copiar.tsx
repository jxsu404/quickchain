"use client";
import { useState } from "react";

// Botón pequeño para copiar una dirección (QA ronda 2, bug 5).
export default function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false);
  if (!texto) return null;
  return (
    <button type="button" className="copiar" onClick={() => navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }).catch(() => {})}>
      {ok ? "Copied ✓" : "Copy"}
    </button>
  );
}
