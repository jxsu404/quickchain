import { Aviso } from "../aviso";
import { Cabecera } from "../cabecera";
import "../presupuesto/presupuesto.css";
import "./dashboard.css";

// Mismo marco que /demo y /presupuesto (fondo Tinta, columna angosta, aviso de testnet).
export default function MarcoDashboard({ children }: { children: React.ReactNode }) {
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
