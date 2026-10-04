/**
 * The week's shape, as the asset cards draw it.
 *
 * A polyline with a soft fill under it, scaled to its own minimum and maximum
 * rather than to zero — these are price series, and anchoring at zero would
 * flatten every one of them into the same straight line.
 */
export function Sparkline({
  series,
  rising,
  width = 140,
  height = 40,
}: {
  series: number[];
  rising: boolean;
  width?: number;
  height?: number;
}) {
  if (series.length < 2) return <svg width={width} height={height} aria-hidden />;

  const min = Math.min(...series);
  const max = Math.max(...series);
  // A flat series would divide by zero; draw it down the middle instead.
  const span = max - min || 1;
  const step = width / (series.length - 1);

  const points = series.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / span) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const stroke = rising ? "#09af8e" : "#f6465d";
  const id = `spark-${rising ? "up" : "down"}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points.join(" ")} ${width},${height}`} fill={`url(#${id})`} />
      <polyline points={points.join(" ")} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
