import { cn } from "@/lib/utils";

/**
 * Minimal mark: India outline + Ashoka-Chakra-inspired ring + data nodes.
 */
export function Logo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label="MPLADS AI Monitor"
      className={cn("shrink-0", className)}
    >
      <circle cx="24" cy="24" r="22" fill="var(--saffron-soft)" />
      <g stroke="var(--navy)" strokeWidth="1.4" fill="none" opacity="0.85">
        <path d="M18 8.5c3.4-.6 7.6-.2 10.4 1.6 2.3 1.5 2 3.6.4 4.9-1.3 1-3.3 1.2-4.2 2.4-.9 1.2-.2 2.7.9 3.6 1.6 1.3 4 2 5 3.7 1 1.7.2 3.6-1.3 5-2.2 2-5 3-6.8 5.3-1.4 1.8-1.8 4.2-3.6 5.6-1.6 1.2-3.8.9-4.7-.7-1-1.9.2-4-.6-6-.7-1.7-2.6-2.6-3.6-4.2-1.2-1.9-.8-4.4.7-6 1.4-1.4 3.5-2 4.7-3.6 1-1.4.9-3.3.1-4.9-.7-1.4-2-2.5-2-4 0-1.4 1.4-2.4 3-2.7" />
      </g>
      <g transform="translate(30.5 30.5)">
        <circle r="7" fill="none" stroke="var(--navy)" strokeWidth="1.6" />
        <circle r="1.6" fill="var(--navy)" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={7 * Math.cos((i * Math.PI) / 6)}
            y2={7 * Math.sin((i * Math.PI) / 6)}
            stroke="var(--navy)"
            strokeWidth="0.7"
            opacity="0.7"
          />
        ))}
      </g>
      <g fill="var(--saffron)">
        <circle cx="12" cy="12" r="2.2" />
        <circle cx="36" cy="13" r="1.8" />
        <circle cx="10" cy="30" r="1.6" />
      </g>
      <g stroke="var(--saffron)" strokeWidth="0.9" opacity="0.6">
        <line x1="12" y1="12" x2="36" y2="13" />
        <line x1="12" y1="12" x2="10" y2="30" />
      </g>
    </svg>
  );
}

export function LogoWordmark({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={34} />
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-bold text-foreground">MPLADS AI Monitor</div>
          <div className="text-[11px] text-muted-foreground">Monitoring &amp; Decision Support</div>
        </div>
      )}
    </div>
  );
}
