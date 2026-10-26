import Link from "next/link";
import { Aviso } from "../aviso";
import { Cabecera } from "../cabecera";
import "./crear.css";

// /crear: same look as the landing (Tinta background), header with slogan, back link and footer.
export default function MarcoCrear({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing qc-page">
      <div className="wrap">
        <div className="qc-head">
          <Cabecera />
          <p className="qc-slogan">Your agent pays. You set the cap.</p>
        </div>
        <Link href="/" className="qc-back">← Back to home</Link>
        <div className="marco-demo qc-body">{children}</div>
        <footer className="qc-foot">
          <div className="qc-foot-links">
            <Link href="/">Home</Link>
            <Link href="/presupuesto">My budget</Link>
            <span>Testnet prototype</span>
          </div>
          <Aviso demo />
        </footer>
      </div>
    </div>
  );
}
