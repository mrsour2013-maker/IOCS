import { useEffect, useRef, useState } from "react";
import { playKeyTap } from "@/utils/audio";

interface IOSKeyboardProps {
  /** the full text to type out */
  targetText: string;
  /** called once typing completes */
  onSend: () => void;
  /** called when the user dismisses / keyboard should close (not used for send) */
  onClose?: () => void;
}

/**
 * Simulated iOS-style keyboard that types out a fixed preset message
 * character-by-character with soft tap sounds, then signals onSend.
 * The keyboard is visual only — it does not capture real key input.
 * Layout mimics iOS 26: 3 rows of letters, bottom row with shift/space/return.
 */
export function IOSKeyboard({ targetText, onSend }: IOSKeyboardProps) {
  const [typed, setTyped] = useState("");
  const typingTimerRef = useRef<number | null>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    // typing speed: ~45ms per char, clamped so very short/long messages feel natural
    const charDelay = Math.max(35, Math.min(90, 2400 / Math.max(targetText.length, 1)));
    let i = 0;
    const tick = () => {
      if (i >= targetText.length) {
        // typing done — send after a brief beat
        if (typingTimerRef.current !== null) {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
        }
        if (!sentRef.current) {
          sentRef.current = true;
          window.setTimeout(onSend, 180);
        }
        return;
      }
      i += 1;
      setTyped(targetText.slice(0, i));
      playKeyTap();
    };
    typingTimerRef.current = window.setInterval(tick, charDelay);
    return () => {
      if (typingTimerRef.current !== null) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col bg-[#d1d5db]/95 backdrop-blur-xl">
      {/* input bar */}
      <div className="flex items-center gap-2 border-b border-black/10 bg-[#e8e8ea] px-3 py-2">
        <div className="flex-1 truncate rounded-full bg-white px-3 py-1.5 text-[15px] text-black">
          {typed}
          <span className="ml-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-black/60 align-middle" />
        </div>
      </div>
      {/* keyboard rows (decorative) */}
      <KeyboardRows />
    </div>
  );
}

const ROW1 = "qwertyuiop".split("");
const ROW2 = "asdfghjkl".split("");
const ROW3 = "zxcvbnm".split("");

function KeyboardRows() {
  return (
    <div className="flex flex-col gap-1.5 px-1.5 pb-5 pt-2">
      <div className="flex gap-1.5">
        {ROW1.map((k) => (
          <Key key={k}>{k}</Key>
        ))}
      </div>
      <div className="flex gap-1.5 pl-3">
        {ROW2.map((k) => (
          <Key key={k}>{k}</Key>
        ))}
      </div>
      <div className="flex gap-1.5">
        <SpecialKey wide>⇧</SpecialKey>
        {ROW3.map((k) => (
          <Key key={k}>{k}</Key>
        ))}
        <SpecialKey>⌫</SpecialKey>
      </div>
      <div className="flex gap-1.5">
        <SpecialKey>123</SpecialKey>
        <SpecialKey>😀</SpecialKey>
        <Key flex>空格</Key>
        <SpecialKey>换行</SpecialKey>
      </div>
    </div>
  );
}

function Key({ children, flex }: { children: React.ReactNode; flex?: boolean }) {
  return (
    <div
      className={`flex h-9 items-center justify-center rounded-[6px] bg-white text-[15px] font-medium text-black shadow-sm ${
        flex ? "flex-1" : "flex-1"
      }`}
    >
      {children}
    </div>
  );
}

function SpecialKey({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`flex h-9 items-center justify-center rounded-[6px] bg-[#adb1b8] text-[14px] font-medium text-black shadow-sm ${
        wide ? "w-[42px]" : "w-[34px]"
      }`}
    >
      {children}
    </div>
  );
}
