"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, Plus, Loader2, ArrowRight, Save, 
  Users, CheckCircle2, ShieldAlert, X, UserPlus, UserMinus, Search, User
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";

// 🌟 ایمپورت پکیج‌های هشدار و تاییدیه 🌟
import { toast } from 'sonner';
import { confirmAlert } from '@/lib/swal';

export default function TeamsManagementPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // استیت‌های فرم ساخت تیم جدید
  const [isCreating, setIsCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [isSaving, setIsSaving] = useState(false);

  // استیت‌های مدیریت اعضا
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);

  // گرفتن لیست تیم‌ها از بک‌اِند
  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/accounts/teams/"); 
      setTeams(res.data.results || res.data);
    } catch (error) {
      toast.error("خطا در دریافت لیست کارتابل‌ها.");
    } finally {
      setIsLoading(false);
    }
  };

  // گرفتن لیست همه کاربران
  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.get("/accounts/users/"); 
      setAllUsers(res.data.results || res.data);
    } catch (error) {
      toast.error("خطا در دریافت لیست کاربران.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchAllUsers();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast.warning("لطفاً نام کارتابل را وارد کنید.");
      return;
    }
    
    setIsSaving(true);
    try {
      await api.post("/accounts/teams/", { 
        name: newTeam.name, 
        description: newTeam.description,
        is_active: true
      });
      setNewTeam({ name: "", description: "" });
      setIsCreating(false);
      toast.success("کارتابل جدید با موفقیت ساخته و با زمد سینک شد.");
      fetchTeams();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ساخت کارتابل. شاید این نام تکراری باشد!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenManageMembers = (team: any) => {
    setSelectedTeam(team);
    setSearchUserQuery("");
    setIsManageMembersModalOpen(true);
  };

  const handleToggleMember = async (userId: number, action: "add" | "remove") => {
    if (!selectedTeam) return;

    if (action === "remove") {
      const result = await confirmAlert(
        "حذف کاربر از کارتابل",
        "آیا مطمئن هستید که می‌خواهید این کاربر را از این کارتابل کاری خارج کنید؟",
        "بله، خارج کن",
        "انصراف",
        true
      );
      if (!result.isConfirmed) return;
    }

    setIsUpdatingMember(true);
    
    try {
      await api.post(`/accounts/teams/${selectedTeam.id}/members/`, {
        user_id: userId,
        action: action
      });
      
      const updatedTeams = teams.map(t => {
        if (t.id === selectedTeam.id) {
          const currentMembers = t.members || [];
          let newMembers;
          
          if (action === "add") {
            const userToAdd = allUsers.find(u => u.id === userId);
            newMembers = [...currentMembers, userToAdd];
          } else {
            newMembers = currentMembers.filter((m: any) => m.id !== userId);
          }
          
          const updatedTeam = { ...t, members: newMembers, members_count: newMembers.length };
          setSelectedTeam(updatedTeam); 
          return updatedTeam; 
        }
        return t;
      });
      
      setTeams(updatedTeams);
      toast.success(`کاربر با موفقیت ${action === "add" ? "به کارتابل اضافه" : "از کارتابل حذف"} شد.`);
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || `خطا در ${action === "add" ? "افزودن" : "حذف"} کاربر.`);
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchUserQuery) return allUsers;
    return allUsers.filter(u => {
      const searchStr = `${u.first_name || ''} ${u.last_name || ''} ${u.email || ''} ${u.username || ''}`.toLowerCase();
      return searchStr.includes(searchUserQuery.toLowerCase());
    });
  }, [allUsers, searchUserQuery]);

  return (
    <div className="w-full min-h-screen bg-background p-6 md:p-10 flex flex-col gap-8 animate-in fade-in duration-500 text-right dir-rtl" dir="rtl">
      
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full mb-2 gap-4">
        <div className="flex flex-col items-start gap-2">
          <Link href="/dashboard/settings" className="flex items-center gap-2 text-muted hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-sm font-bold bg-surface px-4 py-2 rounded-xl border border-surface-border shadow-sm w-fit">
            <ArrowRight size={16} /> بازگشت به تنظیمات
          </Link>
          <h1 className="text-3xl font-black text-foreground tracking-tight mt-4 flex items-center gap-3">
            <Briefcase className="text-teal-500" size={32} /> مدیریت کارتابل‌ها (تیم‌ها)
          </h1>
          <p className="text-muted text-sm font-medium">کارتابل‌های ساخته شده در اینجا، بلافاصله با گروه‌های سیستم Zammad همگام‌سازی می‌شوند.</p>
        </div>
        
        <button onClick={() => setIsCreating(true)} className="flex items-center justify-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-2xl text-sm font-bold hover:bg-teal-700 transition shadow-sm shadow-teal-500/20 shrink-0">
          <Plus size={18} /> ایجاد کارتابل جدید
        </button>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* فرم ساخت تیم جدید */}
        <AnimatePresence>
          {isCreating && (
            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -20, height: 0 }} className="overflow-hidden">
              <div className="bg-surface p-6 md:p-8 rounded-[2rem] border border-teal-100 dark:border-teal-900/50 shadow-sm shadow-teal-100/50 dark:shadow-teal-900/20 flex flex-col gap-6">
                <h3 className="text-lg font-black text-foreground border-b border-surface-border pb-4">تعریف کارتابل کاری جدید</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-muted mb-2 block">نام کارتابل (انگلیسی/فارسی)</label>
                    <Input 
                      value={newTeam.name} 
                      onChange={e => setNewTeam({...newTeam, name: e.target.value})} 
                      placeholder="مثلاً: Blockchain_Support یا پشتیبانی مالی" 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted mb-2 block">توضیحات (اختیاری)</label>
                    <Input 
                      value={newTeam.description} 
                      onChange={e => setNewTeam({...newTeam, description: e.target.value})} 
                      placeholder="توضیح کوتاه درباره وظایف این کارتابل" 
                      className="bg-slate-50 dark:bg-slate-800/50 border-surface-border h-12 text-foreground"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleCreateTeam} disabled={!newTeam.name || isSaving} className="bg-teal-600 disabled:bg-teal-400 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-teal-700 transition flex items-center gap-2">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    ذخیره و سینک با زمد
                  </button>
                  <button onClick={() => setIsCreating(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                    انصراف
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* لیست تیم‌ها */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted gap-4">
            <Loader2 size={40} className="animate-spin text-teal-500" />
            <p className="font-medium text-sm">در حال دریافت کارتابل‌ها از سرور...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-surface rounded-[2rem] border border-surface-border p-16 flex flex-col items-center justify-center text-muted gap-4">
            <Briefcase size={64} strokeWidth={1} className="opacity-50" />
            <p className="font-medium text-lg">هنوز هیچ کارتابلی در سیستم تعریف نشده است.</p>
            <button onClick={() => setIsCreating(true)} className="text-teal-600 dark:text-teal-400 font-bold text-sm mt-2 hover:underline">اولین کارتابل را بسازید</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="bg-surface rounded-[2rem] border border-surface-border p-6 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700/50 transition-all group flex flex-col h-full relative overflow-hidden">
                
                {team.is_active && <div className="absolute top-0 left-0 right-0 h-1.5 bg-teal-500/80" />}

                <div className="flex items-start justify-between mb-4 mt-2">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Briefcase size={24} />
                  </div>
                  {team.is_active ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-900/50">
                      <CheckCircle2 size={12} /> سینک شده
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-md border border-rose-100 dark:border-rose-900/50">
                      <ShieldAlert size={12} /> غیرفعال
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-foreground mb-2">{team.name}</h3>
                <p className="text-sm font-medium text-muted mb-6 flex-1">
                  {team.description || "بدون توضیحات"}
                </p>

                <div className="flex items-center justify-between border-t border-surface-border pt-4 mt-auto">
                  <div className="flex items-center gap-2 text-muted">
                    <Users size={16} />
                    <span className="text-xs font-bold">{team.members_count || team.members?.length || 0} کارشناس عضو</span>
                  </div>
                  <button 
                    onClick={() => handleOpenManageMembers(team)}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    مدیریت اعضا
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* مودال مدیریت اعضا */}
      <AnimatePresence>
        {isManageMembersModalOpen && selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsManageMembersModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-2xl bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-lg">اعضای کارتابل {selectedTeam.name}</h3>
                    <p className="text-xs font-bold text-muted">کاربران مورد نظر را جستجو و اضافه کنید</p>
                  </div>
                </div>
                <button onClick={() => setIsManageMembersModalOpen(false)} className="p-2 text-muted hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-foreground rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="p-4 border-b border-surface-border shrink-0 bg-surface">
                 <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input 
                      autoFocus 
                      value={searchUserQuery} 
                      onChange={(e) => setSearchUserQuery(e.target.value)} 
                      placeholder="جستجوی نام، ایمیل یا موبایل کاربر..."
                      className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-surface-border h-12 pl-4 pr-12 text-sm font-medium text-foreground rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100/50 dark:focus:ring-teal-900/30 transition-all"
                    />
                 </div>
              </div>

              <div className="p-4 overflow-y-auto custom-scrollbar bg-background flex-1">
                {isLoadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted gap-3">
                    <Loader2 size={24} className="animate-spin text-teal-500" />
                    <span className="text-sm font-medium">در حال دریافت کاربران...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center text-muted py-10 font-medium text-sm">کاربری با این مشخصات یافت نشد.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredUsers.map(user => {
                      const isMember = (selectedTeam.members || []).some((m: any) => m.id === user.id);
                      
                      return (
                        <div key={user.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isMember ? 'bg-teal-50/50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-900/50 shadow-sm' : 'bg-surface border-surface-border hover:border-slate-300 dark:hover:border-slate-600'}`}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted">
                              <User size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</span>
                              <span className="text-xs font-medium text-muted font-mono mt-0.5">{user.email || user.username}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleToggleMember(user.id, isMember ? "remove" : "add")}
                            disabled={isUpdatingMember}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                              isMember 
                                ? "bg-surface border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20" 
                                : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-500/20"
                            } disabled:opacity-50`}
                          >
                            {isMember ? (
                              <><UserMinus size={14} /> حذف از تیم</>
                            ) : (
                              <><UserPlus size={14} /> افزودن به تیم</>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}