/* ----------------------------- Design tokens ---------------------------- */
export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap');

.ft {
  --bg:#0a0f0e; --panel:#0d1411; --card:#111b16; --raised:#16221c;
  --line:#22312b; --line-soft:rgba(255,255,255,.06);
  --text:#e9f0eb; --dim:#90a69b; --faint:#7d958a;
  --grass:#16a34a; --grass-2:#22c55e; --grass-bright:#4ade80;
  --lime:#c6f24a; --gold:#f5c542; --chalk:#f5f8f6; --ink:#080b0a;
  --danger:#f0563a; --blue:#6aa9e0;
  font-family:'Inter',system-ui,sans-serif; color:var(--text);
  background:
    radial-gradient(1200px 600px at 50% -10%, rgba(34,197,94,.10), transparent 60%),
    radial-gradient(900px 500px at 90% 110%, rgba(34,197,94,.05), transparent 55%),
    var(--bg);
  min-height:100vh; -webkit-font-smoothing:antialiased;
}
.ft *{box-sizing:border-box;}
.ft ::-webkit-scrollbar{display:none;}
.ft .num{font-family:'Anton',Impact,sans-serif;letter-spacing:.5px;font-weight:400;}
.ft .eyebrow{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--faint);font-weight:700;}
.ft-card{background:var(--card);border:1px solid var(--line);border-radius:20px;}
.ft-raised{background:var(--raised);border:1px solid var(--line);}
.ft-btn{border:none;cursor:pointer;font-family:inherit;border-radius:14px;font-weight:700;
  transition:transform .12s ease,background .15s ease,opacity .15s;display:inline-flex;align-items:center;justify-content:center;gap:8px;}
.ft-btn:active{transform:scale(.96);}
.ft-btn:disabled{opacity:.45;cursor:not-allowed;}
.ft-grass{background:linear-gradient(135deg,var(--grass-2),var(--grass));color:#04130a;box-shadow:0 8px 24px -10px rgba(34,197,94,.6);}
.ft-grass:hover{background:linear-gradient(135deg,var(--grass-bright),var(--grass-2));}
.ft-ghost{background:var(--raised);color:var(--text);border:1px solid var(--line);}
.ft-ghost:hover{border-color:#33473f;}
.ft-danger{background:rgba(240,86,58,.12);color:#ff9684;border:1px solid rgba(240,86,58,.3);}
.ft-danger:hover{background:rgba(240,86,58,.2);}
.ft-input{width:100%;background:#0a120f;border:1px solid var(--line);border-radius:12px;padding:12px 14px;color:var(--text);font-family:inherit;font-size:14px;outline:none;transition:border-color .15s;}
.ft-input::placeholder{color:#6f857a;}
.ft-input:focus{border-color:var(--grass);}
.pitch{position:relative;overflow:hidden;border-radius:22px;border:1px solid var(--line);
  background:radial-gradient(120% 80% at 50% -20%, rgba(34,197,94,.22), transparent 60%),linear-gradient(180deg,#0f2017,#0a1611);}
.pitch .lines{position:absolute;inset:0;opacity:.5;pointer-events:none;}
.pitch .stripe{position:absolute;inset:0;background:repeating-linear-gradient(90deg, rgba(255,255,255,.018) 0 38px, transparent 38px 76px);pointer-events:none;}
.bib{width:26px;height:26px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;}
.bib-white{background:var(--chalk);color:#0b0b0b;}
.bib-black{background:#0c0f0e;color:#cfe8da;border:1px solid #2a3a33;}
.tab-ico{transition:transform .15s ease;}
.navbtn[data-active="true"] .tab-ico{transform:translateY(-2px) scale(1.08);}
@keyframes ftin{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.ft-in{animation:ftin .35s cubic-bezier(.2,.7,.3,1) both;}
/* 100dvh = altura visivel real no telemovel (sem a barra do browser); 100vh fica como recurso para browsers antigos */
.chat-h{height:calc(100vh - 158px);height:calc(100dvh - 158px);}
@keyframes ftpop{from{opacity:0;transform:scale(.9);}to{opacity:1;transform:scale(1);}}
.ft-pop{animation:ftpop .25s ease both;}
@keyframes ftspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){.ft-in,.ft-pop{animation:none;}}
`;
