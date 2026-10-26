import { useClock, formatTime } from "@/hooks/useClock";
import { SignalIcon, WifiIcon, BatteryIcon } from "./StatusIcons";

interface StatusBarProps {
  dark?: boolean;
}

export function StatusBar({ dark = false }: StatusBarProps) {
  const now = useClock();
  const color = dark ? "#ffffff" : "#000000";

  return (
    <div
      className="relative z-20 flex h-12 items-center justify-between px-7 pt-1 select-none"
      style={{ color }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[15px] font-semibold tracking-tight tabular-nums">
          {formatTime(now)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <SignalIcon color={color} />
        <WifiIcon color={color} />
        <BatteryIcon color={color} />
      </div>
    </div>
  );
}
