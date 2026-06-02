"use client";

import { motion } from "framer-motion";
import { Settings2, LayoutList, Users, Shield, Network, ArrowLeft, Briefcase } from "lucide-react";
import Link from "next/link";

// 🌟 اضافه کردن کلاس‌های dark: به استایل‌های هر ماژول برای هماهنگی با دارک‌مود
const settingsModules = [
  { 
    id: "workflows", 
    label: "موتور گردش‌کار (Workflows)", 
    description: "طراحی مسیرها، اکشن‌ها، چندراهی‌ها و اتوماسیون فرآیندها", 
    href: "/dashboard/settings/workflows", 
    icon: Network, 
    color: "text-blue-600 dark:text-blue-400", 
    bg: "bg-blue-50 dark:bg-blue-900/20", 
    hoverBorder: "hover:border-blue-300 dark:hover:border-blue-500/50",
    shadow: "hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5"
  },
  { 
    id: "forms", 
    label: "قالب‌های فرم (داینامیک)", 
    description: "ساخت و مدیریت فیلدهای پویا برای درخت دانش", 
    href: "/dashboard/settings/forms", 
    icon: LayoutList, 
    color: "text-indigo-600 dark:text-indigo-400", 
    bg: "bg-indigo-50 dark:bg-indigo-900/20", 
    hoverBorder: "hover:border-indigo-300 dark:hover:border-indigo-500/50",
    shadow: "hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5"
  },
  { 
    id: "teams", 
    label: "مدیریت کارتابل‌ها (تیم‌ها)", 
    description: "ساخت کارتابل کاری، تخصیص کارشناس و سینک با زمد", 
    href: "/dashboard/settings/teams", 
    icon: Briefcase, 
    color: "text-teal-600 dark:text-teal-400", 
    bg: "bg-teal-50 dark:bg-teal-900/20", 
    hoverBorder: "hover:border-teal-300 dark:hover:border-teal-500/50",
    shadow: "hover:shadow-teal-500/10 dark:hover:shadow-teal-500/5"
  },
  { 
    id: "roles", 
    label: "نقش‌ها و دسترسی‌ها", 
    description: "تعریف سطوح دسترسی برای کارشناسان و مدیران", 
    href: "#", 
    icon: Shield, 
    color: "text-amber-600 dark:text-amber-400", 
    bg: "bg-amber-50 dark:bg-amber-900/20", 
    hoverBorder: "hover:border-amber-300 dark:hover:border-amber-500/50",
    shadow: "hover:shadow-amber-500/10 dark:hover:shadow-amber-500/5",
    isLocked: true 
  },
  { 
    id: "users", 
    label: "مدیریت کارشناسان", 
    description: "تعریف کاربران سیستم، پشتیبان‌ها و تخصیص نقش", 
    href: "/dashboard/settings/users", 
    icon: Users, 
    color: "text-emerald-600 dark:text-emerald-400", 
    bg: "bg-emerald-50 dark:bg-emerald-900/20", 
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-500/50",
    shadow: "hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/5",
    isLocked: false 
  },
];

export default function SettingsDashboardPage() {
  return (
    // 🌟 جایگزینی bg-[#FBFBFD] با bg-background 🌟
    <div className="w-full min-h-screen bg-background p-6 md:p-10 flex flex-col gap-10 animate-in fade-in duration-500 text-right dir-rtl" dir="rtl">
      
      {/* هدر صفحه تنظیمات */}
      <div className="w-full flex flex-col items-start">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-surface border border-surface-border text-foreground rounded-full text-sm font-bold mb-4 shadow-sm">
          <Settings2 size={18} className="text-primary" /> هاب مرکزی تنظیمات
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">پیکربندی سیستم</h1>
        <p className="text-muted mt-3 text-sm md:text-base font-medium max-w-2xl leading-relaxed">
          از این بخش می‌توانید تمام فرآیندها، فرم‌ها، کاربران و منطق تجاری سیستم را به صورت داینامیک مدیریت کنید. برای ورود به هر بخش روی کارت مربوطه کلیک کنید.
        </p>
      </div>

      {/* شبکه کارت‌های تنظیمات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
        {settingsModules.map((module, index) => {
          const Icon = module.icon;
          
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="h-full"
            >
              <Link 
                href={module.isLocked ? "#" : module.href}
                // 🌟 جایگزینی bg-white با bg-surface و border-slate با surface-border 🌟
                className={`relative flex flex-col h-full bg-surface p-6 rounded-[2rem] border transition-all duration-300 group
                  ${module.isLocked 
                    ? "border-surface-border opacity-50 cursor-not-allowed grayscale" 
                    : `border-surface-border cursor-pointer ${module.hoverBorder} ${module.shadow} hover:-translate-y-1 shadow-sm`
                  }
                `}
              >
                {/* بخش بالای کارت: آیکون و وضعیت */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${module.bg} ${module.color}`}>
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  {module.isLocked ? (
                    <span className="text-[10px] font-black bg-background text-muted px-2.5 py-1.5 rounded-lg border border-surface-border">به زودی</span>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted group-hover:bg-primary group-hover:text-white transition-colors">
                      <ArrowLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                  )}
                </div>

                {/* متون کارت */}
                <div className="flex flex-col mt-auto">
                  <h3 className="text-lg font-black text-foreground mb-2">{module.label}</h3>
                  <p className="text-sm font-medium text-muted leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
      
    </div>
  );
}