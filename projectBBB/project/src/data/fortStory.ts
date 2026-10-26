import type { Message } from "@/types";

/**
 * Fort post-Pond-call story script.
 *
 * The first message ("你好？") is delivered via the top banner notification
 * and is inserted into the chat before the player opens it. The remaining
 * messages play out inside the Fort chat with typing indicators and a
 * simulated iOS keyboard for "me" replies.
 *
 * Story time is fixed at 10:11 (2026-10-25T10:11:00) regardless of the real
 * device clock. Replace text here to change story content without touching
 * the UI.
 */

const FORT_STORY_TIME = "2026-10-25T10:11:00";

export type FortStorySender = "fort" | "me";

export interface FortStoryBeat {
  /** unique message id used when inserting into the chat */
  messageId: string;
  sender: FortStorySender;
  text: string;
}

/**
 * The notification message — delivered via the banner, inserted into the
 * chat list as an unread message before the player opens Fort's chat.
 */
export const fortNotificationMessage: Message = {
  id: "fort_story_001",
  time: FORT_STORY_TIME,
  displayTime: "10:11",
  from: "fort",
  type: "text",
  text: "你好？",
};

/**
 * The full ordered list of story beats. The first beat (fort_story_001) is
 * the notification message; it is inserted up-front and NOT replayed inside
 * the chat. The remaining beats run sequentially inside the Fort chat.
 */
export const fortStoryBeats: FortStoryBeat[] = [
  {
    messageId: "fort_story_001",
    sender: "fort",
    text: "你好？",
  },
  {
    messageId: "fort_story_002",
    sender: "fort",
    text: "请问你是在西门门口的那家咖啡店捡到的这台手机吗？",
  },
  {
    messageId: "fort_story_003",
    sender: "me",
    text: "是的",
  },
  {
    messageId: "fort_story_004",
    sender: "fort",
    text: "不对，你怎么能回line",
  },
  {
    messageId: "fort_story_005",
    sender: "fort",
    text: "你解锁了？",
  },
  {
    messageId: "fort_story_006",
    sender: "me",
    text: "呃……",
  },
  {
    messageId: "fort_story_007",
    sender: "me",
    text: "我正好和机主一天生日，看着密码提示顺手一输入没想到真打开了",
  },
  {
    messageId: "fort_story_008",
    sender: "fort",
    text: "……也太有缘了",
  },
  {
    messageId: "fort_story_009",
    sender: "me",
    text: "哈哈…那你们大概什么时候来取手机呢？",
  },
  {
    messageId: "fort_story_010",
    sender: "fort",
    text: "等我们下课可以吗？大概下午一点左右",
  },
  {
    messageId: "fort_story_011",
    sender: "me",
    text: "OK的",
  },
  {
    messageId: "fort_story_012",
    sender: "fort",
    text: "感谢感谢🥹🙏",
  },
  {
    messageId: "fort_story_013",
    sender: "fort",
    text: "好人一生平安！",
  },
  {
    messageId: "fort_story_014",
    sender: "me",
    text: "🥰",
  },
];

/** Build a Message from a beat, using the fixed story time. */
export function beatToMessage(beat: FortStoryBeat): Message {
  return {
    id: beat.messageId,
    time: FORT_STORY_TIME,
    displayTime: "10:11",
    from: beat.sender,
    type: "text",
    text: beat.text,
  };
}
