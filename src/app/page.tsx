"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, LockKeyhole, UserCircle, KeyRound, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  // 🌟 اضافه کردن ساختار ثبت دقیق معتبرسازی فیلدها 🌟
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"login" | "2fa">("login");
  const router = useRouter();

  const onSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      if (step === "login") {
        const response = await api.post("/accounts/login/", {
          username: data.username.trim(), // حذف فاصله‌های خالی احتمالی
          password: data.password,
        });

        if (response.data.step === "2fa_required") {
          setStep("2fa");
          localStorage.setItem("temp_token", response.data.temp_token);
          toast.info(response.data.message || "لطفاً کد تایید گوگل را وارد کنید.");
        } else {
          localStorage.setItem("access_token", response.data.access);
          localStorage.setItem("is_admin", response.data.is_admin);
          toast.success("با موفقیت وارد شدید! در حال انتقال...");
          router.push("/dashboard");
        }
      } else {
        const response = await api.post("/accounts/verify-2fa/", {
          username: data.username.trim(), 
          code: data.otp_code,
        });
        
        localStorage.setItem("access_token", response.data.access);
        localStorage.setItem("is_admin", response.data.is_admin);
        toast.success("کد تایید شد. خوش آمدید!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      // نمایش پیام مستقیم ارور از سمت بک‌اِند در صورت وجود
      toast.error(error.response?.data?.error || "نام کاربری یا رمز عبور اشتباه است.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 🌟 تغییر رنگ پس‌زمینه به bg-background برای دارک‌مود 🌟
    <main className="flex min-h-screen w-full bg-background text-foreground dir-rtl" dir="rtl">
      
      {/* ==================================== */}
      {/* بخش راست: فرم ورود (کادر داینامیک) */}
      {/* ==================================== */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-8 sm:p-12 z-10 relative">
        <div className="w-full max-w-sm flex flex-col gap-8">
          
          <div className="flex flex-col gap-2 text-right">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <ShieldCheck size={32} className="text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              {step === "login" ? "ورود به حساب" : "تایید دو مرحله‌ای"}
            </h1>
            <p className="text-sm font-medium text-muted">
              {step === "login" 
                ? "برای دسترسی به داشبورد، مشخصات خود را وارد کنید." 
                : "لطفاً کد ۶ رقمی اپلیکیشن Google Authenticator را وارد کنید."}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            <div className={step === "2fa" ? "hidden" : "space-y-5"}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground opacity-80">نام کاربری</label>
                <div className="relative">
                  <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    {...register("username", { required: true })} 
                    dir="ltr"
                    className="bg-surface border-surface-border h-12 pr-10 focus-visible:ring-primary/20 rounded-xl text-sm text-foreground"
                    placeholder="username"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground opacity-80">رمز عبور</label>
                <div className="relative">
                  <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    type="password" 
                    {...register("password", { required: true })} 
                    placeholder="••••••••" 
                    dir="ltr"
                    className="bg-surface border-surface-border h-12 pr-10 focus-visible:ring-primary/20 rounded-xl tracking-widest text-foreground"
                  />
                </div>
              </div>
            </div>

            {step === "2fa" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <label className="text-xs font-bold text-foreground opacity-80">کد تایید (OTP)</label>
                <div className="relative">
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    {...register("otp_code")} 
                    placeholder="------" 
                    dir="ltr"
                    className="bg-surface border-surface-border h-12 pr-10 text-center tracking-[0.5em] text-lg font-black focus-visible:ring-primary/20 rounded-xl text-foreground"
                    maxLength={6}
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-2" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLoading ? "در حال پردازش..." : (step === "login" ? "ورود به داشبورد" : "تایید و ورود")}
            </Button>
          </form>

        </div>
      </div>

      {/* ==================================== */}
      {/* بخش چپ: تصویر/گرادیانت تزئینی */}
      {/* ==================================== */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-800 to-slate-900 opacity-90" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />

        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center p-12 text-white">
          <div className="max-w-lg flex flex-col gap-6">
            <h2 className="text-4xl font-black leading-tight">سیستم یکپارچه مدیریت ارتباط با مشتریان</h2>
            <p className="text-blue-100 font-medium leading-relaxed opacity-80">
              مدیریت هوشمند تیکت‌ها، کارتابل‌های تیمی و ارتباط یکپارچه با سیستم در یک محیط کاملاً امن و سریع.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-200/50 mt-8">
              <span>طراحی و توسعه برای یکپارچگی حداکثری صرافی والکس</span>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}