import Link from "next/link";

// Logo horizontal en 2 líneas (negativo, sobre Tinta), común a todas las páginas.
export function Cabecera() {
  return (
    <header className="cabecera">
      <Link href="/" aria-label="Stellar QuickPass home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/StellarQuickPass-horizontal-negativo.svg" alt="Stellar QuickPass" width={180} height={43} />
      </Link>
    </header>
  );
}
