// Landing (/), en inglés. CTA principal a /crear; secundario ancla al ejemplo (#example).
import Link from "next/link";
import { Aviso } from "./aviso";
import "./landing.css";

const GITHUB = "https://github.com/jxsu404/stellar-quickpass";
const FABRICA = "https://stellar.expert/explorer/testnet/contract/CAVWWLDYBCYFPDZT5P5XW7GSOQHE6TVLSZXQ47RIJKGEKUSD23AZ34MO";

const PASOS = [
  { t: "Sign a monthly cap", p: "You sign one USDC budget. Once." },
  { t: "Contract enforces it", p: "A Soroban contract blocks any payment over the limit." },
  { t: "Agent pays APIs", p: "It pays x402 APIs on its own, within the cap." },
  { t: "1% fee", p: "Only on what the agent spends. No monthly fee." },
];
const CONFIANZA = [
  { t: "On-chain limits", p: "The cap lives in the contract, not in our servers." },
  { t: "No seed phrase", p: "Log in with email. Keys stay yours." },
  { t: "Resets monthly", p: "Unused budget never rolls into risk." },
];

function Ctas() {
  return (
    <div className="ql-ctas">
      <Link className="ql-b p" href="/crear">Create your budget</Link>
      <a className="ql-tl" href="#example">See how it works ↓</a>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="ql">
      <div className="ql-w ql-nav">
        <Link href="/" aria-label="Stellar QuickPass home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/StellarQuickPass-horizontal-negativo.svg" alt="Stellar QuickPass" width={168} height={40} />
        </Link>
        <a className="ql-s" href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
      </div>
      <main>
        <section className="ql-hero">
          <div className="ql-w ql-g">
            <div>
              <a className="ql-pill" href={FABRICA} target="_blank" rel="noreferrer">● Live on Stellar testnet</a>
              <h1>Your agent pays.<br /><em>You set the cap.</em></h1>
              <p className="ql-lead">Monthly USDC budgets for AI agents, enforced on-chain.</p>
              <p className="ql-why">Why a cap? A buggy loop or a hijacked agent can drain a wallet in minutes. A hard cap bounds the worst case.</p>
              <Ctas />
            </div>
            <figure className="ql-card" id="example" aria-label="Example budget">
              <span className="ql-tag">Example data</span>
              <div className="ql-amt">36.00 USDC <small>/ 50.00 USDC cap</small></div>
              <div className="ql-bar warn" role="img" aria-label="72% of the cap used"><i /><b /></div>
              <div className="ql-meta"><span>72% used</span><span>resets Nov 1</span></div>
              <ul className="ql-tx">
                <li><span>weather-api</span><span className="ok">✓ 0.02 USDC</span></li>
                <li><span>search-api</span><span className="ok">✓ 0.05 USDC</span></li>
                <li><span>gpu-render</span><span className="no">✕ over cap</span></li>
              </ul>
            </figure>
          </div>
        </section>

        <section className="ql-sec">
          <div className="ql-w">
            <div className="ql-k">How it works</div>
            <h2>One signature. Bounded spending.</h2>
            <ol className="ql-steps">
              {PASOS.map((s, i) => (
                <li key={s.t}><span className="n">0{i + 1}</span><h3>{s.t}</h3><p>{s.p}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ql-sec">
          <div className="ql-w">
            <div className="ql-k">Trust &amp; safety</div>
            <h2>The limit is code, not a promise.</h2>
            <div className="ql-trust">
              {CONFIANZA.map((c) => (<div key={c.t}><h3>{c.t}</h3><p>{c.p}</p></div>))}
            </div>
          </div>
        </section>

        <section className="ql-w">
          <div className="ql-cta">
            <h2>Give your agent a budget.</h2>
            <p>Takes a minute on testnet.</p>
            <Ctas />
          </div>
        </section>
      </main>
      <footer className="ql-f">
        <div className="ql-w">
          <div className="l">
            <a href={FABRICA} target="_blank" rel="noreferrer">Factory contract on Stellar Expert</a>
            <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
            <span>Testnet prototype</span>
          </div>
          <Aviso />
        </div>
      </footer>
    </div>
  );
}
