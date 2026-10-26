import { useMemo, useState } from "react";
import { storyData } from "@/data";
import { ChevronLeft, History, Home, MoreVertical, RefreshCw, Search } from "lucide-react";

export function BrowserApp() {
  const [showHistory, setShowHistory] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const history = useMemo(
    () => [...storyData.browserHistory].sort((a, b) => b.time.localeCompare(a.time)),
    [],
  );

  const selectHistory = (id: string, value: string) => {
    setSelectedId(id);
    setQuery(value);
  };

  return (
    <div
      className="flex h-full flex-col bg-white"
      onClick={() => showHistory && setShowHistory(false)}
    >
      <div className="flex h-[40px] shrink-0 items-center gap-4 border-b border-gray-100 px-3 text-gray-500">
        <ChevronLeft size={21} className="text-gray-300" />
        <RefreshCw size={16} />
        <div className="flex-1" />
        <MoreVertical size={19} />
      </div>

      <div className="flex h-[36px] shrink-0 items-center gap-2 border-b border-gray-100 px-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-[13px] text-gray-500">
          <Search size={13} />
          <span className="truncate">google.com</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col items-center px-5 pt-[96px]">
          <GoogleLogo />
          <button
            className="mt-8 flex h-12 w-full max-w-[330px] items-center gap-3 rounded-full border border-gray-200 bg-white px-4 text-left shadow-[0_1px_6px_rgba(32,33,36,0.12)] transition-shadow active:shadow-none"
            onClick={(event) => {
              event.stopPropagation();
              setShowHistory(true);
            }}
          >
            <Search size={19} className="shrink-0 text-gray-500" />
            <span className={`min-w-0 flex-1 truncate text-[15px] ${query ? "text-gray-800" : "text-gray-500"}`}>
              {query || "搜索或输入网址"}
            </span>
            <span className="h-5 w-5 shrink-0 rounded-full bg-[#4285f4]" />
          </button>

          {showHistory && (
            <div
              className="absolute inset-x-4 top-[224px] z-10 max-h-[calc(100%-240px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white py-2 shadow-[0_8px_30px_rgba(0,0,0,0.14)]"
              onClick={(event) => event.stopPropagation()}
            >
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectHistory(item.id, item.query)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-gray-100 ${selectedId === item.id ? "bg-blue-50" : ""}`}
                >
                  <History size={17} className="shrink-0 text-gray-400" />
                  <span className="min-w-0 flex-1 truncate text-[14px] text-gray-800">{item.query}</span>
                  <span className="shrink-0 text-[12px] text-gray-400">{formatHistoryDate(item.time)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex h-[48px] shrink-0 items-center justify-center border-t border-gray-100 bg-white text-gray-400">
        <div className="flex items-center gap-1 text-[11px]">
          <Home size={15} />
          <span>主页</span>
        </div>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <div aria-label="Google" className="select-none text-[42px] font-medium tracking-[-3px] leading-none">
      <span className="text-[#4285f4]">G</span>
      <span className="text-[#ea4335]">o</span>
      <span className="text-[#fbbc05]">o</span>
      <span className="text-[#4285f4]">g</span>
      <span className="text-[#34a853]">l</span>
      <span className="text-[#ea4335]">e</span>
    </div>
  );
}

function formatHistoryDate(value: string): string {
  const date = new Date(value);
  return `${date.getMonth() + 1}.${date.getDate().toString().padStart(2, "0")}`;
}
