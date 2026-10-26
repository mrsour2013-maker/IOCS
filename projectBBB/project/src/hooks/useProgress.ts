import { useCallback, useSyncExternalStore } from "react";
import { storyData } from "@/data";
import type { AppId, Ending } from "@/types";

export interface GameState {
  flags: string[];
  read: string[];
  appRead: Partial<Record<AppId, string[]>>;
  triggers: Record<string, boolean>;
}

interface StoreState extends GameState {
  unlocked: boolean;
}

export const initialGameState: GameState = {
  flags: [],
  read: [],
  appRead: {},
  triggers: {},
};

export function resetGameState(): GameState {
  return { flags: [], read: [], appRead: {}, triggers: {} };
}

function appItemIds(appId: AppId, itemId?: string): string[] {
  if (appId === "line") {
    const chats = itemId ? storyData.chats.filter((item) => item.id === itemId) : storyData.chats;
    return chats.flatMap((chat) =>
      chat.messages.filter((message) => message.from !== "me").map((message) => message.id),
    );
  }
  if (appId === "messages") {
    const threads = itemId ? storyData.sms.filter((item) => item.id === itemId) : storyData.sms;
    return threads.flatMap((thread) =>
      thread.messages.filter((message) => message.from !== "me").map((message) => message.id),
    );
  }
  if (appId === "x") return storyData.xPosts.map((item) => item.id);
  if (appId === "phone") {
    if (itemId) {
      const call = storyData.phoneCalls.find((item) => item.id === itemId);
      return call?.type === "missed" ? [itemId] : [];
    }
    return storyData.phoneCalls.filter((item) => item.type === "missed").map((item) => item.id);
  }
  return [];
}

// --- Singleton in-memory store (no cross-refresh persistence) -------------

let storeState: StoreState = {
  ...resetGameState(),
  unlocked: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function setStoreState(next: StoreState) {
  if (next === storeState) return;
  storeState = next;
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): StoreState {
  return storeState;
}

// --- Mutations (module-level, shared by all hook instances) ---------------

function mutateState(producer: (prev: StoreState) => StoreState) {
  setStoreState(producer(storeState));
}

function addFlags(flags: string[], base: StoreState): StoreState {
  if (!flags.length) return base;
  const merged = [...base.flags];
  for (const f of flags) if (!merged.includes(f)) merged.push(f);
  if (merged.length === base.flags.length) return base;
  return { ...base, flags: merged };
}

export function useProgress() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const unlock = useCallback((flags: string | string[]) => {
    const list = Array.isArray(flags) ? flags : [flags];
    mutateState((prev) => addFlags(list, prev));
  }, []);

  const markRead = useCallback((id: string, flags?: string[]) => {
    mutateState((prev) => {
      let next = prev;
      if (!prev.read.includes(id)) next = { ...prev, read: [...prev.read, id] };
      if (flags) next = addFlags(flags, next);
      return next;
    });
  }, []);

  const setUnlocked = useCallback((value: boolean) => {
    mutateState((prev) => (prev.unlocked === value ? prev : { ...prev, unlocked: value }));
  }, []);

  const markItemsRead = useCallback((appId: AppId, itemIds: string[], flags?: string[]) => {
    mutateState((prev) => {
      const current = prev.appRead[appId] ?? [];
      const nextIds = itemIds.filter((id) => !current.includes(id));
      if (!nextIds.length && !flags) return prev;
      const appRead = nextIds.length
        ? { ...prev.appRead, [appId]: [...current, ...nextIds] }
        : prev.appRead;
      let next: StoreState = nextIds.length ? { ...prev, appRead } : prev;
      if (flags) next = addFlags(flags, next);
      return next;
    });
  }, []);

  const markItemRead = useCallback(
    (appId: AppId, itemId: string, flags?: string[]) => {
      markItemsRead(appId, appItemIds(appId, itemId), flags);
    },
    [markItemsRead],
  );

  const unreadCount = useCallback(
    (appId: AppId, itemId?: string) => {
      const read = state.appRead[appId] ?? [];
      if (appId === "line" && !itemId) {
        return storyData.chats.reduce((total, chat) => {
          const itemIds = appItemIds("line", chat.id);
          if (itemIds.every((id) => read.includes(id)) || chat.muted) return total;
          const unread =
            chat.initialUnreadCount ?? itemIds.filter((id) => !read.includes(id)).length;
          return total + unread;
        }, 0);
      }

      const itemIds = appItemIds(appId, itemId);
      if (appId === "line" && itemId) {
        const chat = storyData.chats.find((item) => item.id === itemId);
        if (chat?.initialUnreadCount !== undefined && !itemIds.every((id) => read.includes(id))) {
          return chat.initialUnreadCount;
        }
      }
      return itemIds.filter((id) => !read.includes(id)).length;
    },
    [state.appRead],
  );

  const reset = useCallback(() => {
    setStoreState({ ...resetGameState(), unlocked: false });
  }, []);

  const hasFlag = useCallback((flag: string) => state.flags.includes(flag), [state.flags]);

  const currentEnding: Ending | null = (() => {
    for (const e of storyData.endings) {
      if (e.requires.every((r) => state.flags.includes(r))) return e;
    }
    return null;
  })();

  const onMessageRead = useCallback(
    (appId: AppId, itemId: string, flags?: string[]) => {
      markItemRead(appId, itemId, flags);
    },
    [markItemRead],
  );

  const onClueClick = useCallback((clueId: string, flags?: string[]) => {
    mutateState((prev) => {
      if (prev.triggers[clueId] && !flags) return prev;
      const triggers = prev.triggers[clueId] ? prev.triggers : { ...prev.triggers, [clueId]: true };
      let next: StoreState = triggers === prev.triggers ? prev : { ...prev, triggers };
      if (flags) next = addFlags(flags, next);
      return next;
    });
  }, []);

  const onStoryTransition = useCallback((transitionId: string, flags?: string[]) => {
    mutateState((prev) => {
      if (prev.triggers[transitionId] && !flags) return prev;
      const triggers = prev.triggers[transitionId]
        ? prev.triggers
        : { ...prev.triggers, [transitionId]: true };
      let next: StoreState = triggers === prev.triggers ? prev : { ...prev, triggers };
      if (flags) next = addFlags(flags, next);
      return next;
    });
  }, []);

  return {
    state,
    unlocked: state.unlocked,
    unlock,
    markRead,
    setUnlocked,
    markItemsRead,
    markItemRead,
    unreadCount,
    reset,
    hasFlag,
    currentEnding,
    onMessageRead,
    onClueClick,
    onStoryTransition,
    subscribe,
  };
}
