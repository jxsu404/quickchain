// Landing (/), en inglés para el jurado de APEX. La demo vive en /demo; el presupuesto sigue en /presupuesto.
import Link from "next/link";

const GITHUB = "https://github.com/jxsu404/stellar-quickpass";
const CONTRATO = "https://stellar.expert/explorer/testnet/contract/CBKMDFKWDHO2V6K27R5W7N3DPSDNHOV5GBACNHZQ4YRC5YLYF2XROEEE";

export default function Landing() {
  return (
    <div className="landing">
      <main>
        <section className="hero">
          <div className="wrap">
            <h1>Stellar QuickPass</h1>
            <p className="tagline">Your AI agent pays for APIs automatically, never past your cap.</p>
            <div className="ctas">
              <Link className="btn primary" href="/demo">Try the demo</Link>
              <a className="btn" href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
            </div>
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
              <li><span className="n">1</span><b>Log in with Cavos</b><span>No seed phrase.</span></li>
              <li><span className="n">2</span><b>Sign one monthly budget</b><span>A capped USDC budget on Stellar, enforced by a Soroban contract.</span></li>
              <li><span className="n">3</span><b>The agent pays</b><span>It pays x402 APIs automatically until the cap is reached or the month ends.</span></li>
            </ol>
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>Pricing</h2>
            <p>1% of what the agent spends. No monthly fee. API providers get paid instantly in USDC.</p>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <span className="badge">Testnet demo</span>
          <a href={CONTRATO} target="_blank" rel="noreferrer">Contract on Stellar Expert</a>
          <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
          <span>Built for Pura Vida Ideathon</span>
        </div>
      </footer>
    </div>
  );
}
