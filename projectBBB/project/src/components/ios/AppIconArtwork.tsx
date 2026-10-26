/**
 * iOS app icons — faithful SVG reproductions of the official app icons.
 * Each icon is a single source of truth used by both the home grid and dock.
 * Do NOT replace with approximations, emoji, or Lucide icons.
 */

interface AppIconArtworkProps {
  iconKey: string;
  size?: number;
}

export function AppIconArtwork({ iconKey, size = 60 }: AppIconArtworkProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2237,
      }}
    >
      <IconSvg iconKey={iconKey} size={size} />
    </div>
  );
}

function IconSvg({ iconKey, size }: { iconKey: string; size: number }) {
  switch (iconKey) {
    case "line":
      return <LineIcon size={size} />;
    case "x":
      return <XIcon size={size} />;
    case "phone":
      return <PhoneIcon size={size} />;
    case "mail":
      return <MailIcon size={size} />;
    case "browser":
      return <BrowserIcon size={size} />;
    default:
      return <div style={{ width: size, height: size, background: "#d1d1d6" }} />;
  }
}

/* ── LINE: #06C755 background, white speech bubble, "LINE" wordmark ── */
function LineIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" rx="13.4" fill="#06C755" />
      {/* speech bubble */}
      <path
        d="M30 14.5c-11 0-19.8 7.1-19.8 15.8 0 7.9 7.3 14.5 17.1 15.6.7.14 1.6.45 1.84 1.03.22.53.14 1.36.07 1.9l-.3 1.78c-.1.54-.43 2.1 1.84 1.15 2.27-.95 12.2-7.2 16.6-12.3 3.06-3.5 3.26-6.4 3.26-10.2C49.8 21.6 41 14.5 30 14.5z"
        fill="#fff"
      />
      {/* "LINE" wordmark */}
      <text
        x="30"
        y="33.5"
        textAnchor="middle"
        fill="#06C755"
        fontFamily="Helvetica, Arial, sans-serif"
        fontWeight="700"
        fontSize="11.5"
        letterSpacing="0.3"
      >
        LINE
      </text>
    </svg>
  );
}

/* ── X: black background, official X logo path ── */
function XIcon({ size }: { size: number }) {
  // Official X logo path on 24x24 viewBox, mapped into the tile interior.
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" rx="13.4" fill="#000" />
      <g transform="translate(14 14) scale(1.333)">
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="#fff"
        />
      </g>
    </svg>
  );
}

/* ── Phone: iOS #34C759, standard white phone.fill silhouette ── */
function PhoneIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" rx="13.4" fill="#34C759" />
      <path
        d="M18.5 14.5c-1.5 0-2.7 1.2-2.7 2.7v2.6c0 11.3 9.2 20.4 20.4 20.4h2.6c1.5 0 2.7-1.2 2.7-2.7v-2.6c0-.9-.5-1.8-1.3-2.3l-5.1-3.1c-.9-.5-2-.4-2.7.3l-2.1 2.1c-3.2-1.5-5.8-4.1-7.3-7.3l2.1-2.1c.7-.7.8-1.8.3-2.7l-3.1-5.1c-.5-.8-1.4-1.3-2.3-1.3h-1.5z"
        fill="#fff"
      />
    </svg>
  );
}

/* ── Messages: iOS #34C759, white rounded speech bubble ── */
function MessagesIcon({ size }: { size: number }) {
  // The iOS Messages icon: a single rounded speech bubble, no tail.
  // The bubble is centered with generous padding, corners fully rounded.
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" rx="13.4" fill="#34C759" />
      <path
        d="M30 13.5c-9.4 0-17 6.1-17 13.6 0 4.1 2.4 7.8 6.1 10.1-.15 1.5-.82 3.9-2.5 5.8-.28.3-.04.82.35.74 3.05-.6 5.6-2.1 7.35-3.4 1.45.27 2.97.41 4.5.41 9.4 0 17-6.1 17-13.6S39.4 13.5 30 13.5z"
        fill="#fff"
      />
    </svg>
  );
}

/* ── Mail: blue gradient tile, white envelope ── */
function MailIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mail-gradient" x1="8" y1="6" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4DB7FF" />
          <stop offset="1" stopColor="#1478E8" />
        </linearGradient>
      </defs>
      <rect width="60" height="60" rx="13.4" fill="url(#mail-gradient)" />
      <rect x="10" y="17" width="40" height="27" rx="5" fill="white" />
      <path d="M11.5 19.5 30 34l18.5-14.5" stroke="#CFE9FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m12 42 13-11M48 42 35 31" stroke="#E8F5FF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Browser (Safari): blue tile, white compass face, red/white needle ── */
function BrowserIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" rx="13.4" fill="#1689E8" />
      <circle cx="30" cy="30" r="18" fill="#fff" />
      <circle cx="30" cy="30" r="15.8" fill="#7BC8F5" />
      <circle cx="30" cy="30" r="14.2" fill="#1689E8" />
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = ((i * 22.5 - 90) * Math.PI) / 180;
        const x1 = 30 + 13.2 * Math.cos(angle);
        const y1 = 30 + 13.2 * Math.sin(angle);
        const x2 = 30 + 14.2 * Math.cos(angle);
        const y2 = 30 + 14.2 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#fff"
            strokeWidth="0.7"
            strokeLinecap="round"
            opacity="0.85"
          />
        );
      })}
      <path d="M30 16.5L33 27.5L30 30Z" fill="#FF3B30" />
      <path d="M30 43.5L27 32.5L30 30Z" fill="#F7F7F7" />
      <circle cx="30" cy="30" r="1.5" fill="#fff" />
    </svg>
  );
}
