import { Aviso } from "../aviso";

// Mismo marco que tenía la app antes de la landing (columna de 640 px y aviso de testnet).
export default function MarcoDemo({ children }: { children: React.ReactNode }) {
  return (
    <div className="marco-demo">
      {children}
      <Aviso />
    </div>
  );
}
