/* ------------------------------ Helpers ---------------------------------- */
export const firstName = (n) => (n || "").replace(/\s*\(.*$/, "").split(" ")[0];

export const avatarHue = (name) => { let h = 0; for (const c of name || "") h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

export const initials = (n) => (n || "?").replace(/\(.*$/, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

// Codigo de convite aleatorio (8 chars, sem 0/O/1/I para nao confundir). 32 simbolos => sem enviesamento do modulo.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const newInviteCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => CODE_CHARS[b % 32]).join("");

// Mensagem para o utilizador a partir de um erro do Firebase (codigos "permission-denied" ou "functions/permission-denied")
export const errorMessage = (e) => {
  const code = e?.code || "";
  if (code.endsWith("permission-denied")) return "Sem permissão para fazer isto.";
  if (code.endsWith("unavailable")) return "Sem ligação. Tenta novamente.";
  return "Algo correu mal. Tenta novamente.";
};

export const timeStr = (ts) => new Date(ts).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

export const rnd = () => Math.random().toString(36).slice(2, 7);

export const getCoordsFromUrl = (url) => {
  if (!url) return null;
  try {
    let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/); if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/); if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/); if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    return null;
  } catch { return null; }
};
