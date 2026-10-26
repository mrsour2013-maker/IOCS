import { useEffect, useRef, useState } from "react";
import type { AppId } from "@/types";
import { LockScreen } from "@/components/phone/LockScreen";
import { HomeScreen } from "@/components/phone/HomeScreen";
import { AppHost } from "@/components/phone/AppHost";
import { NotificationBanner } from "@/components/phone/NotificationBanner";
import { useProgress } from "@/hooks/useProgress";
import { useStoryEvents, markPondCallCompleted, setFortPhase } from "@/hooks/useStoryEvents";
import { appendChatMessage } from "@/hooks/useChatStore";
import { fortNotificationMessage } from "@/data/fortStory";
import { storyData } from "@/data";

type Screen = "lock" | "home" | "app";

const NOTIFICATION_DELAY_MS = 2000;

export default function App() {
  const progress = useProgress();
  useStoryEvents();
  const [screen, setScreen] = useState<Screen>("lock");
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [showFortNotification, setShowFortNotification] = useState(false);
  const [initialLineChatId, setInitialLineChatId] = useState<string | null>(null);

  const notificationTimerRef = useRef<number | null>(null);
  // ensure we only insert the Fort notification message once per session
  const fortMessageInsertedRef = useRef(false);

  const handleUnlock = () => {
    progress.setUnlocked(true);
    setScreen("home");
  };

  const openApp = (id: AppId) => {
    setActiveApp(id);
    setScreen("app");
  };

  const goHome = () => {
    setActiveApp(null);
    setScreen("home");
  };

  // --- Pond call ended → Fort notification flow ----------------------------

  const handlePondCallEnded = () => {
    // mark the story event and insert the Fort notification message once
    markPondCallCompleted();
    if (!fortMessageInsertedRef.current) {
      fortMessageInsertedRef.current = true;
      appendChatMessage("chat_fort", fortNotificationMessage);
    }
    // leave the call screen and return home
    setActiveApp(null);
    setScreen("home");
    // start the 2s timer for the notification banner
    if (notificationTimerRef.current !== null) clearTimeout(notificationTimerRef.current);
    notificationTimerRef.current = window.setTimeout(() => {
      setFortPhase("notificationVisible");
      setShowFortNotification(true);
    }, NOTIFICATION_DELAY_MS);
  };

  // cleanup the notification timer on unmount
  useEffect(() => {
    return () => {
      if (notificationTimerRef.current !== null) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
    };
  }, []);

  // --- Notification banner handlers ----------------------------------------

  const fortContact = storyData.contacts.find((c) => c.id === "fort");
  const fortChat = storyData.chats.find((c) => c.id === "chat_fort");

  const openFortChat = () => {
    setShowFortNotification(false);
    setFortPhase("fortChatOpened");
    setInitialLineChatId("chat_fort");
    setActiveApp("line");
    setScreen("app");
  };

  const dismissFortNotification = () => {
    setShowFortNotification(false);
    // stays on home screen; Fort message remains unread
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#0a0a0c] sm:p-6">
      <PhoneFrame>
        {screen === "lock" && <LockScreen onUnlock={handleUnlock} />}
        {screen === "home" && <HomeScreen onOpenApp={openApp} />}
        {screen === "app" && activeApp && (
          <AppHost
            appId={activeApp}
            onHome={goHome}
            onPondCallEnded={handlePondCallEnded}
            initialLineChatId={initialLineChatId}
            onInitialLineChatConsumed={() => setInitialLineChatId(null)}
          />
        )}

        {showFortNotification && (
          <NotificationBanner
            name={fortChat?.title ?? "Fort"}
            avatar={fortChat?.avatar}
            color={fortChat?.color ?? "#10b981"}
            message={fortNotificationMessage.text ?? ""}
            onTap={openFortChat}
            onDismiss={dismissFortNotification}
          />
        )}
      </PhoneFrame>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        relative overflow-hidden bg-black
        h-[100dvh] w-full
        sm:h-[844px] sm:w-[390px] sm:rounded-[55px] sm:border-[10px] sm:border-black
        sm:shadow-[0_0_0_2px_#2a2a2a,0_30px_60px_-15px_rgba(0,0,0,0.7)]
      "
    >
      {children}
    </div>
  );
}
