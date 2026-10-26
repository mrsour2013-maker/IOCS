// Core data model for the iOS virtual phone interactive novel.
// All content lives in JSON files under src/data — components stay data-driven.

export type AppId =
  | "line"
  | "x"
  | "browser"
  | "phone"
  | "messages";

export interface AppDefinition {
  id: AppId;
  name: string;
  /** icon key resolved by AppIcon component (not a lucide name) */
  icon: string;
  /** whether the icon sits in the dock */
  dock?: boolean;
}

// --- WeChat ---------------------------------------------------------------

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  /** optional colored fallback when no avatar image */
  color?: string;
}

export interface Message {
  id: string;
  /** iso timestamp used for ordering and date separators */
  time: string;
  /** explicitly authored clock time shown below this message */
  displayTime?: string;
  /** sender id, or "me" for the player */
  from: string;
  type: "text" | "image" | "recall" | "call";
  callType?: CallType;
  text?: string;
  image?: string;
  /** id of the message this one recalls */
  recallTarget?: string;
}

export interface Chat {
  id: string;
  /** contact id for a private chat, or group id for a group chat */
  title: string;
  avatar: string;
  color?: string;
  isGroup: boolean;
  pinned?: boolean;
  muted?: boolean;
  initialUnreadCount?: number;
  /** member contact ids (for groups) */
  members?: string[];
  /** member profiles scoped to this group */
  memberProfiles?: Contact[];
  messages: Message[];
  /** ids of content flags unlocked by reading this chat */
  unlocks?: string[];
}

// --- Photos ---------------------------------------------------------------

export interface Photo {
  id: string;
  src: string;
  date: string;
  description: string;
  /** flags unlocked when this photo is viewed */
  unlocks?: string[];
}

// --- Moments (朋友圈) ------------------------------------------------------

export interface MomentComment {
  from: string;
  text: string;
}

export interface Moment {
  id: string;
  author: string;
  avatar: string;
  color?: string;
  time: string;
  text: string;
  images?: string[];
  likes?: string[];
  comments?: MomentComment[];
  unlocks?: string[];
}

// --- Notes (备忘录) --------------------------------------------------------

export interface Note {
  id: string;
  title: string;
  time: string;
  /** body may contain multiple paragraphs */
  body: string[];
  /** clues surfaced inside this note */
  unlocks?: string[];
}

// --- Calendar -------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time?: string;
  location?: string;
  notes?: string;
  unlocks?: string[];
}

// --- Browser --------------------------------------------------------------

export interface BrowserHistoryItem {
  id: string;
  query: string;
  time: string;
}

export interface BrowserPage {
  id: string;
  url: string;
  title: string;
  /** simple rendered body paragraphs */
  body: string[];
  /** links to other page ids */
  links?: string[];
  unlocks?: string[];
}

// --- Story meta ------------------------------------------------------------

export interface Ending {
  id: string;
  title: string;
  /** flags that must ALL be set to trigger this ending */
  requires: string[];
  description: string;
}

export interface StoryMeta {
  title: string;
  author: string;
  version: string;
  /** phone wallpaper (lock screen + home) */
  wallpaper: string;
  /** device label shown briefly */
  deviceName: string;
}

// --- X (Twitter) ----------------------------------------------------------

export interface XPost {
  id: string;
  author: string;
  handle: string;
  authorColor?: string;
  verified?: boolean;
  time: string;
  text: string;
  image?: string;
  replies?: number;
  retweets?: number;
  likes?: number;
  unlocks?: string[];
}

/** A post authored by an owned X account (Phuw1n / done). */
export interface XProfilePost {
  id: string;
  /** iso date, e.g. "2026-10-23T00:00:00" */
  time: string;
  text: string;
  likes?: number;
  retweets?: number;
  replies?: number;
}

export type XAccountType = "public" | "private";

export interface XAccount {
  id: string;
  /** display name */
  name: string;
  /** handle without @ */
  handle: string;
  /** account visibility */
  type: XAccountType;
  /** avatar image path; undefined = default */
  avatar?: string;
  /** fallback color for avatar */
  color?: string;
  following?: number;
  followers?: number;
  /** profile posts, newest-first in source */
  posts: XProfilePost[];
}

// --- Phone calls -----------------------------------------------------------

export type CallType = "incoming" | "outgoing" | "missed";

export interface PhoneCall {
  id: string;
  name: string;
  /** stable contact id grouping calls by person */
  contactId: string;
  /** formatted phone number with country code, e.g. "+1 (212) 555-0148" */
  phone: string;
  /** iso timestamp */
  time: string;
  type: CallType;
  /** human-readable duration, e.g. "3分12秒" */
  duration?: string;
  color?: string;
  unlocks?: string[];
}

// --- SMS (Messages) --------------------------------------------------------

export interface SMSMessage {
  id: string;
  time: string;
  /** "me" or a contact id */
  from: string;
  text: string;
}

export interface SMSConversation {
  id: string;
  name: string;
  color?: string;
  /** iso timestamp of the most recent message, for sorting */
  lastTime: string;
  messages: SMSMessage[];
  unlocks?: string[];
}

// --- Mail ------------------------------------------------------------------

export interface MailMessage {
  id: string;
  sender: string;
  senderEmail: string;
  to: string;
  date: string;
  subject: string;
  summary: string;
  body: string[];
  initialRead: boolean;
}

// Aggregate of everything the UI reads at runtime.
export interface StoryData {
  meta: StoryMeta;
  apps: AppDefinition[];
  contacts: Contact[];
  chats: Chat[];
  photos: Photo[];
  moments: Moment[];
  notes: Note[];
  events: CalendarEvent[];
  browserHistory: BrowserHistoryItem[];
  browserPages: BrowserPage[];
  endings: Ending[];
  xPosts: XPost[];
  xAccounts: XAccount[];
  phoneCalls: PhoneCall[];
  sms: SMSConversation[];
  mail: MailMessage[];
}
