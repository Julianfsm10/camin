interface VisionLogoProps {
  className?: string;
  size?: number;
}

export function VisionLogo({ className, size = 60 }: VisionLogoProps) {
  return (
    <div 
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Vision AI Logo"
    >
      <svg
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer circle - subtle glow */}
        <circle
          cx="30"
          cy="30"
          r="28"
          stroke="url(#gradient-ring)"
          strokeWidth="2"
          opacity="0.6"
        />
        
        {/* Main eye shape */}
        <ellipse
          cx="30"
          cy="30"
          rx="20"
          ry="14"
          stroke="url(#gradient-eye)"
          strokeWidth="2.5"
          fill="none"
        />
        
        {/* Iris */}
        <circle
          cx="30"
          cy="30"
          r="10"
          fill="url(#gradient-iris)"
        />
        
        {/* Pupil */}
        <circle
          cx="30"
          cy="30"
          r="5"
          fill="hsl(231, 37%, 14%)"
        />
        
        {/* AI spark */}
        <circle
          cx="33"
          cy="27"
          r="2"
          fill="white"
          opacity="0.9"
        />
        
        {/* Scanning lines */}
        <path
          d="M10 30 Q20 20 30 20 Q40 20 50 30"
          stroke="url(#gradient-scan)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M10 30 Q20 40 30 40 Q40 40 50 30"
          stroke="url(#gradient-scan)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
        
        <defs>
          <linearGradient id="gradient-ring" x1="0" y1="0" x2="60" y2="60">
            <stop offset="0%" stopColor="hsl(263, 84%, 58%)" />
            <stop offset="100%" stopColor="hsl(38, 92%, 50%)" />
          </linearGradient>
          
          <linearGradient id="gradient-eye" x1="10" y1="30" x2="50" y2="30">
            <stop offset="0%" stopColor="hsl(263, 84%, 58%)" />
            <stop offset="100%" stopColor="hsl(263, 84%, 68%)" />
          </linearGradient>
          
          <radialGradient id="gradient-iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(263, 84%, 68%)" />
            <stop offset="100%" stopColor="hsl(263, 84%, 48%)" />
          </radialGradient>
          
          <linearGradient id="gradient-scan" x1="10" y1="30" x2="50" y2="30">
            <stop offset="0%" stopColor="hsl(38, 92%, 50%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(38, 92%, 50%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(38, 92%, 50%)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
