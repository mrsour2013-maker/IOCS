import { useState } from "react";
import { storyData } from "@/data";
import type { XPost, XAccount, XProfilePost } from "@/types";
import { AppHeader } from "@/components/ios/AppHeader";
import { useProgress } from "@/hooks/useProgress";
import { formatRelative } from "@/hooks/useClock";
import { Heart, MessageCircle, Repeat2, Share, Lock, User, Home, Settings, ChevronLeft, Check } from "lucide-react";

type XView = "timeline" | "profile";

/**
 * X (Twitter) app. Shows a public timeline of recommended posts plus
 * two switchable owned accounts (Phuw1n public, done private). Switching
 * to the private "done" account requires all non-muted LINE chats to be
 * read first — the same gate the Phone app uses for Pond call-back.
 */
export function XApp() {
  const progress = useProgress();
  const [view, setView] = useState<XView>("timeline");
  const [activeAccountId, setActiveAccountId] = useState<string>("phuw1n");
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showBlockAlert, setShowBlockAlert] = useState(false);
  const [doneUnlocked, setDoneUnlocked] = useState(false);

  const activeAccount = storyData.xAccounts.find((a) => a.id === activeAccountId)!;

  /** True when every non-muted LINE chat has zero unread messages. */
  const lineReadComplete = storyData.chats
    .filter((chat) => !chat.muted)
    .every((chat) => progress.unreadCount("line", chat.id) === 0);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* top bar */}
      {view === "timeline" ? (
        <AppHeader title="X" large />
      ) : (
        <div className="relative flex h-[44px] items-center justify-center border-b border-gray-200 bg-white px-2">
          <button
            onClick={() => setView("timeline")}
            className="absolute left-2 flex items-center text-[16px] text-[#007aff] active:opacity-60"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="text-[16px] font-medium text-black">个人主页</span>
          <button
            onClick={() => setShowSwitcher(true)}
            className="absolute right-2 text-gray-400 active:opacity-60"
          >
            <Settings size={20} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {view === "timeline" ? (
          <Timeline />
        ) : (
          <ProfileView account={activeAccount} />
        )}
        <div className="h-20" />
      </div>

      {/* bottom tab bar */}
      <div className="flex h-[49px] shrink-0 items-center justify-around border-t border-gray-200 bg-white">
        <TabButton
          icon={<Home size={22} />}
          label="主页"
          active={view === "timeline"}
          onClick={() => setView("timeline")}
        />
        <TabButton
          icon={<User size={22} />}
          label="个人"
          active={view === "profile"}
          onClick={() => setView("profile")}
        />
      </div>

      {/* account switcher sheet */}
      {showSwitcher && (
        <AccountSwitcher
          accounts={storyData.xAccounts}
          activeId={activeAccountId}
          onSelect={(id) => {
            if (id === "done" && !doneUnlocked) {
              if (!lineReadComplete) {
                setShowSwitcher(false);
                setShowBlockAlert(true);
                return;
              }
              setDoneUnlocked(true);
            }
            setActiveAccountId(id);
            setShowSwitcher(false);
          }}
          onClose={() => setShowSwitcher(false)}
        />
      )}

      {/* block alert */}
      {showBlockAlert && (
        <BlockAlert onClose={() => setShowBlockAlert(false)} />
      )}
    </div>
  );
}

// --- Timeline -------------------------------------------------------------

function Timeline() {
  const progress = useProgress();
  const posts = storyData.xPosts;
  const sorted = [...posts].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <>
      {sorted.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          unread={progress.unreadCount("x", post.id) > 0}
          onView={() => progress.markItemRead("x", post.id, post.unlocks)}
        />
      ))}
    </>
  );
}

function PostCard({
  post,
  unread,
  onView,
}: {
  post: XPost;
  unread: boolean;
  onView: () => void;
}) {
  return (
    <article
      className="border-b border-gray-100 px-4 py-3 active:bg-gray-50"
      onClick={onView}
    >
      <div className="flex gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: post.authorColor ?? "#000" }}
        >
          {post.author.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className={`truncate text-[15px] ${unread ? "font-extrabold" : "font-bold"} text-black`}>
              {post.author}
            </span>
            {post.verified && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l2.4 1.8 3 .2.2 3L19.4 9.6 21 12l-1.6 2.4.2 3-3 .2L14.4 19.6 12 21l-2.4-1.4-3-.2-.2-3L4.6 14.4 3 12l1.6-2.4-.2-3 3-.2L9.6 3.8 12 2z"
                  fill="#1d9bf0"
                />
                <path
                  d="M9 12.5l2 2 4-4.5"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            )}
            <span className="truncate text-[14px] text-gray-500">
              @{post.handle} · {formatRelative(post.time)}
            </span>
          </div>
          <div className="mt-1 whitespace-pre-line text-[15px] leading-snug text-black">
            {post.text}
          </div>
          {post.image && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200">
              <img
                src={post.image}
                alt=""
                className="max-h-[220px] w-full object-cover"
                draggable={false}
              />
            </div>
          )}
          <div className="mt-3 flex items-center gap-6 text-gray-400">
            <span className="flex items-center gap-1.5 text-[13px]">
              <MessageCircle size={18} />
              {post.replies ?? 0}
            </span>
            <span className="flex items-center gap-1.5 text-[13px]">
              <Repeat2 size={18} />
              {post.retweets ?? 0}
            </span>
            <span className="flex items-center gap-1.5 text-[13px]">
              <Heart size={18} />
              {post.likes ?? 0}
            </span>
            <Share size={16} className="ml-auto" />
          </div>
        </div>
      </div>
    </article>
  );
}

