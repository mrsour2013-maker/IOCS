interface IconProps {
  color: string;
  className?: string;
}

export function SignalIcon({ color, className = "" }: IconProps) {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="none" className={className}>
      <rect x="0" y="7" width="3" height="4" rx="1" fill={color} />
      <rect x="4.5" y="5" width="3" height="6" rx="1" fill={color} />
      <rect x="9" y="3" width="3" height="8" rx="1" fill={color} />
      <rect x="13.5" y="1" width="3" height="10" rx="1" fill={color} />
    </svg>
  );
}

export function WifiIcon({ color, className = "" }: IconProps) {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" fill="none" className={className}>
      <path
        d="M7.5 2.2c2.9 0 5.5 1.1 7.4 2.9.3.3.3.7 0 1l-.7.7c-.3.3-.7.3-1 0A8.3 8.3 0 007.5 4.3 8.3 8.3 0 001.8 6.8c-.3.3-.7.3-1 0L.1 6.1c-.3-.3-.3-.7 0-1A10.6 10.6 0 017.5 2.2z"
        fill={color}
      />
      <path
        d="M7.5 5.6c1.7 0 3.2.6 4.4 1.7.3.3.3.7 0 1l-.8.8c-.2.3-.6.3-.9 0A3.7 3.7 0 007.5 8a3.7 3.7 0 00-2.7 1.1c-.3.3-.7.3-.9 0l-.8-.8c-.3-.3-.3-.7 0-1A6.5 6.5 0 017.5 5.6z"
        fill={color}
      />
      <circle cx="7.5" cy="9.8" r="1.2" fill={color} />
    </svg>
  );
}

export function BatteryIcon({ color, className = "" }: IconProps) {
  return (
    <svg width="27" height="12" viewBox="0 0 27 12" fill="none" className={className}>
      <rect
        x="0.5"
        y="0.5"
        width="22"
        height="11"
        rx="3"
        stroke={color}
        strokeOpacity="0.4"
        fill="none"
      />
      <rect x="2" y="2" width="19" height="8" rx="1.5" fill={color} />
      <rect
        x="24"
        y="3.5"
        width="2"
        height="5"
        rx="1"
        fill={color}
        fillOpacity="0.4"
      />
    </svg>
  );
}
