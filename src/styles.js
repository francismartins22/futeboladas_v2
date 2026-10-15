/* ----------------------------- Design tokens ---------------------------- */
export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800&display=swap');

.ft {
  --bg:#0a0f0e; --panel:#0d1411; --card:#111b16; --raised:#16221c;
  --line:#22312b; --line-soft:rgba(255,255,255,.06);
  --text:#e9f0eb; --dim:#90a69b; --faint:#7d958a;
  --grass:#16a34a; --grass-2:#22c55e; --grass-bright:#4ade80;
  --lime:#c6f24a; --gold:#f5c542; --chalk:#f5f8f6; --ink:#080b0a;
  --danger:#f0563a; --danger-ink:#ff9684; --blue:#6aa9e0;
  --focus:#c6f24a;
  font-family:'Barlow',system-ui,sans-serif; font-size:15px; color:var(--text);
  background:var(--bg);
  min-height:100vh; -webkit-font-smoothing:antialiased; caret-color:var(--grass-bright);
  color-scheme:dark; /* calendario, relogio e menus nativos (date/time/select) em modo escuro */
}
.ft ::selection{background:rgba(198,242,74,.35);color:var(--chalk);}
/* Anel de foco so para teclado (rato/toque nao o mostram) */
.ft :focus{outline:none;}
.ft :focus-visible{outline:2px solid var(--focus);outline-offset:2px;}
.ft *{box-sizing:border-box;}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
.ft ::-webkit-scrollbar{display:none;}
.ft .num{font-family:'Barlow Condensed',system-ui,sans-serif;font-weight:800;letter-spacing:0;font-variant-numeric:tabular-nums;}
/* rotulo de secao: texto normal, sem caixa alta espacada */
.ft .eyebrow{font-size:13px;color:var(--dim);font-weight:600;}
.ft-card{background:var(--card);border:1px solid var(--line);border-radius:16px;}
.ft-raised{background:var(--raised);border:1px solid var(--line);}
.ft-btn{border:none;cursor:pointer;font-family:inherit;border-radius:14px;font-weight:700;
  transition:transform .12s ease,background .15s ease,opacity .15s;display:inline-flex;align-items:center;justify-content:center;gap:8px;}
.ft-btn:active:not(:disabled){transform:scale(.96);}
.ft-btn:disabled{opacity:.45;cursor:not-allowed;}
.ft-grass{background:var(--grass-2);color:#04130a;}
.ft-grass:hover{background:var(--grass-bright);}
.ft-ghost{background:var(--raised);color:var(--text);border:1px solid var(--line);}
.ft-ghost:hover{border-color:#33473f;}
.ft-danger{background:rgba(240,86,58,.12);color:var(--danger-ink);border:1px solid rgba(240,86,58,.3);}
.ft-danger:hover{background:rgba(240,86,58,.2);}
.ft-input{width:100%;background:#0a120f;border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--text);font-family:inherit;font-size:14px;outline:none;transition:border-color .15s;}
.ft-input::placeholder{color:var(--faint);}
.ft-input:focus{border-color:var(--grass);}
.ft-input:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(34,197,94,.3);}
/* 16px em ecras de toque: abaixo disso o iPhone faz zoom ao tocar no campo */
@media (pointer:coarse){.ft-input{font-size:16px;}}
.ft-link{background:none;border:none;cursor:pointer;font-family:inherit;padding:8px;border-radius:8px;}
.ft-link:hover{text-decoration:underline;text-underline-offset:3px;}
/* Cromo: o jogador como cromo de caderneta (moldura branca 3:4, nome em condensada). MVP = dourado; vaga = "Falta" tracejado */
.cromo{position:relative;aspect-ratio:3/4;border-radius:7px;background:var(--chalk);padding:3px;display:flex;flex-direction:column;min-width:0;}
.cromo-face{flex:1;border-radius:5px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#1d6b3e;color:var(--chalk);font-family:'Barlow Condensed',sans-serif;font-weight:800;}
.cromo-face img{width:100%;height:100%;object-fit:cover;}
.cromo-name{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:12px;line-height:1.35;color:#0a0f0e;text-align:center;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px;}
.cromo-mvp{background:var(--gold);}
.cromo-falta{aspect-ratio:3/4;border-radius:7px;border:1.5px dashed #3a4d44;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--dim);}
.cromo-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;}
@media (min-width:520px){.cromo-grid{grid-template-columns:repeat(6,minmax(0,1fr));}}
/* o unico momento de movimento da app: o cromo "cola-se" na pagina quando aparece */
@keyframes ftstick{from{opacity:0;transform:translateY(-6px) rotate(-4deg) scale(1.06);}to{opacity:1;transform:none;}}
.cromo-stick{animation:ftstick .32s cubic-bezier(.2,.8,.25,1) both;}
.bib{width:26px;height:26px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;}
.bib-white{background:var(--chalk);color:#0b0b0b;}
.bib-black{background:#0c0f0e;color:#cfe8da;border:1px solid #2a3a33;}
/* 100dvh = altura visivel real no telemovel (sem a barra do browser); 100vh fica como recurso para browsers antigos */
.chat-h{height:calc(100vh - 158px);height:calc(100dvh - 158px);}
@keyframes ftpop{from{opacity:0;transform:scale(.9);}to{opacity:1;transform:scale(1);}}
.ft-pop{animation:ftpop .25s ease both;}
@keyframes ftspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){.ft-pop,.cromo-stick{animation:none;}.ft-btn{transition:none;}.ft-btn:active:not(:disabled){transform:none;}}
`;
