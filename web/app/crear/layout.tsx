import { Aviso } from "../aviso";
import { Cabecera } from "../cabecera";

// Mismo estilo que la landing (fondo Tinta), en una columna angosta.
export default function MarcoCrear({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing">
      <div className="wrap">
        <Cabecera />
        <div className="marco-demo">{children}</div>
        <footer><Aviso demo /></footer>
      </div>
    </div>
  );
}
