import { useCallback, useRef, useState } from "react";

interface HomeIndicatorProps {
  dark?: boolean;
  onHome?: () => void;
}

/**
 * iOS home indicator bar — fixed at the bottom safe area.
 * Supports tap + swipe-up to trigger onHome. The gesture area extends
 * slightly above the bar so the thumb has room to start the swipe.
 */
export function HomeIndicator({ dark = false, onHome }: HomeIndicatorProps) {
  const barColor = dark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.55)";
  const startY = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dist, setDist] = useState(0);

  const onStart = useCallback((clientY: number) => {
    startY.current = clientY;
    setDragging(true);
  }, []);

  const onMove = useCallback(
    (clientY: number) => {
      if (startY.current === null) return;
      const d = Math.max(0, startY.current - clientY);
      setDist(d);
    },
    [],
  );

  const onEnd = useCallback(() => {
    if (dist > 50 && onHome) {
      onHome();
    }
    startY.current = null;
    setDragging(false);
    setDist(0);
  }, [dist, onHome]);

  // The visible bar; the touch target extends 16px above for easier swiping.
  return (
    <div
      className="absolute bottom-0 left-0 z-40 flex w-full items-end justify-center"
      style={{
        height: dist > 0 ? 34 + dist : 34,
        paddingBottom: 8,
        transition: dragging ? "none" : "height 0.3s cubic-bezier(0.32,0.72,0,1)",
      }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        onStart(e.clientY);
      }}
      onPointerMove={(e) => dragging && onMove(e.clientY)}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      onClick={() => dist === 0 && onHome?.()}
    >
      <div
        className="h-[5px] w-[135px] rounded-full"
        style={{
          background: barColor,
          opacity: dragging ? 0.7 : 1,
        }}
      />
    </div>
  );
}
