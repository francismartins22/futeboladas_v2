import { getCoordsFromUrl } from "../utils";

export const MapPreview = ({ locationUrl }) => {
  const coords = getCoordsFromUrl(locationUrl);
  if (!coords) return null;
  const src = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`;
  return (
    <div className="ft-card" style={{ padding: 0, overflow: "hidden", height: 160 }}>
      <iframe
        title="Localização do campo"
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0, display: "block", filter: "invert(0.92) hue-rotate(180deg) contrast(0.9)" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};
