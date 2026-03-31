interface ShieldLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function ShieldLogo({ width = 32, height = 36, className }: ShieldLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AI Security Brief shield logo"
      role="img"
      className={className}
    >
      <path
        d="M16 1.5L2 7v9c0 8.5 6 16 14 18 8-2 14-9.5 14-18V7L16 1.5z"
        stroke="#00b4ff"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(0,180,255,0.06)"
      />
      <path
        d="M9 16h4M19 16h4M16 12v4M16 16v4"
        stroke="#00b4ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="16" cy="16" r="2.5" fill="#00b4ff" opacity="0.9" />
      <circle cx="9" cy="16" r="1.2" fill="#00b4ff" opacity="0.5" />
      <circle cx="23" cy="16" r="1.2" fill="#00b4ff" opacity="0.5" />
      <circle cx="16" cy="12" r="1.2" fill="#00b4ff" opacity="0.5" />
      <circle cx="16" cy="20" r="1.2" fill="#00b4ff" opacity="0.5" />
    </svg>
  );
}
