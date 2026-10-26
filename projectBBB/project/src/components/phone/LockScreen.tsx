import { useCallback, useEffect, useRef, useState } from "react";
import { useClock, formatLockTime, formatLockDate } from "@/hooks/useClock";
import { StatusBar } from "./StatusBar";
import { DynamicIsland } from "./DynamicIsland";
import { HomeIndicator } from "./HomeIndicator";
import { storyData } from "@/data";

const LOCK_PASSWORD = "0705";
const PASSWORD_LENGTH = LOCK_PASSWORD.length;

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const now = useClock();
  const [dragY, setDragY] = useState(0);
  const [showPasscode, setShowPasscode] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const startY = useRef<number | null>(null);
  const deleteTimer = useRef<number | null>(null);
  const errorTimer = useRef<number | null>(null);
  const unlockTimer = useRef<number | null>(null);
  const passwordRef = useRef("");
  const unlockingRef = useRef(false);

  const clearError = useCallback(() => {
    setError(false);
    setShaking(false);
    if (errorTimer.current !== null) {
      window.clearTimeout(errorTimer.current);
      errorTimer.current = null;
    }
  }, []);

  const verify = useCallback(
    (value: string) => {
      if (value.length !== PASSWORD_LENGTH || unlockingRef.current) return;
      if (value === LOCK_PASSWORD) {
        clearError();
        unlockingRef.current = true;
        setUnlocking(true);
        unlockTimer.current = window.setTimeout(onUnlock, 350);
        return;
      }
      passwordRef.current = "";
      setPassword("");
      setError(true);
      setShaking(true);
      if (errorTimer.current !== null) window.clearTimeout(errorTimer.current);
      errorTimer.current = window.setTimeout(() => {
        setError(false);
        setShaking(false);
      }, 2200);
    },
    [clearError, onUnlock],
  );

  const appendDigit = useCallback(
    (digit: string) => {
      if (unlockingRef.current || passwordRef.current.length >= PASSWORD_LENGTH) return;
      const next = passwordRef.current + digit;
      passwordRef.current = next;
      setPassword(next);
      if (next.length === PASSWORD_LENGTH) {
        verify(next);
      } else {
        clearError();
      }
    },
    [clearError, verify],
  );

  const deleteDigit = useCallback(() => {
    if (unlockingRef.current) return;
    clearError();
    passwordRef.current = passwordRef.current.slice(0, -1);
    setPassword(passwordRef.current);
  }, [clearError]);

  useEffect(() => {
    if (!showPasscode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) appendDigit(event.key);
      else if (event.key === "Backspace" || event.key === "Delete") deleteDigit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appendDigit, deleteDigit, showPasscode]);

  useEffect(() => {
    return () => {
      if (deleteTimer.current !== null) window.clearInterval(deleteTimer.current);
      if (errorTimer.current !== null) window.clearTimeout(errorTimer.current);
      if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current);
    };
  }, []);

  const handleStart = useCallback(
    (clientY: number) => {
      if (showPasscode || unlockingRef.current) return;
      startY.current = clientY;
    },
    [showPasscode],
  );

  const handleMove = useCallback(
    (clientY: number) => {
      if (startY.current === null || showPasscode || unlockingRef.current) return;
      const delta = Math.min(0, clientY - startY.current);
      setDragY(delta);
    },
    [showPasscode],
  );

  const handleEnd = useCallback(() => {
    if (startY.current === null) return;
    if (dragY < -120) {
      setShowPasscode(true);
      clearError();
    }
    setDragY(0);
    startY.current = null;
  }, [clearError, dragY]);

  const startDelete = useCallback(() => {
    deleteDigit();
    deleteTimer.current = window.setInterval(deleteDigit, 100);
  }, [deleteDigit]);

  const stopDelete = useCallback(() => {
    if (deleteTimer.current !== null) {
      window.clearInterval(deleteTimer.current);
      deleteTimer.current = null;
    }
  }, []);

  const wallpaper = storyData.meta.wallpaper;

  return (
    <div
      className="absolute inset-0 z-40 overflow-hidden"
      style={{
        transform: unlocking ? "translateY(-100%)" : `translateY(${dragY}px)`,
        transition:
          startY.current === null ? "transform 0.35s cubic-bezier(0.32,0.72,0,1)" : "none",
      }}
      onMouseDown={(e) => handleStart(e.clientY)}
      onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    >
      <style>{`
        @keyframes lock-password-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
      <WallpaperBackground src={wallpaper} />

      <DynamicIsland />
      <StatusBar dark />

      <div className="relative flex h-full flex-col items-center px-6 text-white">
        <div className="mt-[58px] flex flex-col items-center">
          <LockIcon />
          {!showPasscode && (
            <div className="mt-7 text-[15px] font-medium tracking-wide text-white/90">
              上滑以解锁
            </div>
          )}
        </div>

        {!showPasscode ? (
          <div className="mt-auto mb-[120px] flex flex-col items-center">
            <div className="text-[88px] font-light leading-none tracking-tight tabular-nums drop-shadow-sm">
              {formatLockTime(now)}
            </div>
            <div className="mt-2 text-[18px] font-medium tracking-wide text-white/90">
              {formatLockDate(now)}
            </div>
          </div>
        ) : (
          <div
            className="mt-auto mb-[84px] flex w-full flex-col items-center"
            style={{ animation: shaking ? "lock-password-shake 0.35s ease" : undefined }}
          >
            <div className="mb-2 text-[17px] font-medium">输入密码</div>
            <div className="mb-2 flex h-7 items-center gap-3">
              {Array.from({ length: PASSWORD_LENGTH }).map((_, index) => (
                <span
                  key={index}
                  className={`h-3 w-3 rounded-full border border-white ${
                    index < password.length ? "bg-white" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
            <div className="flex min-h-[24px] items-center justify-center px-2 text-center text-[13px] leading-tight text-white/90">
              {error ? "密码错误，请重新输入（提示：🎂）" : ""}
            </div>
            <div className="mt-3 grid w-[238px] grid-cols-3 gap-x-5 gap-y-3">
              {(["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const).map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => appendDigit(digit)}
                  disabled={unlocking}
                  className="h-[58px] w-[58px] rounded-full bg-white/25 text-[25px] font-light text-white backdrop-blur-sm active:bg-white/45 disabled:opacity-70"
                >
                  {digit}
                </button>
              ))}
              <span />
              <button
                type="button"
                onClick={() => appendDigit("0")}
                disabled={unlocking}
                className="h-[58px] w-[58px] rounded-full bg-white/25 text-[25px] font-light text-white backdrop-blur-sm active:bg-white/45 disabled:opacity-70"
              >
                0
              </button>
              <button
                type="button"
                onPointerDown={startDelete}
                onPointerUp={stopDelete}
                onPointerCancel={stopDelete}
                onPointerLeave={stopDelete}
                disabled={unlocking}
                className="h-[58px] w-[58px] rounded-full text-[14px] text-white active:bg-white/20 disabled:opacity-70"
              >
                删除
              </button>
            </div>
          </div>
        )}
      </div>

      <HomeIndicator dark />
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="24" height="30" viewBox="0 0 24 30" fill="none">
      <path
        d="M6 13V9a6 6 0 0112 0v4"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="3" y="13" width="18" height="14" rx="4" fill="white" />
    </svg>
  );
}

function WallpaperBackground({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(160deg, #1a2a4a 0%, #2c4a7a 35%, #5a3a6a 70%, #8a5a4a 100%)",
        }}
      />
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 -z-10 h-full w-full object-cover"
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
