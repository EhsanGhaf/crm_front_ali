"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 🌟 چک کردن فیلد is_admin به جای role 🌟
    setIsAdmin(localStorage.getItem("is_admin") === "true");
  }, []);

  const stats = [
    // 🌟 تنظیم رنگ‌ها برای سازگاری با دارک مود (bg-... به همراه dark:bg-...)
    { title: "تیکت‌های در انتظار", value: "۱۲", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { title: "کاربران آنلاین", value: "۱,۴۲۰", icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "تیکت‌های حل شده", value: "۸۴", icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { title: "نرخ رضایت", value: "۹۸٪", icon: TrendingUp, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-foreground">سلام، وقت بخیر! 👋</h1>
        <p className="text-muted">خلاصه وضعیت سیستم و فعالیت‌های امروز شما در صرافی والکس.</p>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            // 🌟 تغییرات رنگی کارت 🌟
            <div key={index} className="bg-surface p-6 rounded-2xl border border-surface-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                  <Icon size={24} />
                </div>
                <span className="text-xs font-bold text-muted">امروز</span>
              </div>
              <div className="text-3xl font-black text-foreground">{stat.value}</div>
              <div className="text-sm font-bold text-muted mt-1">{stat.title}</div>
            </div>
          );
        })}
      </div>

      {/* بخش فعالیت‌های اخیر */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* کارت لیست تیکت‌ها */}
        <div className="lg:col-span-2 bg-surface rounded-3xl border border-surface-border p-8 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6">آخرین تیکت‌های تخصیص یافته</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              // 🌟 تغییر استایل ردیف‌های تیکت 🌟
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-surface-border hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary font-bold">#</div>
                  <div>
                    <div className="font-bold text-foreground">مشکل در احراز هویت سطح ۲</div>
                    <div className="text-xs text-muted mt-1">کاربر: علی محمدی • ۵ دقیقه پیش</div>
                  </div>
                </div>
                <div className="text-xs font-bold px-3 py-1 bg-surface rounded-full border border-surface-border text-muted">فوری</div>
              </div>
            ))}
          </div>
        </div>

        {/* کارت گرادیانت راهنما */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">میانبرهای سریع</h3>
            <p className="text-blue-100 text-sm opacity-90">از کلیدهای میانبر برای سرعت بیشتر استفاده کنید.</p>
          </div>
          <div className="space-y-3 mt-10">
            <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
              <span className="text-sm font-medium">ساخت تیکت جدید</span>
              <kbd className="bg-white/20 px-2 py-1 rounded text-xs font-mono">Cmd + J</kbd>
            </div>
            <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
              <span className="text-sm font-medium">جستجوی کاربر</span>
              <kbd className="bg-white/20 px-2 py-1 rounded text-xs font-mono">/</kbd>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}