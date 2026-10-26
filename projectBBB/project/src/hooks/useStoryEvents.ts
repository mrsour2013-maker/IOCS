import { useSyncExternalStore } from "react";

/**
 * Story event store — tracks cross-app story progression in the current
 * session only (in-memory, no persistence). Used to coordinate the
 * Pond-call-ended → Fort-notification → Fort-chat sequence.
 */

export type FortStoryPhase =
  | "idle" // Fort story not yet triggered
  | "notificationPending" // waiting for the 2s delay after Pond hang-up
  | "notificationVisible" // Fort banner is showing
  | "fortChatOpened" // player entered Fort chat
  | "conversationComplete"; // all Fort story messages sent

interface StoryEventState {
  /** true once the Pond call has been genuinely completed and hung up */
  pondCallCompleted: boolean;
  /** current Fort story phase */
  fortPhase: FortStoryPhase;
}

let storeState: StoryEventState = {
  pondCallCompleted: false,
  fortPhase: "idle",
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

function getSnapshot(): StoryEventState {
  return storeState;
}

function setStoreState(next: StoryEventState) {
  if (next === storeState) return;
  storeState = next;
  notify();
}

function mutateState(producer: (prev: StoryEventState) => StoryEventState) {
  setStoreState(producer(storeState));
}

// --- Mutations ------------------------------------------------------------

export function markPondCallCompleted(): void {
  mutateState((prev) =>
    prev.pondCallCompleted ? prev : { ...prev, pondCallCompleted: true, fortPhase: "notificationPending" },
  );
}

export function setFortPhase(phase: FortStoryPhase): void {
  mutateState((prev) => (prev.fortPhase === phase ? prev : { ...prev, fortPhase: phase }));
}

export function resetStoryEvents(): void {
  setStoreState({ pondCallCompleted: false, fortPhase: "idle" });
}

// --- Hook -----------------------------------------------------------------

export function useStoryEvents() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    pondCallCompleted: storeState.pondCallCompleted,
    fortPhase: storeState.fortPhase,
    markPondCallCompleted,
    setFortPhase,
  };
}

export function getStoryEventState(): StoryEventState {
  return storeState;
}
