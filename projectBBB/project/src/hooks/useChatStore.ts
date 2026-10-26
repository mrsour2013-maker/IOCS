import { useSyncExternalStore } from "react";
import { storyData } from "@/data";
import type { Chat, Message } from "@/types";

/**
 * Runtime chat store.
 *
 * The static story lives in src/data/*.json (imported as storyData). This
 * store overlays dynamic, in-session messages on top of those chats so the
 * LINE app can show story-driven new messages without mutating the source
 * JSON. State is in-memory only — a full page refresh restores the initial
 * data. No localStorage / sessionStorage.
 */

interface ChatStoreState {
  /** chatId -> dynamic messages appended after the static ones */
  dynamicMessages: Record<string, Message[]>;
  /** chatIds that have been opened in this session (for read tracking) */
  openedChats: string[];
}

let storeState: ChatStoreState = {
  dynamicMessages: {},
  openedChats: [],
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ChatStoreState {
  return storeState;
}

function setStoreState(next: ChatStoreState) {
  if (next === storeState) return;
  storeState = next;
  notify();
}

function mutateState(producer: (prev: ChatStoreState) => ChatStoreState) {
  setStoreState(producer(storeState));
}

// --- Mutations ------------------------------------------------------------

/** Append a message to a chat. No-op if a message with the same id exists. */
export function appendChatMessage(chatId: string, message: Message): void {
  mutateState((prev) => {
    const existing = prev.dynamicMessages[chatId] ?? [];
    if (existing.some((m) => m.id === message.id)) return prev;
    return {
      ...prev,
      dynamicMessages: {
        ...prev.dynamicMessages,
        [chatId]: [...existing, message],
      },
    };
  });
}

/** Mark a chat as opened (read) in this session. */
export function markChatOpened(chatId: string): void {
  mutateState((prev) => {
    if (prev.openedChats.includes(chatId)) return prev;
    return { ...prev, openedChats: [...prev.openedChats, chatId] };
  });
}

export function resetChatStore(): void {
  setStoreState({ dynamicMessages: {}, openedChats: [] });
}

// --- Selectors ------------------------------------------------------------

/** Return all chats with dynamic messages merged in, sorted newest-first by last message time. */
export function getChatsWithDynamic(): Chat[] {
  return storyData.chats.map((chat) => {
    const dynamic = storeState.dynamicMessages[chat.id] ?? [];
    if (!dynamic.length) return chat;
    return { ...chat, messages: [...chat.messages, ...dynamic] };
  });
}

/** Return a single chat with dynamic messages merged in, or undefined. */
export function getChatWithDynamic(chatId: string): Chat | undefined {
  const chat = storyData.chats.find((c) => c.id === chatId);
  if (!chat) return undefined;
  const dynamic = storeState.dynamicMessages[chatId] ?? [];
  if (!dynamic.length) return chat;
  return { ...chat, messages: [...chat.messages, ...dynamic] };
}

/** Count unread dynamic (non-me) messages in a chat that has not been opened. */
export function getDynamicUnread(chatId: string): number {
  if (storeState.openedChats.includes(chatId)) return 0;
  const dynamic = storeState.dynamicMessages[chatId] ?? [];
  return dynamic.filter((m) => m.from !== "me").length;
}

/** Whether a chat has been opened (read) in this session. */
export function isChatOpened(chatId: string): boolean {
  return storeState.openedChats.includes(chatId);
}

// --- Hook -----------------------------------------------------------------

export function useChatStore() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    getChatsWithDynamic,
    getChatWithDynamic,
    getDynamicUnread,
    isChatOpened,
    appendChatMessage,
    markChatOpened,
  };
}
