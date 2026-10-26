import { useEffect, useState } from "react";

/** Updates every second; returns a Date so callers can format as needed. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const WEEKDAYS_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function formatTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatLockTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatLockDate(d: Date): string {
  return `${WEEKDAYS_ZH[d.getDay()]} ${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatRelative(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const sameDay = then.toDateString() === now.toDateString();
  const hm = `${then.getHours()}:${then.getMinutes().toString().padStart(2, "0")}`;
  if (sameDay) return hm;
  const diffDays = Math.floor((now.getTime() - then.getTime()) / 86400000);
  if (diffDays < 2) return "昨天";
  if (diffDays < 7) return WEEKDAYS_ZH[then.getDay()];
  return `${then.getMonth() + 1}月${then.getDate()}日`;
}

export function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS_ZH[d.getDay()]}`;
}
