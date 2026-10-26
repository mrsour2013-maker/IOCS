import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  large?: boolean;
}

/** iOS-style navigation bar. When `large` is set the title drops below the bar. */
export function AppHeader({ title, onBack, right, large = false }: AppHeaderProps) {
  return (
    <div className="relative border-b border-gray-100 bg-white/90 backdrop-blur-xl">
      <div className="relative flex h-[44px] items-center justify-between px-3">
        <div className="flex w-[80px] items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center text-[16px] font-normal text-[#007aff] active:opacity-60"
            >
              <ChevronLeft size={22} strokeWidth={2} />
              <span className="-ml-1">返回</span>
            </button>
          )}
        </div>
        {!large && (
          <div className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-black">
            {title}
          </div>
        )}
        <div className="flex w-[80px] justify-end">{right}</div>
      </div>
      {large && (
        <div className="px-4 pb-2 text-[30px] font-bold tracking-tight text-black">
          {title}
        </div>
      )}
    </div>
  );
}
