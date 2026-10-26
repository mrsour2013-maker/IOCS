export type CallStorySpeaker = "Pond" | "me" | "narration";
export type CallStoryNodeType = "dialogue" | "pause" | "choice" | "end";

export interface CallStoryChoice {
  /** choice label displayed on the button */
  label: string;
  /** id of the node this choice leads to */
  next: string;
}

export interface CallStoryNode {
  id: string;
  speaker?: CallStorySpeaker;
  text?: string;
  type: CallStoryNodeType;
  /** next node id for linear nodes; null/undefined at an end node */
  next?: string | null;
  /** pause duration in ms (only for type === "pause") */
  pauseMs?: number;
  /** choices (only for type === "choice") */
  choices?: CallStoryChoice[];
}

/** Entry node id for the Pond call story. */
export const POND_CALL_START = "start";

/**
 * Pond call-back story graph.
 *
 * Flow: start (Pond: 喂…) → choice
 *   A → a_stranger1 (skips monologue, goes straight into stranger dialogue)
 *   B → b_mono1 → …monologue with pauses… → b_to_stranger (me: 呃…不好意思？)
 * Both merge into stranger1 and run the shared stranger dialogue → end.
 *
 * Replace text here to change story content without touching the UI.
 */
export const pondCallStory: CallStoryNode[] = [
  // --- shared opening ---
  {
    id: "start",
    speaker: "Pond",
    text: "喂…",
    type: "dialogue",
    next: "choice",
  },
  {
    id: "choice",
    type: "choice",
    choices: [
      {
        label: "如实说出这是你捡到的手机，并不知道失主在哪",
        next: "a_stranger1",
      },
      {
        label: "沉默，等 Pond 开口",
        next: "b_mono1",
      },
    ],
  },

  // --- Branch A: straight into stranger dialogue ( Pond: ？你是谁？phuwin呢？ ) ---
  {
    id: "a_stranger1",
    speaker: "Pond",
    text: "？你是谁？phuwin呢？",
    type: "dialogue",
    next: "stranger2",
  },

  // --- Branch B: Pond monologue with pauses ---
  {
    id: "b_mono1",
    speaker: "Pond",
    text: "phu…好想你……",
    type: "dialogue",
    next: "b_pause1",
  },
  {
    id: "b_pause1",
    type: "pause",
    pauseMs: 1000,
    next: "b_mono2",
  },
  {
    id: "b_mono2",
    speaker: "Pond",
    text: "……为什么不说话",
    type: "dialogue",
    next: "b_mono3",
  },
  {
    id: "b_mono3",
    speaker: "Pond",
    text: "是我吵到你上课了吗？",
    type: "dialogue",
    next: "b_pause2",
  },
  {
    id: "b_pause2",
    type: "pause",
    pauseMs: 2000,
    next: "b_mono4",
  },
  {
    id: "b_mono4",
    speaker: "Pond",
    text: "你是不是今天有早课？",
    type: "dialogue",
    next: "b_mono5",
  },
  {
    id: "b_mono5",
    speaker: "Pond",
    text: "对不起对不起…！我，我昨晚上喝多一下忘记了",
    type: "dialogue",
    next: "b_mono6",
  },
  {
    id: "b_mono6",
    speaker: "Pond",
    text: "那你先继续上课吧",
    type: "dialogue",
    next: "b_mono7",
  },
  {
    id: "b_mono7",
    speaker: "Pond",
    text: "我没什么事，等你下课再说",
    type: "dialogue",
    next: "b_to_stranger",
  },
  // B branch transitions into stranger dialogue starting with me: 呃…不好意思？
  {
    id: "b_to_stranger",
    speaker: "me",
    text: "呃…不好意思？",
    type: "dialogue",
    next: "stranger1_pond",
  },

  // --- Shared stranger dialogue ---
  {
    id: "stranger1_pond",
    speaker: "Pond",
    text: "？你是谁？phuwin呢？",
    type: "dialogue",
    next: "stranger2",
  },
  {
    id: "stranger2",
    speaker: "me",
    text: "虽然不知道你说的phuwin是谁，但大概是我这台手机的主人？",
    type: "dialogue",
    next: "stranger3",
  },
  {
    id: "stranger3",
    speaker: "me",
    text: "我在学校门口的咖啡店捡到了这台手机，请问你和失主的关系是…？",
    type: "dialogue",
    next: "stranger4",
  },
  {
    id: "stranger4",
    speaker: "Pond",
    text: "……暂时是朋友",
    type: "dialogue",
    next: "stranger5",
  },
  {
    id: "stranger5",
    speaker: "me",
    text: "哦哦好的，那请问你可以联系到他吗？",
    type: "dialogue",
    next: "stranger6",
  },
  {
    id: "stranger6",
    speaker: "me",
    text: "我今天应该都会在咖啡店，你可以让他直接来找我",
    type: "dialogue",
    next: "stranger7",
  },
  {
    id: "stranger7",
    speaker: "Pond",
    text: "……我一会儿联系我们的朋友去通知他",
    type: "dialogue",
    next: "stranger8",
  },
  {
    id: "stranger8",
    speaker: "Pond",
    text: "麻烦你了",
    type: "dialogue",
    next: "stranger9",
  },
  {
    id: "stranger9",
    speaker: "me",
    text: "不客气的",
    type: "dialogue",
    next: "end",
  },
  {
    id: "end",
    type: "end",
    next: null,
  },
];

const nodeMap = new Map(pondCallStory.map((n) => [n.id, n]));

export function getCallStoryNode(id: string): CallStoryNode | undefined {
  return nodeMap.get(id);
}
