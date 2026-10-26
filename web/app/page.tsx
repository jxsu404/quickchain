// Landing (/), en inglés para el jurado de APEX. La demo vive en /demo; el presupuesto sigue en /presupuesto.
import Link from "next/link";
import { Aviso } from "./aviso";
import { Cabecera } from "./cabecera";

const GITHUB = "https://github.com/jxsu404/stellar-quickpass";
const CONTRATO = "https://stellar.expert/explorer/testnet/contract/CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE";

const PASOS = [
  { icono: "correo", titulo: "Log in with Cavos", texto: "No seed phrase." },
  { icono: "presupuesto", titulo: "Sign one monthly budget", texto: "A capped USDC budget on Stellar, enforced by a Soroban contract." },
  { icono: "agente", titulo: "The agent pays", texto: "It pays x402 APIs automatically until the cap is reached or the month ends." },
];

export default function Landing() {
  return (
    <div className="landing">
      <div className="wrap"><Cabecera /></div>
      <main>
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <h1>Stellar QuickPass</h1>
              <p className="tagline">Your AI agent pays for APIs automatically, never past your cap.</p>
              <div className="ctas">
                <Link className="btn primary" href="/demo">Try the demo</Link>
                <a className="btn" href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
                <span className="badge">Testnet prototype</span>
              </div>
            </div>
            <figure className="tarjeta" aria-label="Example of a budget card">
              <figcaption className="etiqueta">example data</figcaption>
              <div className="tope-txt"><span>$0.03 of $0.05 used</span><span>resets Nov 1</span></div>
              <div className="barra" role="img" aria-label="60% of the cap used"><div style={{ width: "60%" }} /></div>
              <div className="fila ok"><span aria-hidden>✓</span> Paid $0.01</div>
              <div className="fila no"><span aria-hidden>✕</span> Blocked by contract: cap reached</div>
            </figure>
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>The problem</h2>
            <p>
              Today, owners of AI agents have two bad options: sign every x402 payment by hand, or give the agent
              a wallet with no real spending limit.
            </p>
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>How it works</h2>
            <ol className="steps">
              {PASOS.map((p, i) => (
                <li key={p.icono}>
                  <span className="n">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="icono" src={`/brand/iconos/${p.icono}.svg`} alt="" width={28} height={28} />
                  <b>{p.titulo}</b><span>{p.texto}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>Pricing</h2>
            <p>1% of what the agent spends. No monthly fee. API providers settle in seconds on Stellar, in USDC.</p>
            <p className="ejemplo">If your agent spends $10, you pay $0.10 (example).</p>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="links">
            <span className="badge">Testnet demo</span>
            <a href={CONTRATO} target="_blank" rel="noreferrer">Contract on Stellar Expert</a>
            <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
            <span>Built for Pura Vida Ideathon</span>
          </div>
          <Aviso />
        </div>
      </footer>
    </div>
  );
}
