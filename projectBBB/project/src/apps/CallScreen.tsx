import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  POND_CALL_START,
  getCallStoryNode,
  type CallStoryNode,
} from "@/data/pondCallStory";
import {
  Mic,
  MicOff,
  Grid3x3,
  Volume2,
  Plus,
  ChevronDown,
  Phone,
  PhoneOff,
} from "lucide-react";

export type CallPhase = "dialing" | "connecting" | "connected" | "ended";

const DIAL_WAIT_MS = 5000;
const RING_INTERVAL_MS = 2200;
const RING_TONE_HZ = 440;
const TAP_TONE_HZ = 1200;
const PICKUP_TONE_HZ = 880;
const HANGUP_TONE_HZ = 350;

interface CallScreenProps {
  name: string;
  phone: string;
  avatar?: string;
  color: string;
  /** called when the user dismisses the ended screen (return to phone app) */
  onEnd: () => void;
  /** called the moment the call is genuinely hung up (story complete), before the ended screen */
  onCallEnded?: () => void;
}

/**
 * iOS-style call screen with a dialing -> connecting -> connected -> ended
 * state machine. The connected phase runs a branching visual-novel dialogue
 * driven by pondCallStory. The hang-up button is disabled until the story
 * reaches its end node. Re-invocation (parent remounts this component)
 * always starts fresh from the dialing phase.
 */
