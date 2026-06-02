"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  Layers, Save, Edit3, Settings2, FileText, ToggleLeft, ToggleRight, 
  Loader2, AlertCircle, Plus, Network, Search, ChevronDown, Info,
  Tags, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from 'sonner';
import { TreeNode } from "./types";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  parentId: number | null; 
  parentName?: string;
  initialData?: any | null; 
  onSuccess: (newNode: TreeNode) => void; 
  onCancel: () => void;    
}

const FIELD_TYPES = [
  { value: "text", label: "متن کوتاه" },
  { value: "textarea", label: "متن بلند (پاراگراف)" },
  { value: "int", label: "عدد صحیح" },
  { value: "float", label: "عدد اعشاری (مبلغ)" },
  { value: "bool", label: "تاییدیه (چک‌باکس)" },
  { value: "date", label: "تاریخ و زمان" },
];

export function DynamicFormBuilder({ parentId, parentName, initialData, onSuccess, onCancel }: Props) {
  const [nodeName, setNodeName] = useState(initialData?.name || "");
  const [nodeGuideline, setNodeGuideline] = useState(initialData?.guideline || "");
  const [workflowId, setWorkflowId] = useState(initialData?.workflow || "");
  
  // 🌟 استیت مربوط به شابلون فرم (جایگزین گروه زمد) 🌟
  const [formId, setFormId] = useState<string>(initialData?.form_id?.toString() || "");
  const [formsList, setFormsList] = useState<any[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  
  const [tags, setTags] = useState<string[]>(
    Array.isArray(initialData?.tags) ? initialData.tags : []
  );
  const [tagInput, setTagInput] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [categoryFields, setCategoryFields] = useState<any[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [workflowsList, setWorkflowsList] = useState<any[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);

  const [isAddingCustomField, setIsAddingCustomField] = useState(false);
  const [customFieldData, setCustomFieldData] = useState({ label: "", field_type: "text", is_required: false });

  // رفرنس‌ها و استیت‌های جستجو برای Dropdown ها
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [workflowSearchQuery, setWorkflowSearchQuery] = useState("");
  const workflowDropdownRef = useRef<HTMLDivElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSearchQuery, setFormSearchQuery] = useState("");
  const formDropdownRef = useRef<HTMLDivElement>(null);

  // بستن دراپ‌داون‌ها هنگام کلیک بیرون از آن‌ها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workflowDropdownRef.current && !workflowDropdownRef.current.contains(event.target as Node)) {
        setIsWorkflowOpen(false);
      }
      if (formDropdownRef.current && !formDropdownRef.current.contains(event.target as Node)) {
        setIsFormOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // فیلتر کردن لیست گردش‌کارها و فرم‌ها
  const filteredWorkflows = useMemo(() => {
    return workflowsList.filter((wf) => wf.name.toLowerCase().includes(workflowSearchQuery.toLowerCase()));
  }, [workflowsList, workflowSearchQuery]);

  const filteredForms = useMemo(() => {
    return formsList.filter((f) => f.title.toLowerCase().includes(formSearchQuery.toLowerCase()));
  }, [formsList, formSearchQuery]);

  const fetchWorkflows = useCallback(async () => {
    setIsLoadingWorkflows(true);
    try {
      const res = await api.get('/workflow/workflows/');
      const data = res.data.results || res.data;
      setWorkflowsList(data.filter((wf: any) => wf.is_active));
    } catch (error) {} finally { setIsLoadingWorkflows(false); }
  }, []);

  const fetchFormsList = useCallback(async () => {
    setIsLoadingForms(true);
    try {
      const res = await api.get('/forms/admin/forms/');
      setFormsList(res.data || []);
    } catch (error) {} finally { setIsLoadingForms(false); }
  }, []);

  const fetchFields = useCallback(async () => {
    if (!initialData) return;
    setIsLoadingFields(true);
    try {
      const res = await api.get(`/forms/category/${initialData.id}/?admin=true`);
      setCategoryFields(res.data.data || []);
    } catch (error) {} finally { setIsLoadingFields(false); }
  }, [initialData]);

  useEffect(() => {
    fetchFields();
    fetchWorkflows();
    fetchFormsList(); 
  }, [fetchFields, fetchWorkflows, fetchFormsList]);

  // توابع مدیریت تگ‌ها
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSaveNodeInfo = async () => {
    if (!nodeName.trim()) {
      toast.error("وارد کردن عنوان موضوع الزامی است!");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: nodeName,
        guideline: nodeGuideline,
        form_id: formId ? parseInt(formId) : null, // 🌟 ارسال آیدی فرم به بک‌اِند 🌟
        workflow: workflowId ? parseInt(workflowId as string) : null,
        tags: tags, 
      };

      let res;
      if (initialData) {
        res = await api.patch(`/knowledge/admin/nodes/${initialData.id}/`, payload);
      } else {
        res = await api.post("/knowledge/admin/nodes/", { ...payload, is_active: true, parent: parentId });
      }
      toast.success("موضوع با موفقیت ذخیره شد.");
      onSuccess(res.data); 
    } catch (error) {
      toast.error("خطا در ذخیره‌سازی اطلاعات موضوع");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateField = async (fieldId: number, dataToUpdate: { is_active?: boolean, is_required?: boolean }) => {
    if (!initialData) return;
    setCategoryFields(prev => prev.map(f => f.field_id === fieldId ? { ...f, ...dataToUpdate } : f));
    try {
      await api.patch(`/forms/admin/category/${initialData.id}/field/${fieldId}/update/`, dataToUpdate);
    } catch (error) {
      fetchFields();
    }
  };

  const handleAddCustomField = async () => {
    if (!customFieldData.label.trim() || !initialData) return;
    try {
      await api.post(`/forms/admin/category/${initialData.id}/custom-field/`, customFieldData);
      setIsAddingCustomField(false);
      setCustomFieldData({ label: "", field_type: "text", is_required: false });
      fetchFields();
    } catch (error) {}
  };

  return (
    <div className="w-full bg-surface p-8 md:p-10 rounded-3xl border border-surface-border shadow-sm relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 border-b border-surface-border pb-6 gap-4">
        <div>
          <div className={`flex items-center gap-2 mb-2 text-sm font-bold ${initialData ? 'text-amber-500 dark:text-amber-400' : 'text-primary'}`}>
            {initialData ? <Edit3 size={18} /> : <Layers size={18} />}
            {initialData ? "ویرایش اطلاعات موضوع" : (parentId ? `افزودن زیرشاخه برای: ${parentName}` : "ساخت سرشاخه جدید")}
          </div>
          <h2 className="text-2xl font-black text-foreground">
            {initialData ? "تنظیمات موضوع و اتصال‌ها" : "ایجاد موضوع جدید"}
          </h2>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button onClick={onCancel} variant="outline" className="rounded-xl border-surface-border bg-transparent text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 font-bold h-11 transition-colors">انصراف</Button>
          <Button onClick={handleSaveNodeInfo} disabled={isSaving} className={`gap-2 text-white rounded-xl px-6 h-11 font-bold shadow-md transition-all ${initialData ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-primary hover:bg-primary-hover shadow-primary/20'}`}>
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            {isSaving ? "در حال ذخیره..." : "ثبت اطلاعات موضوع"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10 relative z-10 bg-slate-50/50 dark:bg-slate-800/20 p-7 rounded-2xl border border-surface-border">
        
        <div className="space-y-3 flex flex-col items-start w-full md:col-span-2">
          <label className="text-sm font-bold text-foreground flex items-center justify-start gap-2 w-full">
            عنوان موضوع <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 border border-rose-100 dark:border-rose-900/50 rounded text-[10px]">اجباری</span>
          </label>
          <Input value={nodeName} onChange={(e) => setNodeName(e.target.value)} placeholder="مثال: قطعی اینترنت، درخواست وام..." className="bg-background border-surface-border h-12 text-foreground font-medium shadow-sm w-full" />
        </div>

        {/* 🌟 فیلد جستجودار شابلون فرم (جایگزین گروه زمد) 🌟 */}
        <div className="space-y-3 flex flex-col items-start w-full">
          <label className="text-sm font-bold text-foreground flex items-center justify-between w-full">
            شابلون فرم متصل
            <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 border border-blue-100 dark:border-blue-900/50 rounded text-[10px] flex items-center gap-1">
              <FileText size={10} /> Form
            </span>
          </label>
          
          <div className="relative w-full" ref={formDropdownRef}>
            <div 
              onClick={() => !isLoadingForms && setIsFormOpen(!isFormOpen)}
              className={`w-full h-12 px-4 bg-background border ${isFormOpen ? 'border-primary ring-2 ring-primary/10' : 'border-surface-border'} rounded-xl text-sm font-medium text-foreground outline-none flex items-center justify-between cursor-pointer transition-all shadow-sm ${isLoadingForms ? 'opacity-70' : ''}`}
            >
              <span className="truncate pr-1">
                {isLoadingForms 
                  ? "در حال بارگذاری..." 
                  : formId 
                    ? formsList.find(f => f.id.toString() === formId.toString())?.title || "فرم نامشخص"
                    : "بدون فرم متصل..."}
              </span>
              {isLoadingForms ? (
                <Loader2 size={16} className="text-muted animate-spin" />
              ) : (
                <ChevronDown size={18} className={`text-muted transition-transform duration-200 ${isFormOpen ? 'rotate-180' : 'rotate-0'}`} />
              )}
            </div>

            <AnimatePresence>
              {isFormOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}
                  className="absolute z-[100] w-full mt-2 bg-surface border border-surface-border rounded-xl shadow-xl overflow-hidden flex flex-col"
                >
                  <div className="p-3 border-b border-surface-border relative bg-slate-50/50 dark:bg-slate-800/30">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input 
                      type="text" placeholder="جستجوی نام فرم..." value={formSearchQuery} onChange={(e) => setFormSearchQuery(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg pl-3 pr-10 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted"
                    />
                  </div>
                  
                  <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-0.5">
                    <div 
                      onClick={() => { setFormId(""); setIsFormOpen(false); }}
                      className={`px-4 py-3 text-sm rounded-lg cursor-pointer transition-colors ${!formId ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground'}`}
                    >
                      بدون فرم متصل...
                    </div>
                    {filteredForms.length > 0 ? (
                      filteredForms.map(form => (
                        <div 
                          key={form.id} onClick={() => { setFormId(form.id.toString()); setIsFormOpen(false); }}
                          className={`px-4 py-3 text-sm rounded-lg cursor-pointer transition-colors ${formId === form.id.toString() ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground font-medium'}`}
                        >
                          {form.title}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted">فرمی یافت نشد.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dropdown جستجودار گردش‌کار */}
        <div className="space-y-3 flex flex-col items-start w-full">
          <label className="text-sm font-bold text-foreground flex items-center justify-between w-full">
            موتور گردش‌کار (Workflow)
            <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 border border-indigo-200 dark:border-indigo-900/50 rounded text-[10px] flex items-center gap-1">
              <Network size={10} /> اتوماسیون
            </span>
          </label>
          
          <div className="relative w-full" ref={workflowDropdownRef}>
            <div 
              onClick={() => !isLoadingWorkflows && setIsWorkflowOpen(!isWorkflowOpen)}
              className={`w-full h-12 px-4 bg-background border ${isWorkflowOpen ? 'border-primary ring-2 ring-primary/10' : 'border-surface-border'} rounded-xl text-sm font-medium text-foreground outline-none flex items-center justify-between cursor-pointer transition-all shadow-sm ${isLoadingWorkflows ? 'opacity-70' : ''}`}
            >
              <span className="truncate pr-1">
                {isLoadingWorkflows 
                  ? "در حال بارگذاری..." 
                  : workflowId 
                    ? workflowsList.find(w => w.id.toString() === workflowId.toString())?.name || "گردش‌کار نامشخص"
                    : "بدون گردش‌کار (انجام دستی)"}
              </span>
              {isLoadingWorkflows ? (
                <Loader2 size={16} className="text-muted animate-spin" />
              ) : (
                <ChevronDown size={18} className={`text-muted transition-transform duration-200 ${isWorkflowOpen ? 'rotate-180' : 'rotate-0'}`} />
              )}
            </div>

            <AnimatePresence>
              {isWorkflowOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}
                  className="absolute z-[100] w-full mt-2 bg-surface border border-surface-border rounded-xl shadow-xl overflow-hidden flex flex-col"
                >
                  <div className="p-3 border-b border-surface-border relative bg-slate-50/50 dark:bg-slate-800/30">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input 
                      type="text" placeholder="جستجوی نام گردش‌کار..." value={workflowSearchQuery} onChange={(e) => setWorkflowSearchQuery(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg pl-3 pr-10 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted"
                    />
                  </div>
                  
                  <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-0.5">
                    <div 
                      onClick={() => { setWorkflowId(""); setIsWorkflowOpen(false); }}
                      className={`px-4 py-3 text-sm rounded-lg cursor-pointer transition-colors ${!workflowId ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground'}`}
                    >
                      بدون گردش‌کار (انجام دستی)
                    </div>
                    {filteredWorkflows.length > 0 ? (
                      filteredWorkflows.map(wf => (
                        <div 
                          key={wf.id} onClick={() => { setWorkflowId(wf.id.toString()); setIsWorkflowOpen(false); }}
                          className={`px-4 py-3 text-sm rounded-lg cursor-pointer transition-colors ${workflowId?.toString() === wf.id.toString() ? 'bg-blue-50 dark:bg-blue-900/30 text-primary font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground font-medium'}`}
                        >
                          {wf.name}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted">گردش‌کاری یافت نشد.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* تگ‌های گزارش‌گیری */}
        <div className="md:col-span-2 bg-background border border-surface-border rounded-xl p-5 shadow-sm space-y-4 mt-2">
          <div>
            <label className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Tags size={18} className="text-primary"/> تگ‌های گزارش‌گیری (Tags)
              <div className="group relative flex items-center justify-center">
                <Info size={16} className="text-muted hover:text-primary cursor-pointer transition-colors" />
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-800 text-white text-[11px] font-medium p-2.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl pointer-events-none z-50">
                  از این تگ‌ها برای فیلتر، دسته‌بندی و گزارش‌گیری تیکت‌ها استفاده می‌شود.
                  <div className="absolute -bottom-1 right-2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              </div>
            </label>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  value={tagInput} onChange={e => setTagInput(e.target.value)} 
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  placeholder="تایپ کنید و Enter بزنید (مثال: مشکل_فنی، VIP)" 
                  className="bg-surface border-surface-border text-foreground w-full h-11 rounded-lg pl-16 pr-3" 
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted font-mono bg-background px-1.5 py-0.5 rounded border border-surface-border pointer-events-none hidden sm:inline-block">Enter ↵</span>
              </div>
              <button type="button" onClick={handleAddTag} className="bg-blue-50 dark:bg-blue-900/30 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/50 px-6 rounded-lg text-sm font-bold transition-colors border border-blue-100 dark:border-blue-800 shrink-0">
                افزودن تگ
              </button>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-surface-border">
              {tags.map((tag, idx) => (
                <span key={idx} className="flex items-center gap-1.5 bg-surface text-foreground px-3 py-1.5 rounded-md text-sm font-bold border border-surface-border shadow-sm">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="text-muted hover:text-rose-500 transition-colors"><X size={14} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 flex flex-col items-start w-full md:col-span-2 pt-4 border-t border-surface-border">
          <label className="text-sm font-bold text-foreground flex items-center justify-start gap-2 w-full">راهنما و دستورالعمل اجرایی (اختیاری)</label>
          <Input value={nodeGuideline} onChange={(e) => setNodeGuideline(e.target.value)} placeholder="توضیحاتی که کارشناس باید هنگام ثبت تیکت ببیند..." className="bg-background border-surface-border h-12 text-foreground font-medium shadow-sm w-full" />
        </div>
      </div>

      {initialData && (
        <div className="w-full relative z-10 border border-surface-border rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/10">
          <div className="p-5 border-b border-surface-border bg-slate-100/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings2 size={20} className="text-primary" />
              <h3 className="font-bold text-foreground text-lg">مدیریت فیلدهای فرمِ متصل شده</h3>
            </div>
          </div>
          
          <div className="p-6">
            {isLoadingFields ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted" /></div>
            ) : categoryFields.length === 0 ? (
              <div className="text-center py-10 text-muted font-medium flex flex-col items-center gap-3">
                <AlertCircle size={32} className="opacity-20" />
                هیچ فرمی به این دسته متصل نیست.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {categoryFields.map(field => {
                  const isActive = field.is_active !== false;
                  const isRequired = field.required; 
                  return (
                    <div key={field.field_id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isActive ? 'bg-surface border-surface-border shadow-sm hover:border-primary/50' : 'bg-slate-100/50 dark:bg-slate-800/30 border-surface-border opacity-60'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-primary' : 'bg-slate-200 dark:bg-slate-800 text-muted'}`}>
                          <FileText size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${isActive ? 'text-foreground' : 'text-muted line-through'}`}>{field.label}</span>
                          <span className="text-[11px] text-muted font-medium mt-0.5 uppercase tracking-wider">نوع فیلد: {field.field_type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleUpdateField(field.field_id, { is_required: !isRequired })} disabled={!isActive} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${!isActive ? 'bg-slate-50 dark:bg-slate-800/50 text-muted border-surface-border cursor-not-allowed' : isRequired ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100' : 'bg-background text-foreground border-surface-border hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          {isRequired ? "اجباری *" : "اختیاری"}
                        </button>
                        <div className="w-px h-6 bg-surface-border"></div>
                        <button onClick={() => handleUpdateField(field.field_id, { is_active: !isActive })} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors w-24 justify-center ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600 border border-transparent'}`}>
                          {isActive ? <><ToggleRight size={16} /> فعال</> : <><ToggleLeft size={16} /> غیرفعال</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {categoryFields.length > 0 && (
              <div className="mt-8 pt-6 border-t border-surface-border">
                {!isAddingCustomField ? (
                  <button onClick={() => setIsAddingCustomField(true)} className="flex items-center gap-2 text-sm font-bold text-primary bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-4 py-2.5 rounded-xl transition-colors">
                    <Plus size={16} strokeWidth={2.5} /> افزودن فیلد اختصاصی به این موضوع
                  </button>
                ) : (
                  <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                      <Plus size={16} className="text-primary" /> ایجاد فیلد اختصاصی
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-bold text-muted mb-1 block">عنوان (سوال)</label>
                        <Input value={customFieldData.label} onChange={e => setCustomFieldData({...customFieldData, label: e.target.value})} placeholder="مثال: شماره شبا" className="bg-background border-surface-border text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted mb-1 block">نوع فیلد</label>
                        <select value={customFieldData.field_type} onChange={e => setCustomFieldData({...customFieldData, field_type: e.target.value})} className="w-full h-10 px-3 bg-background border border-surface-border rounded-md text-sm outline-none focus:border-primary text-foreground">
                          {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end pb-1">
                        <div className="flex items-center gap-2 bg-background p-2.5 border border-surface-border rounded-lg w-full">
                          <input type="checkbox" checked={customFieldData.is_required} onChange={e => setCustomFieldData({...customFieldData, is_required: e.target.checked})} className="w-4 h-4 accent-primary" />
                          <span className="text-xs font-bold text-foreground">پاسخ اجباری است</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddCustomField} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg px-6 h-9">ثبت فیلد</Button>
                      <Button onClick={() => setIsAddingCustomField(false)} variant="outline" className="text-foreground border-surface-border hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold rounded-lg px-6 h-9">انصراف</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}