import { useEffect, useRef } from "react";

const NavButton = ({ active, onClick, icon: Icon, label, badge, btnRef }) => (
  <button ref={btnRef} onClick={onClick} data-active={active} className="navbtn ft-btn" style={{ background: "none", flexDirection: "column", minWidth: 58, padding: "6px 4px", borderRadius: 14, color: active ? "var(--grass-bright)" : "var(--faint)", position: "relative", flexShrink: 0 }}>
    <div style={{ position: "relative" }}>
      <Icon size={22} className="tab-ico" strokeWidth={active ? 2.5 : 2} />
      {badge > 0 && (
        <div style={{ position: "absolute", top: -6, right: -8, minWidth: 18, height: 18, borderRadius: 999, background: "var(--danger)", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "1.5px solid var(--bg)", lineHeight: 1 }}>
          {badge > 99 ? "99+" : badge}
        </div>
      )}
    </div>
    <span style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{label}</span>
  </button>
);

export const BottomNav = ({ items }) => {
  const scrollerRef = useRef(null);
  const btnRefs = useRef({});
  const activeId = items.find((it) => it.active)?.id;

  useEffect(() => {
    const scroller = scrollerRef.current;
    const btn = btnRefs.current[activeId];
    if (!scroller || !btn) return;
    const target = btn.offsetLeft - (scroller.clientWidth - btn.clientWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeId]);

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(10,15,14,.92)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div ref={scrollerRef} style={{ display: "flex", overflowX: "auto", justifyContent: "space-around", gap: 2, padding: "8px 10px", maxWidth: 760, margin: "0 auto" }}>
        {items.map((it) => <NavButton key={it.id} active={it.active} onClick={it.onClick} icon={it.icon} label={it.label} badge={it.badge} btnRef={(el) => (btnRefs.current[it.id] = el)} />)}
      </div>
    </div>
  );
};
