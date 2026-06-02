"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, PlusCircle, FileText, UserSearch, X, Settings2, Users, LayoutList } from "lucide-react";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // ترکیب اکشن‌های سریع و تنظیمات سیستم
  const allActions = useMemo(() => [
    { id: 1, title: "ثبت تیکت جدید", category: "عملیات سریع", icon: PlusCircle, color: "text-blue-500", bg: "bg-blue-50", href: '/dashboard/tickets' },
    { id: 2, title: "جستجو در درخت دانش", category: "عملیات سریع", icon: FileText, color: "text-amber-500", bg: "bg-amber-50", href: '/dashboard/knowledge/' },
    { id: 3, title: "داشبورد اصلی", category: "عملیات سریع", icon: UserSearch, color: "text-emerald-500", bg: "bg-emerald-50", href: "/dashboard" },
    
    // 🌟 آیتم‌های جدید تنظیمات 🌟
    { id: 4, title: "تنظیمات فرم‌ساز داینامیک", category: "تنظیمات سیستم", icon: LayoutList, color: "text-indigo-500", bg: "bg-indigo-50", href: "/dashboard/settings?tab=forms" },
    { id: 5, title: "مدیریت نقش‌ها و دسترسی‌ها", category: "تنظیمات سیستم", icon: Users, color: "text-slate-500", bg: "bg-slate-100", href: "/dashboard/settings?tab=roles" },
    { id: 6, title: "تنظیمات کلی سیستم", category: "تنظیمات سیستم", icon: Settings2, color: "text-slate-500", bg: "bg-slate-100", href: "/dashboard/settings" },
  ], []);

  // منطق فیلتر کردن بر اساس سرچ
  const filteredActions = useMemo(() => {
    if (!searchQuery.trim()) return allActions;
    return allActions.filter(action => 
      action.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      action.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allActions]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-[15%] left-1/2 z-[101] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
            dir="rtl"
          >
            <div className="flex items-center border-b border-slate-100 px-4 py-4 bg-slate-50/50">
              <Search className="h-6 w-6 text-slate-400 ml-3" />
              <input
                ref={inputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="دستور یا تنظیمات مورد نظر را جستجو کنید..."
                className="flex-1 bg-transparent text-lg text-slate-800 outline-none placeholder:text-slate-400 font-medium"
              />
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-md text-slate-400 hover:bg-slate-200 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {filteredActions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium">هیچ نتیجه‌ای یافت نشد.</div>
              ) : (
                <div className="space-y-1">
                  {filteredActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => { setIsOpen(false); router.push(action.href); }}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-right transition-all duration-200 hover:bg-slate-50 focus:bg-slate-100 outline-none group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}><Icon size={20} /></div>
                          <span className="font-bold text-slate-700">{action.title}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{action.category}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 flex items-center justify-between text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2"><span>ناوبری:</span><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">↑ ↓</kbd></div>
              <div className="flex items-center gap-2"><span>بستن:</span><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">ESC</kbd></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}