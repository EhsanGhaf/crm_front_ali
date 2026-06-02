"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, ShieldCheck, ShieldAlert, KeyRound, Network,
  Smartphone, CheckCircle2, Loader2, Plus, Sun, Moon // 🌟 اضافه کردن آیکون‌های خورشید و ماه
} from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { toast } from 'sonner';

// 🌟 ایمپورت هوک مدیریت تم 🌟
import { useTheme } from "next-themes";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 استیت‌های مربوط به مدیریت تم 🌟
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // استیت‌های راه‌اندازی 2FA
  const [isSetup2FAOpen, setIsSetup2FAOpen] = useState(false);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // 🌟 اطمینان از کامپایل شدن در سمت کلاینت برای جلوگیری از خطای Hydration 🌟
  useEffect(() => {
    setMounted(true);
  }, []);

  // گرفتن اطلاعات کاربر
  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/accounts/me/");
      setUser(res.data);
    } catch (error) {
      toast.error("خطا در دریافت اطلاعات پروفایل.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // دریافت لینک QR Code از سرور
  const handleStart2FASetup = async () => {
    setIsSetup2FAOpen(true);
    try {
      const res = await api.get("/accounts/setup-2fa/");
      setQrUri(res.data.qr_uri);
    } catch (error) {
      toast.error("خطا در ارتباط با سرور برای تنظیم ۲FA.");
      setIsSetup2FAOpen(false);
    }
  };

  // ارسال کد تایید برای فعال‌سازی نهایی
  const handleVerifyAndEnable2FA = async () => {
    if (!otpCode || otpCode.length < 6) return;
    setIsVerifying(true);
    try {
      await api.post("/accounts/setup-2fa/", { code: otpCode });
      toast.success("احراز هویت دو مرحله‌ای با موفقیت فعال شد! 🎉");
      setIsSetup2FAOpen(false);
      setOtpCode("");
      fetchUserProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "کد وارد شده اشتباه است.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  const fullName = user?.first_name || user?.last_name ? `${user?.first_name} ${user?.last_name}`.trim() : "کاربر سیستم";
  const avatarLetter = fullName.charAt(0).toUpperCase();

  return (
    <div className="w-full min-h-screen bg-background p-6 md:p-10 flex flex-col gap-8 animate-in fade-in duration-500 text-right dir-rtl" dir="rtl">

      {/* 🌟 هدر صفحه: شامل عنوان و دکمه تغییر تم 🌟 */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-6 mb-2">
        <div className="flex flex-col items-start">
          <h1 className="text-3xl font-black text-foreground tracking-tight">پروفایل کاربری</h1>
          <p className="text-muted mt-2 text-sm font-medium">اطلاعات شخصی و تنظیمات امنیتی حساب کاربری شما</p>
        </div>

        {/* 🌟 دکمه سوئیچ تم (لایت/دارک) 🌟 */}
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2.5 px-5 py-3 bg-surface border border-surface-border rounded-xl shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-foreground shrink-0"
          >
            {resolvedTheme === 'dark' ? (
              <Sun size={18} className="text-amber-500" />
            ) : (
              <Moon size={18} className="text-indigo-500" />
            )}
            {resolvedTheme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl">
        
        {/* ==================================== */}
        {/* بخش اطلاعات شخصی (کارت راست) */}
        {/* ==================================== */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-surface p-8 rounded-[2.5rem] border border-surface-border shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />
            
            <div className="relative mt-8 mb-4">
              <div className="w-28 h-28 bg-surface rounded-full p-2 shadow-lg relative z-10">
                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl font-black text-slate-400">
                  {avatarLetter}
                </div>
              </div>
              <button className="absolute bottom-2 right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-hover transition z-20" title="تغییر عکس">
                <Plus size={16} />
              </button>
            </div>

            <h2 className="text-xl font-black text-foreground">{fullName}</h2>
            <p className="text-sm font-bold text-muted font-mono mt-1">{user?.username}</p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold mt-4">
              <ShieldCheck size={14} />
              {user?.is_admin ? "مدیر سیستم (Admin)" : "کارشناس سیستم (Agent)"}
            </div>
          </div>
        </div>

        {/* ==================================== */}
        {/* بخش تنظیمات و امنیت (کارت چپ) */}
        {/* ==================================== */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-surface p-8 rounded-[2.5rem] border border-surface-border shadow-sm">
            <h3 className="text-lg font-black text-foreground border-b border-surface-border pb-4 mb-6 flex items-center gap-2">
              <User className="text-primary" /> اطلاعات حساب
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-muted mb-2 block">ایمیل ثبت‌شده</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-surface-border rounded-xl text-foreground text-sm font-mono">
                  <Mail size={16} className="text-slate-400" /> {user?.email || "بدون ایمیل"}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted mb-2 block">شناسه Zammad</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-surface-border rounded-xl text-foreground text-sm font-mono">
                  <Network size={16} className="text-slate-400" /> {user?.zammad_id ? `#${user.zammad_id}` : "سینک نشده"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface p-8 rounded-[2.5rem] border border-surface-border shadow-sm">
            <h3 className="text-lg font-black text-foreground border-b border-surface-border pb-4 mb-6 flex items-center gap-2">
              <KeyRound className="text-rose-500" /> امنیت و احراز هویت دو مرحله‌ای (2FA)
            </h3>
            
            {!user?.is_2fa_enabled ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center shrink-0">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-900 dark:text-rose-300 text-base">احراز هویت دو مرحله‌ای غیرفعال است</h4>
                    <p className="text-sm font-medium text-rose-700/80 dark:text-rose-400/80 mt-1 leading-relaxed">
                      برای افزایش امنیت حساب کاربری خود، پیشنهاد می‌کنیم اپلیکیشن Google Authenticator را متصل کنید.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleStart2FASetup}
                  className="shrink-0 bg-rose-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 hover:bg-rose-700 transition"
                >
                  فعال‌سازی 2FA
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-6 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-base">حساب شما کاملاً امن است</h4>
                    <p className="text-sm font-medium text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                      احراز هویت دو مرحله‌ای فعال است و برای لاگین نیاز به کد تایید دارید.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {isSetup2FAOpen && qrUri && !user?.is_2fa_enabled && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 border-t border-surface-border pt-6 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-white p-3 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm shrink-0 flex items-center justify-center">
                      <QRCodeSVG value={qrUri} size={160} level="M" includeMargin={false} />
                    </div>
                    
                    <div className="flex flex-col gap-4 flex-1">
                      <p className="text-sm font-bold text-muted leading-relaxed">
                        ۱. اپلیکیشن Google Authenticator را در گوشی خود باز کنید.<br/>
                        ۲. روی علامت <span className="inline-block px-1.5 bg-slate-200 dark:bg-slate-700 rounded text-foreground">+</span> کلیک کرده و بارکد روبه‌رو را اسکن کنید.<br/>
                        ۳. کد ۶ رقمی تولید شده را در کادر زیر وارد کنید.
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative w-48">
                          <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input 
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            placeholder="------"
                            className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 pr-10 text-center tracking-[0.5em] text-lg font-black"
                            dir="ltr"
                            maxLength={6}
                          />
                        </div>
                        <button 
                          onClick={handleVerifyAndEnable2FA}
                          disabled={otpCode.length !== 6 || isVerifying}
                          className="h-12 px-6 bg-slate-800 dark:bg-slate-200 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white dark:text-slate-900 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                          {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                          تایید و فعال‌سازی
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </div>
  );
}