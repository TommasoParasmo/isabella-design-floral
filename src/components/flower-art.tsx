// Ilustração usada enquanto o produto não tem foto.
const palettes = [
  { petal: "#7a1b33", inner: "#561124", bg: "#f8ebe8" },
  { petal: "#e8b4b8", inner: "#c98a91", bg: "#fdf8f6" },
  { petal: "#b9485f", inner: "#7a1b33", bg: "#f2d5d3" },
  { petal: "#f2d5d3", inner: "#e8b4b8", bg: "#7a1b33" },
];

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function FlowerArt({ seed, className = "" }: { seed: string; className?: string }) {
  const h = hash(seed);
  const p = palettes[h % palettes.length];
  const petals = 6 + (h % 4);
  const rotation = h % 60;

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="200" fill={p.bg} />
      <g transform="translate(100 112)">
        <path d="M0 10 C -6 40, -4 70, 0 100" stroke="#5e7a5a" strokeWidth="3" fill="none" />
        <ellipse cx="-18" cy="52" rx="16" ry="6" fill="#7d9a76" transform="rotate(-30 -18 52)" />
        <ellipse cx="16" cy="66" rx="14" ry="5" fill="#6c8a66" transform="rotate(28 16 66)" />
      </g>
      <g transform={`translate(100 92) rotate(${rotation})`}>
        {Array.from({ length: petals }, (_, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-26"
            rx="17"
            ry="30"
            fill={p.petal}
            opacity="0.92"
            transform={`rotate(${(360 / petals) * i})`}
          />
        ))}
        {Array.from({ length: petals }, (_, i) => (
          <ellipse
            key={`in-${i}`}
            cx="0"
            cy="-13"
            rx="9"
            ry="16"
            fill={p.inner}
            transform={`rotate(${(360 / petals) * i + 180 / petals})`}
          />
        ))}
        <circle r="8" fill={p.bg} opacity="0.6" />
      </g>
    </svg>
  );
}
