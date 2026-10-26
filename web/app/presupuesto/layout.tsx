import Link from "next/link";
import { Aviso } from "../aviso";

// Mismo marco que tenía la app antes de la landing (columna de 640 px y aviso de testnet).
export default function MarcoDemo({ children }: { children: React.ReactNode }) {
  return (
    <div className="marco-demo">
      <Link href="/" className="logo-demo" aria-label="Stellar QuickPass, inicio">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/StellarQuickPass-horizontal-color.svg" alt="Stellar QuickPass" width={180} height={43} />
      </Link>
      {children}
      <Aviso />
    </div>
  );
}
