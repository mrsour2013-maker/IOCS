import { useState, useCallback } from "react";
import type { AppId } from "@/types";
import { storyData } from "@/data";
import { StatusBar } from "./StatusBar";
import { DynamicIsland } from "./DynamicIsland";
import { HomeIndicator } from "./HomeIndicator";
import { LineApp } from "@/apps/LineApp";
import { XApp } from "@/apps/XApp";
import { PhoneApp } from "@/apps/PhoneApp";
import { MailApp } from "@/apps/MessagesApp";
import { BrowserApp } from "@/apps/BrowserApp";
import { useProgress } from "@/hooks/useProgress";
import { resetChatStore } from "@/hooks/useChatStore";
import { resetStoryEvents } from "@/hooks/useStoryEvents";

interface AppHostProps {
  appId: AppId;
  onHome: () => void;
  /** called when the Pond call is genuinely hung up (story complete) */
  onPondCallEnded?: () => void;
  /** when set, LINE opens directly into this chat (notification jump) */
  initialLineChatId?: string | null;
  /** called after LINE consumes the initial chat id */
  onInitialLineChatConsumed?: () => void;
}

export function AppHost({
  appId,
  onHome,
  onPondCallEnded,
  initialLineChatId,
  onInitialLineChatConsumed,
}: AppHostProps) {
  const progress = useProgress();
  const [showReset, setShowReset] = useState(false);
  const app = storyData.apps.find((a) => a.id === appId)!;

  const handleReset = useCallback(() => {
    progress.reset();
    resetChatStore();
    resetStoryEvents();
    progress.setUnlocked(false);
    setShowReset(false);
    onHome();
  }, [progress, onHome]);

  const renderApp = () => {
    switch (appId) {
      case "line":
        return (
          <LineApp
            initialChatId={initialLineChatId}
            onInitialChatConsumed={onInitialLineChatConsumed}
          />
        );
      case "x":
        return <XApp />;
      case "phone":
        return <PhoneApp onPondCallEnded={onPondCallEnded} />;
      case "messages":
        return <MailApp />;
      case "browser":
        return <BrowserApp />;
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <DynamicIsland />
      <StatusBar />
      <div className="relative flex-1 overflow-hidden">{renderApp()}</div>

      {/* footer bar with reset — sits above the home indicator */}
      <div className="relative z-20 flex h-[34px] shrink-0 items-center justify-end px-4">
        <button
          onClick={() => setShowReset(true)}
          className="text-[11px] font-medium text-gray-400 active:text-gray-600"
        >
          重新开始
        </button>
      </div>
      <HomeIndicator onHome={onHome} />

      {showReset && (
        <ResetConfirm
          onCancel={() => setShowReset(false)}
          onConfirm={handleReset}
        />
      )}
    </div>
  );
}

function ResetConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[270px] overflow-hidden rounded-2xl bg-[#f9f9f9] shadow-xl">
        <div className="px-4 py-5 text-center">
          <div className="text-[17px] font-semibold text-black">重新开始？</div>
          <div className="mt-1 text-[13px] leading-snug text-gray-500">
            所有阅读进度和解锁记录都将被清除。
          </div>
        </div>
        <div className="flex border-t border-gray-200">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-[16px] font-normal text-[#007aff] active:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 border-l border-gray-200 py-2.5 text-[16px] font-semibold text-[#ff3b30] active:bg-gray-100"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
}
