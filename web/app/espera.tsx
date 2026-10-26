"use client";
// Aviso mientras Cavos firma: la ventana de aprobación puede tardar 10–60 s sin mostrar nada.
import { useEffect, useState } from "react";

export default function Espera({ texto }: { texto: string }) {
  const [seg, setSeg] = useState(0);
  useEffect(() => { const t = setInterval(() => setSeg((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  return (
    <p role="status">⏳ {texto} ({seg} s){seg >= 5 && <><br /><small className="sub">Signing on Stellar testnet can take 10–60 s. Keep this tab open and don&apos;t click again.</small></>}</p>
  );
}
