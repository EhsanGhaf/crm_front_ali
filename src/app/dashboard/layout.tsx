"use client";

import { ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Ticket, 
  BookOpen, 
  Settings, 
  LogOut,
  Zap,
  UserCircle // اضافه شده برای لینک پروفایل
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/CommandPalette";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isHovered, setIsHovered] = useState(false);

  // 🌟 منوی پروفایل را هم به لیست اضافه کردیم تا در سایدبار هم دسترسی داشته باشید
  const menuItems = [
    { name: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
    { name: "تیکت‌ها", href: "/dashboard/tickets", icon: Ticket },
    { name: "درخت دانش", href: "/dashboard/knowledge", icon: BookOpen },
    { name: "تنظیمات", href: "/dashboard/settings", icon: Settings },
    { name: "پروفایل", href: "/dashboard/profile", icon: UserCircle },
  ];

  const activeItem = menuItems.find(item => item.href === pathname) || menuItems[0];
  const ActiveIcon = activeItem.icon;

  const isDashboardRoot = pathname === "/dashboard";
  const isMenuExpanded = isDashboardRoot || isHovered;

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    // 🌟 تغییر bg-slate-50 به bg-background 🌟
    <div className="min-h-screen bg-background font-vazir relative overflow-x-hidden" dir="rtl">
      
      <CommandPalette />

      <header className="absolute top-0 w-full p-8 flex justify-between items-center z-40 pointer-events-none">
         <div className="flex items-center gap-3 pointer-events-auto">
           {/* استفاده از رنگ‌های primary */}
           <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">W</div>
           <span className="text-xl font-black text-foreground tracking-tight">Wallex CRM</span>
         </div>
         
         <div className="flex items-center gap-4 pointer-events-auto">
            {/* 🌟 تغییر رنگ به surface برای پشتیبانی از دارک‌مود 🌟 */}
            <div className="flex items-center gap-2 bg-surface/70 backdrop-blur-md px-4 py-2 rounded-full border border-surface-border shadow-sm text-sm font-bold text-muted">
              <Zap size={16} className="text-amber-500" />
              <span>میانبر: Cmd + J</span>
            </div>
         </div>
      </header>

      <main className="pt-32 pb-32 px-8 max-w-7xl mx-auto min-h-screen">
        {children}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <motion.nav 
          layout 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          // 🌟 تغییر رنگ پس‌زمینه آیلند 🌟
          className="flex items-center bg-surface/90 backdrop-blur-xl border border-surface-border shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden"
          style={{ borderRadius: 9999 }}
        >
          <AnimatePresence mode="wait">
            {isMenuExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 p-2"
              >
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={cn(
                        "relative flex items-center justify-center px-4 py-3 rounded-full text-sm font-bold transition-colors duration-300 z-10",
                        // رنگ‌های تم‌دار برای آیتم فعال و غیرفعال
                        isActive ? "text-primary" : "text-muted hover:text-foreground"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-pill"
                          // رنگ پس‌زمینه برای آیتم فعال (استفاده از اپسیتی در دارک‌مود)
                          className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full -z-10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        {isActive && (
                          <motion.span 
                            initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
                            className="ml-1"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </div>
                    </button>
                  );
                })}
                <div className="w-px h-8 bg-surface-border mx-1"></div>
                <button 
                  onClick={handleLogout}
                  className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors flex items-center justify-center shrink-0"
                  title="خروج از حساب"
                >
                  <LogOut size={20} strokeWidth={2.5} />
                </button>
              </motion.div>

            ) : (
              <motion.div
                key="compact"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center p-2 cursor-pointer"
              >
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-md shadow-primary/30">
                  <ActiveIcon size={22} strokeWidth={2.5} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      </div>

    </div>
  );
}