interface CaminAILogoProps {
  className?: string;
  size?: number;
}

export function CaminAILogo({ className, size = 60 }: CaminAILogoProps) {
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label="CaminAI Logo"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="caminai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
          </linearGradient>
          <linearGradient id="caminai-path" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--success))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        
        {/* Base circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          fill="url(#caminai-gradient)" 
          opacity="0.15"
        />
        
        {/* Path/road representation */}
        <path
          d="M30 75 Q50 45 70 25"
          stroke="url(#caminai-path)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Walking cane icon */}
        <path
          d="M55 20 L55 65 Q55 72 48 72 L45 72"
          stroke="hsl(var(--foreground))"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* AI detection waves */}
        <circle 
          cx="55" 
          cy="40" 
          r="12" 
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeDasharray="4 2"
          opacity="0.6"
        />
        <circle 
          cx="55" 
          cy="40" 
          r="20" 
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeDasharray="6 3"
          opacity="0.4"
        />
        <circle 
          cx="55" 
          cy="40" 
          r="28" 
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          strokeDasharray="8 4"
          opacity="0.2"
        />
        
        {/* AI dot */}
        <circle 
          cx="55" 
          cy="40" 
          r="4" 
          fill="hsl(var(--primary))"
        />
      </svg>
    </div>
  );
}
