"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, Loader2, ArrowRight, Save, 
  CheckCircle2, ShieldAlert, UserPlus, Mail, UserCircle, Search, Edit2, X, RefreshCw, Power, Trash2, Ban, ShieldOff
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";

// 🌟 ایمپورت پکیج‌های هشدار و تاییدیه 🌟
import { toast } from 'sonner';
import { confirmAlert } from '@/lib/swal';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newUser, setNewUser] = useState({ 
    username: "", email: "", password: "", first_name: "", last_name: "" 
  });

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: "", email: "", password: "", first_name: "", last_name: ""
  });

  const [syncingUserId, setSyncingUserId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/accounts/users/"); 
      setUsers(res.data.results || res.data);
    } catch (error) {
      toast.error("خطا در دریافت لیست کارشناسان.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.username.trim() || !newUser.password || !newUser.email) {
      toast.error("پر کردن نام کاربری، ایمیل و رمز عبور الزامی است.");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await api.post("/accounts/register/", newUser);
      setNewUser({ username: "", email: "", password: "", first_name: "", last_name: "" });
      setIsCreating(false);
      fetchUsers(); 

      if (!res.data.zammad_id) {
        toast.warning("اکانت کارشناس ساخته شد، اما ارتباط با سرور Zammad برقرار نشد. لطفاً بعداً همگام‌سازی کنید.", { duration: 8000 });
      } else {
        toast.success("حساب کاربری با موفقیت ساخته و با زمد همگام‌سازی شد.");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "خطا در ساخت کارشناس.";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username || "",
      email: user.email || "",
      password: "", 
      first_name: user.first_name || "",
      last_name: user.last_name || ""
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      const { password, ...restData } = editFormData;
      const payload = password.trim() ? editFormData : restData;
      await api.patch(`/accounts/users/${editingUser.id}/`, payload);
      toast.success("اطلاعات کاربر با موفقیت به‌روزرسانی شد.");
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error("خطا در ویرایش اطلاعات کاربر.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (user: any) => {
    const newStatus = !user.is_active;
    const actionText = newStatus ? "فعال" : "غیرفعال";
    
    const result = await confirmAlert(
      `تغییر وضعیت به ${actionText}`,
      `آیا مطمئن هستید که می‌خواهید حساب کاربری ${user.username} را ${actionText} کنید؟`,
      `بله، ${actionText} کن`,
      "انصراف",
      !newStatus 
    );

    if (!result.isConfirmed) return;

    try {
      await api.patch(`/accounts/users/${user.id}/`, { is_active: newStatus });
      toast.success(`حساب کاربر با موفقیت ${actionText} شد.`);
      fetchUsers();
    } catch (error) {
      toast.error("خطا در تغییر وضعیت کاربر.");
    }
  };

  // 🌟 تابع جدید برای ریست کردن تایید دو مرحله‌ای 🌟
  const handleReset2FA = async (user: any) => {
    const result = await confirmAlert(
      "غیرفعال‌سازی تایید دو مرحله‌ای",
      `آیا از غیرفعال کردن سیستم 2FA برای کاربر ${user.username} اطمینان دارید؟ کاربر در ورود بعدی باید مجدداً QR Code را اسکن کند.`,
      "بله، غیرفعال کن",
      "انصراف",
      true // دکمه قرمز برای هشدار
    );

    if (!result.isConfirmed) return;

    try {
      await api.post(`/accounts/admin/reset-2fa/${user.id}/`);
      toast.success(`تایید دو مرحله‌ای برای ${user.username} غیرفعال شد.`);
      fetchUsers(); // رفرش لیست برای دریافت وضعیت جدید
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در غیرفعال‌سازی 2FA.");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const result = await confirmAlert(
      "حذف دائمی کاربر",
      "آیا از حذف دائمی این کاربر اطمینان دارید؟ این عملیات غیرقابل بازگشت است!"
    );

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/accounts/users/${userId}/`);
      toast.success("کاربر با موفقیت حذف شد.");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در حذف کاربر.");
    }
  };

  const handleManualSync = async (userId: number) => {
    setSyncingUserId(userId);
    try {
      await api.post(`/accounts/users/${userId}/sync/`);
      toast.success("کارشناس با موفقیت با زمد همگام شد.");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در همگام‌سازی با زمد.");
    } finally {
      setSyncingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter(u => {
      const q = searchQuery.toLowerCase();
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-background p-6 md:p-10 flex flex-col gap-8 animate-in fade-in duration-500 text-right dir-rtl" dir="rtl">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full mb-2 gap-4">
        <div className="flex flex-col items-start gap-2">
          <Link href="/dashboard/settings" className="flex items-center gap-2 text-muted hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-bold bg-surface px-4 py-2 rounded-xl border border-surface-border shadow-sm w-fit">
            <ArrowRight size={16} /> بازگشت به تنظیمات
          </Link>
          <h1 className="text-3xl font-black text-foreground tracking-tight mt-4 flex items-center gap-3">
            <Users className="text-emerald-500" size={32} /> مدیریت کارشناسان
          </h1>
          <p className="text-muted text-sm font-medium">ساخت و مدیریت اکانت کارشناسان. تنظیمات امنیتی (2FA) و همگام‌سازی با سیستم Zammad.</p>
        </div>
        
        <button onClick={() => setIsCreating(true)} className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-500/20 shrink-0">
          <UserPlus size={18} /> افزودن کارشناس جدید
        </button>
      </div>

      <div className="flex flex-col gap-6">
        
        {!isCreating && (
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام، نام خانوادگی، ایمیل یا نام کاربری..."
              className="bg-surface border-surface-border/60 shadow-sm h-14 pl-4 pr-12 text-foreground font-medium rounded-2xl focus-visible:ring-emerald-100"
            />
          </div>
        )}

        <AnimatePresence>
          {isCreating && (
            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -20, height: 0 }} className="overflow-hidden">
              <div className="bg-surface p-6 md:p-8 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 shadow-sm shadow-emerald-100/50 flex flex-col gap-6">
                <h3 className="text-lg font-black text-foreground border-b border-surface-border pb-4">تعریف حساب کاربری جدید</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-muted mb-2 block">نام کاربری (انگلیسی) <span className="text-rose-500">*</span></label>
                    <Input 
                      value={newUser.username} 
                      onChange={e => setNewUser({...newUser, username: e.target.value.trim()})} 
                      placeholder="مثال: ali_rezayi" 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 text-foreground"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted mb-2 block">ایمیل (برای لاگین و اتصال به زمد) <span className="text-rose-500">*</span></label>
                    <Input 
                      type="email"
                      value={newUser.email} 
                      onChange={e => setNewUser({...newUser, email: e.target.value.trim()})} 
                      placeholder="ali@domain.com" 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 text-foreground"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted mb-2 block">نام (فارسی)</label>
                    <Input 
                      value={newUser.first_name} 
                      onChange={e => setNewUser({...newUser, first_name: e.target.value})} 
                      placeholder="مثال: علی" 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted mb-2 block">نام خانوادگی (فارسی)</label>
                    <Input 
                      value={newUser.last_name} 
                      onChange={e => setNewUser({...newUser, last_name: e.target.value})} 
                      placeholder="مثال: رضایی" 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 text-foreground"
                    />
                  </div>
                  <div className="md:col-span-2 border-t border-surface-border pt-4 mt-2">
                    <label className="text-sm font-bold text-muted mb-2 block">رمز عبور اولیه <span className="text-rose-500">*</span></label>
                    <Input 
                      type="text"
                      value={newUser.password} 
                      onChange={e => setNewUser({...newUser, password: e.target.value})} 
                      placeholder="یک رمز عبور قوی وارد کنید..." 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 md:w-1/2 text-foreground"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleCreateUser} 
                    disabled={!newUser.username || !newUser.email || !newUser.password || isSaving} 
                    className="bg-emerald-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    ساخت اکانت و سینک
                  </button>
                  <button onClick={() => setIsCreating(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                    انصراف
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted gap-4">
            <Loader2 size={40} className="animate-spin text-emerald-500" />
            <p className="font-medium text-sm">در حال دریافت لیست کارشناسان...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-surface rounded-[2rem] border border-surface-border/60 p-16 flex flex-col items-center justify-center text-muted gap-4">
            <Users size={64} strokeWidth={1} className="opacity-50" />
            <p className="font-medium text-lg">{searchQuery ? "کارشناسی با این مشخصات یافت نشد." : "هنوز هیچ کارشناسی در سیستم تعریف نشده است."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => {
              const fullName = user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : "بدون نام";
              const avatarLetter = (user.first_name?.[0] || user.username?.[0] || "U").toUpperCase();
              const isSynced = !!user.zammad_id;
              const isSyncingThis = syncingUserId === user.id;
              const isActive = user.is_active !== false; 

              return (
                <div key={user.id} className={`bg-surface rounded-[2rem] border p-6 shadow-sm hover:shadow-md transition-all group flex flex-col relative overflow-hidden ${isActive ? 'border-surface-border hover:border-emerald-300 dark:hover:border-emerald-700/50' : 'border-surface-border grayscale-[40%] bg-slate-50 dark:bg-slate-800/40 opacity-80'}`}>
                  
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${!isActive ? 'bg-slate-400 dark:bg-slate-600' : isSynced ? 'bg-emerald-500' : 'bg-amber-400'}`} />

                  <div className="flex items-start justify-between mb-4 mt-2">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-muted'}`}>
                      {avatarLetter}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {!isActive ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">
                          <Ban size={12} /> حساب غیرفعال
                        </span>
                      ) : isSynced ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                          <CheckCircle2 size={12} /> شناسه زمد: {user.zammad_id}
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleManualSync(user.id)}
                          disabled={isSyncingThis}
                          className="flex items-center gap-1.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSyncingThis ? (
                            <><Loader2 size={12} className="animate-spin" /> در حال سینک...</>
                          ) : (
                            <><RefreshCw size={12} /> همگام‌سازی با زمد</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className={`text-lg font-black mb-1 ${isActive ? 'text-foreground' : 'text-muted line-through decoration-slate-300 dark:decoration-slate-700'}`}>{fullName}</h3>
                  
                  <div className="flex flex-col gap-2 mt-4 text-sm font-medium text-muted">
                    <div className="flex items-center gap-2">
                      <UserCircle size={16} className="text-slate-400" />
                      <span className="font-mono tracking-wider">{user.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-slate-400" />
                      <span className="font-mono">{user.email || "بدون ایمیل"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-4 mt-6">
                    <button 
                      onClick={() => handleOpenEdit(user)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-muted bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                    >
                      <Edit2 size={14} /> ویرایش
                    </button>
                    
                    <button 
                      onClick={() => handleToggleActive(user)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-colors ${isActive ? 'text-muted bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'}`}
                    >
                      <Power size={14} /> {isActive ? "غیرفعال" : "فعال‌سازی"}
                    </button>
                    
                    {/* 🌟 دکمه ریست 2FA 🌟 */}
                    <button 
                      onClick={() => handleReset2FA(user)}
                      title={user.is_2fa_enabled ? "غیرفعال کردن تایید دو مرحله‌ای" : "تایید دو مرحله‌ای غیرفعال است"}
                      disabled={!user.is_2fa_enabled}
                      className={`flex items-center justify-center p-2 rounded-xl transition-colors ${user.is_2fa_enabled ? 'text-slate-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400' : 'text-slate-300 dark:text-slate-600 bg-transparent cursor-not-allowed'}`}
                    >
                      <ShieldOff size={16} />
                    </button>

                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      title="حذف کامل کاربر"
                      className="flex items-center justify-center p-2 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* مودال ویرایش اطلاعات */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-2xl bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-lg">ویرایش اطلاعات کارشناس</h3>
                    <p className="text-xs font-bold text-muted">{editingUser.username}</p>
                  </div>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-2 text-muted hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-foreground rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-muted mb-2 block">نام کاربری</label>
                    <Input 
                      value={editFormData.username} 
                      onChange={e => setEditFormData({...editFormData, username: e.target.value})} 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 text-foreground"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted mb-2 block">ایمیل</label>
                    <Input 
                      type="email"
                      value={editFormData.email} 
                      onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 text-foreground"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted mb-2 block">نام (فارسی)</label>
                    <Input 
                      value={editFormData.first_name} 
                      onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted mb-2 block">نام خانوادگی (فارسی)</label>
                    <Input 
                      value={editFormData.last_name} 
                      onChange={e => setEditFormData({...editFormData, last_name: e.target.value})} 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 text-foreground"
                    />
                  </div>
                  <div className="md:col-span-2 border-t border-surface-border pt-4 mt-2">
                    <label className="text-sm font-bold text-muted mb-2 block">رمز عبور جدید (اختیاری)</label>
                    <p className="text-xs text-muted mb-2">اگر نمی‌خواهید رمز تغییر کند، این فیلد را خالی بگذارید.</p>
                    <Input 
                      type="text"
                      value={editFormData.password} 
                      onChange={e => setEditFormData({...editFormData, password: e.target.value})} 
                      placeholder="رمز عبور جدید..." 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 md:w-1/2 text-foreground"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-surface-border bg-slate-50/50 dark:bg-slate-800/30 flex gap-3">
                <button onClick={() => setEditingUser(null)} className="flex-1 h-12 rounded-xl text-slate-600 dark:text-slate-300 border border-surface-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">انصراف</button>
                <button 
                  onClick={handleUpdateUser} 
                  disabled={isUpdating} 
                  className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 transition-all flex justify-center items-center gap-2"
                >
                  {isUpdating ? <Loader2 size={18} className="animate-spin" /> : "ذخیره تغییرات"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}