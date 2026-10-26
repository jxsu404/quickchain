"use client";
// Aviso mientras Cavos firma: la ventana de aprobación puede tardar 10–60 s sin mostrar nada.
// El contador se calcula desde la hora de inicio (no sumando ticks): si el navegador frena o bloquea
// los timers mientras Cavos/passkey trabaja, igual muestra los segundos reales (QA ronda 2, bug 4).
import { useEffect, useState } from "react";

export default function Espera({ texto }: { texto: string }) {
  const [inicio] = useState(() => Date.now());
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 500); return () => clearInterval(t); }, []);
  const seg = Math.max(0, Math.floor((ahora - inicio) / 1000));
  return (
    <p role="status">⏳ {texto} ({seg} s){seg >= 5 && <><br /><small className="sub">Signing on Stellar testnet can take 10–60 s. Keep this tab open and don&apos;t click again.</small></>}</p>
  );
}