export function CallScreen({ name, phone, avatar, color, onEnd, onCallEnded }: CallScreenProps) {
  const [phase, setPhase] = useState<CallPhase>("dialing");
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [currentNodeId, setCurrentNodeId] = useState<string>(POND_CALL_START);
  const [elapsed, setElapsed] = useState(0);
  const [showEnded, setShowEnded] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringTimerRef = useRef<number | null>(null);
  const dialTimeoutRef = useRef<number | null>(null);
  const connectTimerRef = useRef<number | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const callStartRef = useRef<number>(0);
  const endedRef = useRef(false);

  const currentNode = getCallStoryNode(currentNodeId);
  // The story is complete (hang-up enabled) when we are sitting on the end node.
  const storyComplete = currentNode?.type === "end";

  // --- Audio helpers (Web Audio API, no external files) --------------------

  const ensureAudio = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      audioCtxRef.current = new Ctor();
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }, []);

  const playTone = useCallback(
    (freq: number, durationMs: number, volume = 0.08) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain).connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
      osc.start(now);
      osc.stop(now + durationMs / 1000);
    },
    [ensureAudio],
  );

  const startRingback = useCallback(() => {
    if (ringTimerRef.current !== null) clearInterval(ringTimerRef.current);
    const tick = () => playTone(RING_TONE_HZ, 900, 0.07);
    tick();
    ringTimerRef.current = window.setInterval(tick, RING_INTERVAL_MS);
  }, [playTone]);

  const stopRingback = useCallback(() => {
    if (ringTimerRef.current !== null) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  const playTap = useCallback(() => {
    playTone(TAP_TONE_HZ, 40, 0.04);
  }, [playTone]);

  // --- Haptics -------------------------------------------------------------

  const haptic = useCallback((pattern: number | number[]) => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // unsupported
    }
  }, []);

  // --- Cleanup -------------------------------------------------------------

  const clearAllTimers = useCallback(() => {
    stopRingback();
    if (dialTimeoutRef.current !== null) {
      clearTimeout(dialTimeoutRef.current);
      dialTimeoutRef.current = null;
    }
    if (connectTimerRef.current !== null) {
      clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
    if (callTimerRef.current !== null) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (pauseTimerRef.current !== null) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, [stopRingback]);

  const cleanup = useCallback(() => {
    clearAllTimers();
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== "closed") ctx.close().catch(() => {});
    audioCtxRef.current = null;
  }, [clearAllTimers]);

  // --- Dialing -> connecting -> connected ---------------------------------

  const beginConnect = useCallback(() => {
    if (endedRef.current) return;
    setPhase("connecting");
    stopRingback();
    connectTimerRef.current = window.setTimeout(() => {
      if (endedRef.current) return;
      haptic([12, 40, 12]);
      playTone(PICKUP_TONE_HZ, 120, 0.05);
      setPhase("connected");
      callStartRef.current = Date.now();
      setElapsed(0);
      callTimerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - callStartRef.current) / 1000));
      }, 1000);
    }, 800);
  }, [haptic, playTone, stopRingback]);

  // Start dialing on mount.
  useEffect(() => {
    endedRef.current = false;
    ensureAudio();
    startRingback();
    dialTimeoutRef.current = window.setTimeout(() => {
      beginConnect();
    }, DIAL_WAIT_MS);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Advance story node --------------------------------------------------

  const goToNode = useCallback(
    (id: string) => {
      const node = getCallStoryNode(id);
      if (!node) return;
      setCurrentNodeId(id);
      if (node.type === "pause" && node.pauseMs) {
        // auto-advance after the pause duration; no tap needed
        if (pauseTimerRef.current !== null) clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = window.setTimeout(() => {
          if (endedRef.current) return;
          if (node.next) goToNode(node.next);
        }, node.pauseMs);
      }
    },
    [],
  );

  const advance = useCallback(() => {
    if (phase !== "connected") return;
    const node = currentNode;
    if (!node) return;
    // choice nodes are advanced by tapping a choice button, not the screen
    if (node.type === "choice") return;
    // pauses auto-advance; ignore screen taps during a pause
    if (node.type === "pause") return;
    if (node.type === "end") return;
    playTap();
    haptic(8);
    if (!node.next) return;
    goToNode(node.next);
  }, [phase, currentNode, playTap, haptic, goToNode]);

  const choose = useCallback(
    (nextId: string) => {
      if (phase !== "connected") return;
      playTap();
      haptic(10);
      goToNode(nextId);
    },
    [phase, playTap, haptic, goToNode],
  );

  // --- Hang up (only allowed once story is complete) -----------------------

  const hangUp = useCallback(() => {
    if (endedRef.current) return;
    if (!storyComplete) return;
    endedRef.current = true;
    // play a short hang-up tone, then clean up
    playTone(HANGUP_TONE_HZ, 220, 0.09);
    // brief delay so the hang-up tone is audible before tearing down audio
    window.setTimeout(() => {
      cleanup();
      setPhase("ended");
      setShowEnded(true);
      onCallEnded?.();
    }, 260);
  }, [storyComplete, playTone, cleanup, onCallEnded]);

  // --- Render --------------------------------------------------------------

  const statusText = useMemo(() => {
    switch (phase) {
      case "dialing":
        return "正在呼叫…";
      case "connecting":
        return "正在接通…";
      case "connected":
        return "通话中";
      case "ended":
        return "通话结束";
    }
  }, [phase]);

  const timerLabel = useMemo(() => {
    if (phase !== "connected") return "";
    const m = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const s = (elapsed % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [phase, elapsed]);

  if (showEnded) {
    return <EndedScreen name={name} onDone={onEnd} />;
  }

  const bgGradient =
    phase === "connected"
      ? "from-[#1c2b3a] via-[#101822] to-[#05080c]"
      : "from-[#0f1b2e] via-[#0a1320] to-[#05080c]";

  const isPause = currentNode?.type === "pause";

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col bg-gradient-to-b ${bgGradient} text-white`}
      onClick={
        phase === "connected" && !isPause && currentNode?.type !== "choice"
          ? advance
          : phase !== "connected"
            ? ensureAudio
            : undefined
      }
    >
      {/* header status */}
      <div className="flex flex-col items-center pt-14">
        <div className="text-[15px] font-medium text-white/70">{statusText}</div>
        {timerLabel && (
          <div className="text-[13px] text-white/50">{timerLabel}</div>
        )}
      </div>

      {/* avatar + name */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div
          className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full text-white shadow-2xl"
          style={{ background: color, fontSize: 44 }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            name.slice(0, 1)
          )}
        </div>
        <div className="mt-5 text-[28px] font-semibold">{name}</div>

        {phase !== "connected" ? (
          <div className="mt-2 text-[15px] text-white/60">{phone}</div>
        ) : (
          <DialogueArea
            node={currentNode}
            storyComplete={storyComplete}
            onChoose={choose}
          />
        )}
      </div>

      {/* controls */}
      {phase === "connected" ? (
        <ConnectedControls
          muted={muted}
          speaker={speaker}
          onToggleMute={() => {
            setMuted((m) => !m);
            haptic(6);
          }}
          onToggleSpeaker={() => {
            setSpeaker((s) => !s);
            haptic(6);
          }}
        />
      ) : (
        <DialingControls />
      )}

      {/* hang up — disabled until storyComplete */}
      <div className="flex justify-center pb-12 pt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (storyComplete) hangUp();
          }}
          disabled={!storyComplete}
          aria-label="挂断"
          className={`flex h-16 w-16 items-center justify-center rounded-full bg-[#ff3b30] transition-opacity ${
            storyComplete
              ? "active:scale-95 active:bg-[#cc2f26]"
              : "cursor-not-allowed opacity-40"
          }`}
        >
          <PhoneOff size={30} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// --- Dialogue / choice / pause area ---------------------------------------

function DialogueArea({
  node,
  storyComplete,
  onChoose,
}: {
  node: CallStoryNode | undefined;
  storyComplete: boolean;
  onChoose: (nextId: string) => void;
}) {
  if (!node) return null;

  if (node.type === "choice") {
    return (
      <div className="mt-7 flex w-full max-w-[320px] flex-col gap-3">
        {node.choices?.map((choice, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onChoose(choice.next);
            }}
            className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-center text-[15px] leading-snug text-white backdrop-blur-md transition-colors active:scale-[0.98] active:bg-white/20"
          >
            {choice.label}
          </button>
        ))}
      </div>
    );
  }

  if (node.type === "pause") {
    // blank pause: show nothing but keep the area stable
    return <div className="mt-7 min-h-[60px] w-full max-w-[320px]" />;
  }

  if (node.type === "end") {
    return (
      <div className="mt-7 flex w-full max-w-[320px] flex-col items-center">
        <div className="min-h-[60px] text-center text-[17px] leading-relaxed text-white/55">
          通话即将结束…
        </div>
        <div className="mt-4 text-[12px] text-white/40">可以挂断电话了</div>
      </div>
    );
  }

  const isNarration = node.speaker === "narration";
  const speakerLabel =
    node.speaker === "me" ? "我" : node.speaker === "narration" ? "" : node.speaker;

  return (
    <div className="mt-7 flex w-full max-w-[320px] flex-col items-center">
      {!isNarration && (
        <div className="mb-2 text-[13px] font-medium uppercase tracking-wide text-white/50">
          {speakerLabel}
        </div>
      )}
      <div
        className={`min-h-[60px] text-center text-[17px] leading-relaxed ${
          isNarration ? "text-white/55 italic" : "text-white"
        }`}
      >
        {node.text}
      </div>
      {storyComplete ? (
        <div className="mt-4 text-[12px] text-white/40">可以挂断电话了</div>
      ) : (
        <ChevronDown size={20} className="mt-4 animate-bounce text-white/40" />
      )}
    </div>
  );
}

// --- Dialing controls (decorative iOS layout) -----------------------------

function DialingControls() {
  return (
    <div className="flex justify-center pb-2">
      <div className="grid grid-cols-3 gap-x-8 gap-y-5">
        <CallPad icon={<MicOff size={24} />} label="静音" />
        <CallPad icon={<Grid3x3 size={24} />} label="键盘" />
        <CallPad icon={<Volume2 size={24} />} label="扬声器" />
        <CallPad icon={<Plus size={24} />} label="添加通话" />
        <CallPad icon={<Phone size={24} />} label="FaceTime" />
        <CallPad icon={<ContactIcon />} label="联系人" />
      </div>
    </div>
  );
}

function ConnectedControls({
  muted,
  speaker,
  onToggleMute,
  onToggleSpeaker,
}: {
  muted: boolean;
  speaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}) {
  return (
    <div className="flex justify-center pb-2">
      <div className="grid grid-cols-3 gap-x-8 gap-y-5">
        <CallPad
          icon={muted ? <MicOff size={24} /> : <Mic size={24} />}
          label="静音"
          active={muted}
          onClick={onToggleMute}
        />
        <CallPad icon={<Grid3x3 size={24} />} label="键盘" />
        <CallPad
          icon={<Volume2 size={24} />}
          label="扬声器"
          active={speaker}
          onClick={onToggleSpeaker}
        />
        <CallPad icon={<Plus size={24} />} label="添加通话" />
        <CallPad icon={<Phone size={24} />} label="FaceTime" />
        <CallPad icon={<ContactIcon />} label="联系人" />
      </div>
    </div>
  );
}

function CallPad({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="flex flex-col items-center gap-1 active:opacity-70"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-md ${
          active ? "bg-white text-[#0a1320]" : "bg-white/15 text-white"
        }`}
      >
        {icon}
      </div>
      <span className="text-[11px] text-white/70">{label}</span>
    </button>
  );
}

function ContactIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 16c0-2 2-3 4-3s4 1 4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// --- Ended screen ---------------------------------------------------------

function EndedScreen({ name, onDone }: { name: string; onDone: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
      <div className="text-[15px] text-white/60">通话结束</div>
      <div className="mt-2 text-[22px] font-semibold">{name}</div>
      <button
        onClick={onDone}
        className="mt-10 rounded-full bg-white/15 px-6 py-2.5 text-[15px] active:scale-95"
      >
        返回电话
      </button>
    </div>
  );
}
