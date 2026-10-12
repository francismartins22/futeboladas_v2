import { useState, useEffect } from "react";
import { Loader2, Wind, Droplets, CloudSun, Sun, CloudRain, Cloud, CloudFog, CloudLightning, Snowflake } from "lucide-react";
import { getCoordsFromUrl } from "../utils";

/* ---------------------------- WeatherWidget ------------------------------ */
export const WeatherWidget = ({ date, locationUrl }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const info = (code) => {
    if (code === 0) return { Icon: Sun, label: "Céu limpo", color: "var(--gold)" };
    if ([1, 2, 3].includes(code)) return { Icon: CloudSun, label: "Pouco nublado", color: "var(--blue)" };
    if ([45, 48].includes(code)) return { Icon: CloudFog, label: "Nevoeiro", color: "var(--dim)" };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { Icon: CloudRain, label: "Chuva", color: "var(--blue)" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { Icon: Snowflake, label: "Neve", color: "var(--chalk)" };
    if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, label: "Trovoada", color: "#b48cf0" };
    return { Icon: Cloud, label: "Nublado", color: "var(--dim)" };
  };
  useEffect(() => {
    if (!date || !locationUrl) return;
    const coords = getCoordsFromUrl(locationUrl);
    if (!coords) { setError("Localização inválida no mapa"); return; }
    const run = async () => {
      setLoading(true); setError("");
      try {
        const game = new Date(date); const diff = Math.ceil((game - new Date()) / 864e5);
        if (diff > 14) { setError("Previsão disponível 14 dias antes"); setLoading(false); return; }
        if (diff < 0) { setError("Dados históricos não disponíveis"); setLoading(false); return; }
        const dateStr = new Date(date).toISOString().split("T")[0];
        const hour = new Date(date).getHours();
        // FIX: timezone=auto alinha a hora local com o indice horario do array
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;
        const res = await fetch(url); const data = await res.json();
        const h = data?.hourly;
        if (h && Array.isArray(h.temperature_2m) && h.temperature_2m.length > hour) {
          setWeather({
            temp: Math.round(h.temperature_2m[hour]),
            precip: h.precipitation_probability?.[hour] ?? 0,
            code: h.weathercode?.[hour] ?? 3,
            wind: Math.round(h.windspeed_10m?.[hour] ?? 0),
          });
        } else { setError("Sem dados para esta hora"); }
      } catch { setError("Erro ao carregar meteorologia"); }
      finally { setLoading(false); }
    };
    run();
  }, [date, locationUrl]);
  if (!locationUrl) return null;
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, fontSize: 12, color: "var(--dim)" }}><Loader2 size={14} style={{ animation: "ftspin 1s linear infinite" }} /> A consultar o tempo...</div>;
  if (error) return <div style={{ padding: 10, textAlign: "center", fontSize: 12, color: "var(--faint)", fontStyle: "italic" }}>{error}</div>;
  if (!weather) return null;
  const { Icon, label, color } = info(weather.code);
  return (
    <div className="ft-raised" style={{ borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon size={24} style={{ color }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--dim)", display: "flex", gap: 10, marginTop: 2 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Wind size={11} /> {weather.wind} km/h</span>
            {weather.precip > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--blue)" }}><Droplets size={11} /> {weather.precip}%</span>}
          </div>
        </div>
      </div>
      <div className="num" style={{ fontSize: 30, lineHeight: 1, display: "flex", alignItems: "flex-start" }}>{weather.temp}<span style={{ fontSize: 13, color: "var(--faint)", marginTop: 4 }}>°C</span></div>
    </div>
  );
};