// --- Profile view ---------------------------------------------------------

function ProfileView({ account }: { account: XAccount }) {
  const sorted = [...account.posts].sort((a, b) => b.time.localeCompare(a.time));
  const isPrivate = account.type === "private";

  return (
    <div>
      {/* banner + avatar */}
      <div className="h-32 bg-gradient-to-r from-[#1d9bf0]/20 to-[#7b68ee]/20" />
      <div className="relative px-4">
        <div className="-mt-12 flex items-end justify-between">
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-2xl font-bold text-white shadow-sm"
            style={{ background: account.color ?? "#000" }}
          >
            {account.avatar ? (
              <img src={account.avatar} alt="" className="h-full w-full object-cover" draggable={false} />
            ) : (
              account.name.slice(0, 1)
            )}
          </div>
          {isPrivate && (
            <div className="mb-2 flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[12px] font-medium text-gray-500">
              <Lock size={13} />
              私密账号
            </div>
          )}
        </div>

        <div className="mt-2">
          <div className="text-[19px] font-bold text-black">{account.name}</div>
          <div className="text-[14px] text-gray-500">@{account.handle}</div>
        </div>

        <div className="mt-3 flex gap-4 text-[14px]">
          <span className="text-gray-500">
            <b className="text-black">{account.following ?? 0}</b> 关注
          </span>
          <span className="text-gray-500">
            <b className="text-black">{account.followers ?? 0}</b> 粉丝
          </span>
        </div>

        <div className="mt-3 text-[15px] font-semibold text-black">
          {account.posts.length} 条帖子
        </div>
      </div>

      {/* posts */}
      <div className="mt-2 border-t border-gray-100">
        {sorted.map((post) => (
          <ProfilePostCard key={post.id} post={post} handle={account.handle} color={account.color ?? "#000"} />
        ))}
      </div>
    </div>
  );
}

function ProfilePostCard({ post, handle, color }: { post: XProfilePost; handle: string; color: string }) {
  const dateLabel = formatExplicitDate(post.time);
  return (
    <article className="border-b border-gray-100 px-4 py-3">
      <div className="flex gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: color }}
        >
          {handle.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-[15px] font-bold text-black">{handle}</span>
            <span className="truncate text-[14px] text-gray-500">
              @{handle} · {dateLabel}
            </span>
          </div>
          <div className="mt-1 whitespace-pre-line text-[15px] leading-snug text-black">
            {post.text}
          </div>
          <div className="mt-3 flex items-center gap-6 text-gray-400">
            <span className="flex items-center gap-1.5 text-[13px]">
              <MessageCircle size={18} />
              {post.replies ?? 0}
            </span>
            <span className="flex items-center gap-1.5 text-[13px]">
              <Repeat2 size={18} />
              {post.retweets ?? 0}
            </span>
            <span className="flex items-center gap-1.5 text-[13px]">
              <Heart size={18} />
              {post.likes ?? 0}
            </span>
            <Share size={16} className="ml-auto" />
          </div>
        </div>
      </div>
    </article>
  );
}

/** Format an ISO date as "YYYY.MM.DD" for X profile posts (no relative time). */
function formatExplicitDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// --- Tab bar --------------------------------------------------------------

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 ${active ? "text-black" : "text-gray-400"} active:opacity-60`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// --- Account switcher sheet -----------------------------------------------

function AccountSwitcher({
  accounts,
  activeId,
  onSelect,
  onClose,
}: {
  accounts: XAccount[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl bg-white pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div className="px-4 pt-3 pb-2 text-[15px] font-semibold text-black">切换账号</div>
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => onSelect(account.id)}
            className="flex w-full items-center gap-3 px-4 py-3 active:bg-gray-50"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: account.color ?? "#000" }}
            >
              {account.avatar ? (
                <img src={account.avatar} alt="" className="h-full w-full object-cover" draggable={false} />
              ) : (
                account.name.slice(0, 1)
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1.5 text-[15px] font-medium text-black">
                {account.name}
                {account.type === "private" && <Lock size={13} className="text-gray-400" />}
              </div>
              <div className="text-[13px] text-gray-500">@{account.handle}</div>
            </div>
            {activeId === account.id && <Check size={20} className="text-[#1d9bf0]" />}
          </button>
        ))}
        <button
          onClick={onClose}
          className="w-full px-4 py-3 text-center text-[16px] font-medium text-[#007aff] active:bg-gray-50"
        >
          取消
        </button>
      </div>
    </div>
  );
}

// --- Block alert (LINE read gate) -----------------------------------------

function BlockAlert({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[270px] overflow-hidden rounded-2xl bg-[#f9f9f9] shadow-xl">
        <div className="px-4 py-5 text-center">
          <div className="text-[17px] font-semibold text-black">暂时无法切换</div>
          <div className="mt-1 text-[13px] leading-snug text-gray-500">
            请先阅读完 LINE 中的未读消息。
          </div>
        </div>
        <div className="flex border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-[16px] font-semibold text-[#007aff] active:bg-gray-100"
          >
            好
          </button>
        </div>
      </div>
    </div>
  );
}
