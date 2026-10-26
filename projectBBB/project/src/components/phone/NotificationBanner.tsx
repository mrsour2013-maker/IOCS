import { useEffect, useRef, useState } from "react";
import { playNotificationSound, haptic, resumeAudio } from "@/utils/audio";

interface NotificationBannerProps {
  /** contact display name */
  name: string;
  /** contact avatar URL */
  avatar?: string;
  /** avatar color fallback */
  color: string;
  /** app label shown as the source (e.g. "LINE") */
  appLabel?: string;
  /** message body */
  message: string;
  /** called when the banner is tapped (open the chat) */
  onTap: () => void;
  /** called when the banner auto-dismisses after the timeout */
  onDismiss: () => void;
  /** how long the banner stays visible, in ms */
  durationMs?: number;
}

/**
 * iOS-style top banner notification with a LINE-flavored look. Slides in
 * from the top, plays a gentle chime + haptic, auto-dismisses after
 * `durationMs`, and can be tapped to jump into the chat.
 */
export function NotificationBanner({
  name,
  avatar,
  color,
  appLabel = "LINE",
  message,
  onTap,
  onDismiss,
  durationMs = 2000,
}: NotificationBannerProps) {
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    // play sound + haptic on show
    resumeAudio();
    playNotificationSound();
    haptic([10, 30, 10]);
    // trigger the slide-in transition on the next frame
    const raf = requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => handleDismiss(), durationMs);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
    // wait for slide-out transition before notifying parent
    window.setTimeout(onDismiss, 300);
  };

  const handleTap = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
    window.setTimeout(onTap, 300);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex justify-center px-3 pt-2">
      <button
        onClick={handleTap}
        className={`pointer-events-auto w-full max-w-[370px] overflow-hidden rounded-[22px] border border-white/10 bg-[#1c1c1e]/80 text-left shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-[120%] opacity-0"
        }`}
      >
        <div className="flex items-start gap-3 px-3.5 py-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] text-white"
            style={{ background: color, fontSize: 16 }}
          >
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" draggable={false} />
            ) : (
              name.slice(0, 1)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[15px] font-semibold text-white">{name}</span>
              <span className="shrink-0 text-[11px] text-white/50">现在</span>
            </div>
            <div className="mt-0.5 truncate text-[14px] leading-snug text-white/70">
              {message}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3.5 pb-2 text-[11px] font-medium text-[#06C755]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#06C755]" />
          {appLabel}
        </div>
      </button>
    </div>
  );
}
