"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutList, Plus, FileText, ChevronLeft, 
  Loader2, Save, Trash2, ArrowRight, Tags, X // 🌟 اضافه شدن Tags و X
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";

// 🌟 ایمپورت پکیج‌های هشدار و تاییدیه 🌟
import { toast } from 'sonner';
import { confirmAlert } from '@/lib/swal';

// 🌟 اضافه شدن نوع‌های انتخابی و چندانتخابی 🌟
const FIELD_TYPES = [
  { value: "text", label: "متن کوتاه" },
  { value: "textarea", label: "متن بلند (پاراگراف)" },
  { value: "int", label: "عدد صحیح" },
  { value: "float", label: "عدد اعشاری (مبلغ)" },
  { value: "bool", label: "تاییدیه (چک‌باکس)" },
  { value: "date", label: "تاریخ و زمان" },
  { value: "select", label: "انتخابی (selectBox)" },
  { value: "multiselect", label: "چندانتخابی" },
];

export default function FormsBuilderPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any | null>(null);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [isSavingForm, setIsSavingForm] = useState(false);
  
  const [isAddingField, setIsAddingField] = useState(false);
  const [isSavingField, setIsSavingField] = useState(false);
  const [newFieldData, setNewFieldData] = useState({ label: "", field_type: "text", required: false });

  // 🌟 استیت‌های مربوط به دریافت گزینه‌ها (Options) 🌟
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");

  const fetchForms = async () => {
    setIsLoadingForms(true);
    try {
      const res = await api.get("/forms/admin/forms/");
      setForms(res.data);
      if (selectedForm) {
        const updated = res.data.find((f: any) => f.id === selectedForm.id);
        setSelectedForm(updated || null);
      }
    } catch (error) {
      toast.error("خطا در دریافت قالب‌های فرم. لطفاً اتصال خود را بررسی کنید.");
    } finally {
      setIsLoadingForms(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreateForm = async () => {
    if (!newFormTitle.trim()) {
      toast.warning("لطفاً عنوان فرم را وارد کنید.");
      return;
    }
    
    setIsSavingForm(true);
    try {
      await api.post("/forms/admin/forms/", { title: newFormTitle });
      setNewFormTitle("");
      setIsCreatingForm(false);
      toast.success("شابلون فرم جدید با موفقیت ساخته شد.");
      fetchForms();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ساخت فرم جدید.");
    } finally {
      setIsSavingForm(false);
    }
  };

  // 🌟 توابع مدیریت گزینه‌ها (تگ‌ها) 🌟
  const handleAddOptionTag = () => {
    if (optionInput.trim() && !fieldOptions.includes(optionInput.trim())) {
      setFieldOptions([...fieldOptions, optionInput.trim()]);
      setOptionInput("");
    }
  };

  const handleRemoveOptionTag = (tagToRemove: string) => {
    setFieldOptions(fieldOptions.filter(tag => tag !== tagToRemove));
  };

  const handleAddField = async () => {
    if (!newFieldData.label.trim()) {
      toast.warning("لطفاً عنوان فیلد را وارد کنید.");
      return;
    }

    // بررسی اینکه اگر فیلد انتخابی است، حتماً گزینه داشته باشد
    if (["select", "multiselect"].includes(newFieldData.field_type) && fieldOptions.length === 0) {
      toast.warning("لطفاً حداقل یک گزینه برای این فیلد تعریف کنید.");
      return;
    }

    if (!selectedForm) return;

    setIsSavingField(true);
    try {
      await api.post("/forms/admin/fields/", {
        form_id: selectedForm.id,
        label: newFieldData.label,
        field_type: newFieldData.field_type,
        required: newFieldData.required,
        order: selectedForm.fields?.length || 0,
        options: fieldOptions.join(",") // 🌟 گزینه‌ها با کاما به بک‌اِند ارسال می‌شوند 🌟
      });
      
      setIsAddingField(false);
      setNewFieldData({ label: "", field_type: "text", required: false });
      setFieldOptions([]); // پاک کردن گزینه‌ها برای فیلد بعدی
      
      toast.success("فیلد جدید با موفقیت اضافه شد.");
      fetchForms();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در افزودن فیلد جدید.");
    } finally {
      setIsSavingField(false);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    const result = await confirmAlert(
      "حذف فیلد از فرم",
      "آیا از حذف این فیلد اطمینان دارید؟ اطلاعات ثبت شده قبلی تحت تاثیر قرار نخواهند گرفت.",
      "بله، فیلد حذف شود",
      "انصراف",
      true
    );

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/forms/admin/fields/${fieldId}/`);
      toast.success("فیلد با موفقیت حذف شد.");
      fetchForms();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در حذف فیلد.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-background p-6 md:p-10 flex flex-col gap-8 animate-in fade-in duration-500 text-right dir-rtl" dir="rtl">
      
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex flex-col items-start gap-2">
          <Link href="/dashboard/settings" className="flex items-center gap-2 text-muted hover:text-primary transition-colors text-sm font-bold bg-surface px-4 py-2 rounded-xl border border-surface-border shadow-sm">
            <ArrowRight size={16} /> بازگشت به تنظیمات
          </Link>
          <h1 className="text-3xl font-black text-foreground tracking-tight mt-4 flex items-center gap-3">
            <LayoutList className="text-primary" size={32} /> قالب‌های فرم داینامیک
          </h1>
        </div>
      </div>

      <div className="flex-1 w-full bg-surface p-6 md:p-8 rounded-[2rem] border border-surface-border shadow-sm min-h-[600px] flex flex-col md:flex-row gap-8">
        
        {/* Sidebar: Form List */}
        <div className="w-full md:w-[350px] flex flex-col border-l border-surface-border pl-6 shrink-0 h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-foreground">شابلون‌های فرم</h2>
            <button onClick={() => setIsCreatingForm(true)} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"><Plus size={18} strokeWidth={2.5} /></button>
          </div>

          <AnimatePresence>
            {isCreatingForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-surface-border overflow-hidden">
                <label className="text-xs font-bold text-muted mb-2 block">عنوان فرم جدید</label>
                <Input value={newFormTitle} onChange={e => setNewFormTitle(e.target.value)} placeholder="مثلاً: فرم اطلاعات هویتی" className="bg-surface border-surface-border text-foreground mb-3" />
                <div className="flex gap-2">
                  <button onClick={handleCreateForm} disabled={isSavingForm} className="flex-1 flex items-center justify-center gap-1 bg-primary disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-hover transition">
                    {isSavingForm ? <Loader2 size={14} className="animate-spin" /> : null}
                    ذخیره
                  </button>
                  <button onClick={() => setIsCreatingForm(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition">لغو</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {isLoadingForms ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted" /></div>
            ) : forms.length === 0 ? (
              <div className="text-center text-muted text-sm font-medium py-8">هنوز فرمی ساخته نشده است.</div>
            ) : (
              forms.map((form) => (
                <button
                  key={form.id} onClick={() => setSelectedForm(form)}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                    selectedForm?.id === form.id ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 shadow-sm" : "border-surface-border bg-surface hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className={selectedForm?.id === form.id ? "text-primary" : "text-muted"} />
                    <span className={`text-sm font-bold ${selectedForm?.id === form.id ? "text-primary dark:text-blue-400" : "text-foreground"}`}>{form.title}</span>
                  </div>
                  <ChevronLeft size={16} className={selectedForm?.id === form.id ? "text-primary dark:text-blue-400" : "text-muted"} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Field Management */}
        <div className="flex-1 w-full flex flex-col h-full overflow-y-auto custom-scrollbar">
          {!selectedForm ? (
            <div className="h-full flex flex-col items-center justify-center text-muted gap-4 opacity-50">
              <LayoutList size={64} strokeWidth={1} />
              <p className="font-medium text-lg">برای مشاهده و ویرایش فیلدها، یک فرم را انتخاب کنید.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-surface-border pb-5 mb-6 sticky top-0 bg-surface z-10">
                <div>
                  <h2 className="text-2xl font-black text-foreground">{selectedForm.title}</h2>
                  <p className="text-sm text-muted font-medium mt-1">مدیریت فیلدهایی که در این فرم به کاربر نمایش داده می‌شوند.</p>
                </div>
                <button onClick={() => { setIsAddingField(true); setFieldOptions([]); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-hover transition">
                  <Plus size={16} /> فیلد جدید
                </button>
              </div>

              <AnimatePresence>
                {isAddingField && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-slate-50 dark:bg-slate-800/50 border border-surface-border rounded-2xl p-6 mb-6 overflow-hidden">
                    <h4 className="font-bold text-foreground mb-4 border-b border-surface-border pb-2">تنظیمات فیلد جدید</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div>
                        <label className="text-xs font-bold text-muted mb-1 block">عنوان (لیبل) فیلد</label>
                        <Input value={newFieldData.label} onChange={e => setNewFieldData({...newFieldData, label: e.target.value})} placeholder="مثال: روش پرداخت" className="bg-surface border-surface-border text-foreground h-11" />
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-muted mb-1 block">نوع فیلد</label>
                        <select value={newFieldData.field_type} onChange={e => setNewFieldData({...newFieldData, field_type: e.target.value})} className="w-full h-11 px-3 bg-surface border border-surface-border rounded-lg text-sm font-bold text-foreground outline-none focus:border-primary cursor-pointer">
                          {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                        </select>
                      </div>

                      {/* 🌟 بخش تعریف گزینه‌ها برای فیلدهای انتخابی 🌟 */}
                      <AnimatePresence>
                        {["select", "multiselect"].includes(newFieldData.field_type) && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:col-span-2 overflow-hidden">
                            <div className="bg-background border border-surface-border rounded-xl p-4 space-y-4 mt-2">
                              <div>
                                <label className="text-xs font-bold text-primary mb-2 flex items-center gap-1"><Tags size={14}/> تعریف گزینه‌ها</label>
                                
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <Input 
                                      value={optionInput} 
                                      onChange={e => setOptionInput(e.target.value)} 
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddOptionTag();
                                        }
                                      }}
                                      placeholder="گزینه را بنویسید و Enter بزنید..." 
                                      className="bg-surface border-surface-border text-foreground w-full h-11 rounded-lg pl-16 pr-3" 
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted font-mono bg-background px-1.5 py-0.5 rounded border border-surface-border pointer-events-none hidden sm:inline-block">Enter ↵</span>
                                  </div>
                                  <button onClick={handleAddOptionTag} className="bg-blue-100 dark:bg-blue-900/50 text-primary hover:bg-blue-200 px-4 rounded-lg text-sm font-bold transition-colors">افزودن</button>
                                </div>
                              </div>

                              {fieldOptions.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-border">
                                  {fieldOptions.map((tag, idx) => (
                                    <span key={idx} className="flex items-center gap-1.5 bg-surface border border-surface-border text-foreground px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                      {tag}
                                      <button onClick={() => handleRemoveOptionTag(tag)} className="text-muted hover:text-rose-500 transition-colors"><X size={14} /></button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="md:col-span-2 flex items-center justify-between bg-surface p-3 border border-surface-border rounded-lg mt-2">
                        <span className="text-sm font-bold text-foreground">آیا پر کردن این فیلد اجباری است؟</span>
                        <input type="checkbox" checked={newFieldData.required} onChange={e => setNewFieldData({...newFieldData, required: e.target.checked})} className="w-5 h-5 cursor-pointer accent-primary" />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <button onClick={handleAddField} disabled={isSavingField} className="flex items-center gap-2 bg-primary disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover transition">
                        {isSavingField ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>}
                        ثبت فیلد
                      </button>
                      <button onClick={() => setIsAddingField(false)} className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition">انصراف</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3 pb-8">
                {(!selectedForm.fields || selectedForm.fields.length === 0) ? (
                  <div className="p-8 text-center text-muted font-medium bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-surface-border">هنوز فیلدی به این فرم اضافه نشده است.</div>
                ) : (
                  selectedForm.fields.map((field: any, index: number) => (
                    <div key={field.id} className="flex flex-col p-4 bg-surface border border-surface-border rounded-2xl hover:border-primary dark:hover:border-primary/50 transition-colors group gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-muted flex items-center justify-center font-black text-xs">{index + 1}</div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{field.label}</span>
                              {field.required && <span className="bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 text-[10px] font-black px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/50">اجباری</span>}
                            </div>
                            <span className="text-xs font-medium text-muted mt-1 uppercase">تایپ: {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteField(field.id)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                      </div>

                      {/* 🌟 نمایش گزینه‌ها (تگ‌ها) در لیست فرم 🌟 */}
                      {field.options && ["select", "multiselect"].includes(field.field_type) && (
                        <div className="flex flex-wrap gap-1.5 pr-12">
                          {field.options.split(",").map((opt: string, i: number) => (
                            <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-surface-border shadow-sm">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}