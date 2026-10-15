export const SoccerBall = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 17l-4.2-2.5 1.6-5.1h5.2l1.6 5.1z" />
    <path d="M12 17v5" /><path d="M7.8 14.5l-4 2.8" /><path d="M16.2 14.5l4 2.8" /><path d="M9.4 9.4l-4.2-2.6" /><path d="M14.6 9.4l4.2-2.6" />
  </svg>
);

export const TacticIcon = ({ size = 22, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /><circle cx="12" cy="12" r="3" />
  </svg>
);
