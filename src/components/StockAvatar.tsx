'use client';

interface Props {
  /** Hex color for the X eyes + mouth. Silhouette is always black. */
  color: string;
  /** Visual size in pixels (square). */
  size?: number;
  className?: string;
}

/**
 * Renders /user-icon.svg as an inline SVG so the eyes/mouth (which use
 * `currentColor`) inherit the chosen color. Using <img> would lock to
 * black because external SVGs don't pick up CSS color from the page.
 */
export default function StockAvatar({ color, size = 64, className = '' }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      style={{ color, width: size, height: size }}
      className={className}
      aria-hidden="true"
    >
      <g fill="#000">
        <circle cx={250} cy={170} r={115} />
        <path d="M 250,300 C 130,300 60,365 60,445 L 60,500 L 440,500 L 440,445 C 440,365 370,300 250,300 Z" />
      </g>
      <rect x={155} y={146} width={80} height={18} rx={9} fill="currentColor" transform="rotate(45 195 155)" />
      <rect x={155} y={146} width={80} height={18} rx={9} fill="currentColor" transform="rotate(-45 195 155)" />
      <rect x={265} y={146} width={80} height={18} rx={9} fill="currentColor" transform="rotate(45 305 155)" />
      <rect x={265} y={146} width={80} height={18} rx={9} fill="currentColor" transform="rotate(-45 305 155)" />
      <rect x={185} y={221} width={130} height={18} rx={9} fill="currentColor" />
    </svg>
  );
}
