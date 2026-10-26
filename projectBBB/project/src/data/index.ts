import meta from "@/data/meta.json";
import apps from "@/data/apps.json";
import contacts from "@/data/contacts.json";
import chats from "@/data/chats.json";
import photos from "@/data/photos.json";
import moments from "@/data/moments.json";
import notes from "@/data/notes.json";
import events from "@/data/events.json";
import browserHistory from "@/data/browser-history.json";
import browserPages from "@/data/browser-pages.json";
import endings from "@/data/endings.json";
import xPosts from "@/data/x-posts.json";
import xAccounts from "@/data/x-accounts.json";
import phoneCalls from "@/data/phone-calls.json";
import sms from "@/data/sms.json";
import mail from "@/data/mail.json";
import type { StoryData } from "@/types";

export const storyData: StoryData = {
  meta,
  apps: apps as StoryData["apps"],
  contacts: contacts as StoryData["contacts"],
  chats: chats as StoryData["chats"],
  photos: photos as StoryData["photos"],
  moments: moments as StoryData["moments"],
  notes: notes as StoryData["notes"],
  events: events as StoryData["events"],
  browserHistory: browserHistory as StoryData["browserHistory"],
  browserPages: browserPages as StoryData["browserPages"],
  endings: endings as StoryData["endings"],
  xPosts: xPosts as StoryData["xPosts"],
  xAccounts: xAccounts as StoryData["xAccounts"],
  phoneCalls: phoneCalls as StoryData["phoneCalls"],
  sms: sms as StoryData["sms"],
  mail: mail as StoryData["mail"],
};
