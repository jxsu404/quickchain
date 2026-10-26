// Footer común de todas las páginas (aviso de testnet y marca Stellar).
export function Aviso({ demo = false }: { demo?: boolean }) {
  return (
    <p className="aviso">
      {demo && <>Stellar testnet demo. Not an investment or savings product; it controls an agent&apos;s spending.<br /></>}
      Stellar is a trademark of the Stellar Development Foundation. Independent project, not affiliated with or endorsed by SDF.
    </p>
  );
}
