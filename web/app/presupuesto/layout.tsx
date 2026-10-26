import { Aviso } from "../aviso";
import { Cabecera } from "../cabecera";
import "./presupuesto.css";

// Mismo estilo que la landing (fondo Tinta), en una columna angosta.
export default function MarcoDemo({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing qp-page">
      <div className="wrap">
        <Cabecera />
        <div className="marco-demo">{children}</div>
        <footer><Aviso demo /></footer>
      </div>
    </div>
  );
}
