"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, MoreVertical, Folder, FolderOpen, FileText, 
  ChevronLeft, Info, CheckCircle, Eye, FileQuestion, Layers, Network,
  Edit, Trash2, X, Link as LinkIcon, Loader2, Tags // 🌟 Tags اضافه شد
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TreeNode } from "@/components/knowledge-domain/types";
import { DynamicFormBuilder } from "@/components/knowledge-domain/DynamicFormBuilder";

// 🌟 ایمپورت پکیج‌های هشدار و تاییدیه 🌟
import { toast } from 'sonner';
import { confirmAlert } from '@/lib/swal';

// --- کامپوننت بازگشتی درخت ---
const TreeItem = ({ 
  node, level = 0, selectedId, onSelect, onAddChild, onEdit, onDelete, searchQuery 
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  useEffect(() => {
    if (searchQuery && hasChildren) setIsOpen(true);
    else if (!searchQuery && level === 0) setIsOpen(false);
  }, [searchQuery, hasChildren, level]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleClick = () => {
    if (hasChildren) setIsOpen(!isOpen);
    onSelect(node);
  };

  return (
    <div className={`w-full text-right relative ${showMenu ? "z-[100]" : ""}`}>
      <motion.div 
        className={`group relative flex items-center justify-between p-2.5 w-full transition-all duration-300 rounded-xl cursor-pointer ${
          isSelected 
            ? "bg-primary text-white shadow-md shadow-blue-600/20" 
            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground bg-transparent"
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden z-10">
          <div className={`flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? "-rotate-90" : "rotate-0"} ${isSelected ? "text-blue-200" : "text-muted group-hover:text-foreground"}`}>
            {hasChildren ? <ChevronLeft size={16} strokeWidth={2.5} /> : <span className="w-4" />}
          </div>

          <div className={`shrink-0 transition-transform ${isSelected ? "text-white" : "text-muted group-hover:text-primary"}`}>
            {hasChildren 
              ? (isOpen ? <FolderOpen size={20} className={isSelected ? "fill-blue-500/30" : "fill-blue-500/10 dark:fill-blue-500/20"} /> : <Folder size={20} className={isSelected ? "fill-blue-500/30" : "fill-slate-100 dark:fill-slate-800 group-hover:fill-blue-50 dark:group-hover:fill-blue-950/30"} />) 
              : <FileText size={18} className={isSelected ? "fill-blue-500/30" : ""} />
            }
          </div>
          
          <span className="truncate flex-1 text-sm font-medium pt-0.5">{node.name}</span>
        </div>

        <div className={`transition-opacity flex items-center gap-1 shrink-0 relative z-20 ${showMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${isSelected ? "text-blue-100" : "text-muted"}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddChild(node); }}
            className={`p-1.5 rounded-lg transition-colors ${isSelected ? "hover:bg-primary-hover hover:text-white" : "hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30"}`}
            title="افزودن زیرشاخه"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowMenu(!showMenu); 
              }}
              className={`p-1.5 rounded-lg transition-colors ${showMenu && !isSelected ? "bg-slate-200 dark:bg-slate-700 text-foreground" : ""} ${isSelected ? "hover:bg-primary-hover hover:text-white" : "hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700"}`}
            >
              <MoreVertical size={16} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  className="absolute left-0 top-full mt-2 w-36 bg-surface border border-surface-border shadow-2xl rounded-xl overflow-hidden z-[100] flex flex-col origin-top-left"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(node); }}
                    className="w-full text-right px-4 py-3 text-sm font-bold text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Edit size={14} className="text-primary" /> ویرایش
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(node); }}
                    className="w-full text-right px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-2 border-t border-surface-border"
                  >
                    <Trash2 size={14} /> حذف
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: "hidden" }} 
            animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }} 
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            className="w-full relative"
          >
            <div className="relative flex flex-col pr-6 mr-4 mt-1 mb-2 space-y-1">
              <div className="absolute right-0 top-0 bottom-4 w-[2px] bg-surface-border rounded-full" />
              
              {node.children!.map((child: any) => (
                <div key={child.id} className="relative">
                  <div className="absolute right-0 top-[20px] w-6 h-[2px] bg-surface-border rounded-full z-0" />
                  <div className="relative"> 
                    <TreeItem 
                      node={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} 
                      onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} searchQuery={searchQuery}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- کامپوننت اصلی صفحه ---
export default function KnowledgeViewerPage() {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [panelMode, setPanelMode] = useState<"view" | "create" | "edit">("view");
  const [creatingParent, setCreatingParent] = useState<{ id: number | null, name: string } | null>(null);
  const [editingNode, setEditingNode] = useState<TreeNode | null>(null);

  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [attachSearchQuery, setAttachSearchQuery] = useState(""); 
  const [isLoadingAvailableForms, setIsLoadingAvailableForms] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [selectedFormToAttach, setSelectedFormToAttach] = useState<number | null>(null);

  const filteredTree = useMemo(() => {
    if (!searchQuery) return treeData;
    const lowerQuery = searchQuery.toLowerCase();

    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce<TreeNode[]>((acc, node) => {
        const isMatch = node.name.toLowerCase().includes(lowerQuery);
        let filteredChildren: TreeNode[] = [];
        if (node.children && node.children.length > 0) {
          filteredChildren = filterNodes(node.children);
        }
        if (isMatch || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : (isMatch ? node.children : []) });
        }
        return acc;
      }, []);
    };
    return filterNodes(treeData);
  }, [treeData, searchQuery]);

  const filteredAvailableForms = useMemo(() => {
    if (!attachSearchQuery.trim()) return availableForms;
    return availableForms.filter(form => form.title.includes(attachSearchQuery));
  }, [availableForms, attachSearchQuery]);

  const fetchTree = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await api.get("/knowledge/tree/", { headers: { Authorization: `Bearer ${token}` } });
      setTreeData(res.data.data);
    } catch (error) {
      toast.error("خطا در بارگذاری ساختار درختی موضوعات.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategoryForm = useCallback(async () => {
    if (!selectedNode || panelMode !== "view") {
      setDynamicFields([]);
      return;
    }
    
    setIsLoadingFields(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await api.get(`/forms/category/${selectedNode.id}/`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setDynamicFields(res.data.data || []);
    } catch (error) {
      console.error("Error fetching category form:", error);
      setDynamicFields([]);
    } finally {
      setIsLoadingFields(false);
    }
  }, [selectedNode, panelMode]);

  useEffect(() => {
    fetchCategoryForm();
  }, [fetchCategoryForm]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const handleOpenAttachModal = async () => {
    setIsAttachModalOpen(true);
    setAttachSearchQuery(""); 
    setIsLoadingAvailableForms(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await api.get('/forms/admin/forms/', { headers: { Authorization: `Bearer ${token}` } });
      setAvailableForms(res.data);
    } catch (error) {
      toast.error("خطا در دریافت لیست فرم‌های سیستم.");
    } finally {
      setIsLoadingAvailableForms(false);
    }
  };

  const handleCloseAttachModal = () => {
    setIsAttachModalOpen(false);
    setAttachSearchQuery("");
    setSelectedFormToAttach(null);
  };

  const handleAttachForm = async () => {
    if (!selectedNode || !selectedFormToAttach) return;
    setIsAttaching(true);
    try {
      const token = localStorage.getItem("access_token");
      await api.post(`/forms/admin/category/${selectedNode.id}/apply-form/${selectedFormToAttach}/`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      toast.success("قالب فرم با موفقیت به این موضوع متصل شد.");
      handleCloseAttachModal();
      fetchCategoryForm();
    } catch (error) {
      toast.error("خطا در اتصال فرم. لطفاً مجدداً تلاش کنید.");
    } finally {
      setIsAttaching(false);
    }
  };

  const handleCreateRoot = () => {
    setCreatingParent({ id: null, name: "دسته اصلی" });
    setPanelMode("create");
    setSelectedNode(null); 
  };

  const handleCreateChild = (parentNode: TreeNode) => {
    setCreatingParent({ id: parentNode.id, name: parentNode.name });
    setPanelMode("create");
    setSelectedNode(parentNode); 
  };

  const handleEditNode = (node: TreeNode) => {
    setEditingNode(node);
    setPanelMode("edit");
    setSelectedNode(node);
  };

  const handleDeleteNode = async (node: TreeNode) => {
    const result = await confirmAlert(
      "حذف موضوع",
      `آیا از حذف موضوع "${node.name}" مطمئن هستید؟ تمام زیرشاخه‌ها نیز حذف خواهند شد!`,
      "بله، حذف کن",
      "انصراف",
      true
    );

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("access_token");
      await api.delete(`/knowledge/admin/nodes/${node.id}/`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("موضوع و زیرمجموعه‌های آن با موفقیت حذف شدند.");
      fetchTree();
      if (selectedNode?.id === node.id) setSelectedNode(null);
    } catch (error) {
      toast.error("خطا در حذف موضوع سیستم.");
    }
  };

  const handleSuccessSave = (newNode: TreeNode) => {
    fetchTree(); 
    setPanelMode("view"); 
    setSelectedNode(newNode); 
  };

  const handleViewNode = (node: TreeNode) => {
    setSelectedNode(node);
    setPanelMode("view"); 
  };

  return (
    <div className="w-full min-h-screen bg-background p-6 md:p-10 flex flex-col gap-8 animate-in fade-in duration-500 text-right dir-rtl" dir="rtl">
      
      <div className="w-full flex flex-col items-start">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-full text-sm font-bold mb-4">
          <Layers size={18} /> سیستم مدیریت دانش
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">نمایشگر درخت موضوعات</h1>
        <p className="text-muted mt-2 text-base">ساختار موضوعات را مرور کنید و فرم‌های ثبت شده را مدیریت نمایید.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        
        {/* درخت موضوعات (کارت سمت راست) */}
        <div className="w-full xl:w-[420px] shrink-0 bg-surface p-6 rounded-3xl border border-surface-border shadow-sm min-h-[500px] max-h-[750px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <FolderOpen size={22} className="text-primary" /> ساختار درختی
            </h3>
            <button onClick={handleCreateRoot} className="flex items-center gap-1.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded-xl transition-all shadow-sm shadow-primary/20">
              <Plus size={16} strokeWidth={2.5} /> سرشاخه
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="جستجوی موضوع..." className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-surface-border text-foreground text-sm font-medium rounded-2xl pr-12 pl-4 py-3.5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted" />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pl-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="text-sm font-medium text-muted">در حال بارگذاری ساختار...</div>
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted gap-3">
                <Search size={32} className="opacity-20" />
                <span className="text-sm">هیچ نتیجه‌ای یافت نشد.</span>
              </div>
            ) : (
              <div className="space-y-1.5 w-full pb-4">
                {filteredTree.map((node) => (
                  <TreeItem 
                    key={node.id} node={node} selectedId={selectedNode?.id || null}
                    onSelect={handleViewNode} onAddChild={handleCreateChild} 
                    onEdit={handleEditNode} onDelete={handleDeleteNode}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* جزئیات و مدیریت گره (کارت سمت چپ) */}
        <div className="flex-1 w-full min-w-0">
          
          {panelMode === "create" && creatingParent ? (
            <DynamicFormBuilder key={`create-${creatingParent.id}`} parentId={creatingParent.id} parentName={creatingParent.name} onSuccess={handleSuccessSave} onCancel={() => setPanelMode("view")} />
          ) : panelMode === "edit" && editingNode ? (
            <DynamicFormBuilder key={`edit-${editingNode.id}`} parentId={null} initialData={editingNode} onSuccess={handleSuccessSave} onCancel={() => setPanelMode("view")} />
          ) : (
            <AnimatePresence mode="wait">
              {!selectedNode ? (
                <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full bg-surface border-2 border-dashed border-surface-border rounded-3xl h-[500px] flex flex-col items-center justify-center text-muted gap-5">
                  <div className="p-8 bg-background rounded-full"><FileQuestion size={56} className="text-slate-300 dark:text-slate-600" strokeWidth={1.5} /></div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-foreground mb-1">هیچ موضوعی انتخاب نشده است</p>
                    <p className="text-sm text-muted">برای مشاهده جزئیات و فرم‌ها، یک آیتم از درخت سمت راست انتخاب کنید.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="content" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="w-full bg-surface p-8 md:p-10 rounded-3xl border border-surface-border shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50/80 dark:from-blue-900/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

                  <div className="pb-6 w-full text-right relative z-10">
                    <span className="inline-block px-3 py-1 bg-background text-muted rounded-lg text-xs font-bold mb-4 border border-surface-border">شناسه موضوع: {selectedNode.id}</span>
                    <h2 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{selectedNode.name}</h2>

                    {/* 🌟 بخش جدید: نمایش تگ‌های گزارش‌گیری 🌟 */}
                    {selectedNode.tags && selectedNode.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Tags size={16} className="text-muted mr-1" />
                        {selectedNode.tags.map((tag: string, i: number) => (
                          <span key={i} className="inline-flex items-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-bold border border-surface-border shadow-sm">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {selectedNode.workflow && (
                      <div className="mt-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold">
                          <Network size={14} /> گردش‌کار متصل: {selectedNode.workflow_name || `آیدی: ${selectedNode.workflow}`}
                        </span>
                      </div>
                    )}
                    
                    {selectedNode.guideline && (
                      <div className="mt-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 border-r-4 border-r-amber-500 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                        <h4 className="text-amber-800 dark:text-amber-400 font-bold flex items-center gap-2 text-lg">
                          <Info size={22} className="text-amber-600" /> راهنما و دستورالعمل اجرایی:
                        </h4>
                        <p className="text-foreground text-base leading-loose font-medium whitespace-pre-wrap text-justify">
                          {selectedNode.guideline}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="w-full relative z-10 mt-6">
                    <div className="flex items-center justify-between mb-8 pb-5 border-b border-surface-border">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2.5">
                        <CheckCircle size={20} className="text-emerald-500 ml-2" /> فیلدهای مورد نیاز فرم
                      </h3>
                      
                      <button 
                        onClick={handleOpenAttachModal}
                        className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/40 px-4 py-2 rounded-xl text-sm font-bold border border-blue-200/50 dark:border-blue-800 transition-colors"
                      >
                        <Plus size={16} /> اتصال فرم جدید
                      </button>
                    </div>
                    
                    {isLoadingFields ? (
                      <div className="flex flex-col items-center justify-center p-12 text-muted gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm font-medium">در حال دریافت فرم...</span>
                      </div>
                    ) : dynamicFields.length === 0 ? (
                      <div className="text-muted font-medium bg-slate-50 dark:bg-slate-800/30 border border-surface-border p-12 rounded-3xl text-center w-full flex flex-col items-center gap-4">
                        <div className="p-4 bg-surface rounded-full shadow-sm border border-surface-border"><FileText size={28} className="text-slate-300 dark:text-slate-600" /></div>
                        این موضوع فرمی برای دریافت اطلاعات ندارد.
                      </div>
                    ) : (
                      <div className="space-y-6 w-full max-w-3xl select-none">
                        {dynamicFields.map((field) => (
                          <div key={field.field_id} className="flex flex-col gap-4 w-full bg-surface p-6 rounded-2xl border border-surface-border shadow-[0_2px_10px_rgb(0,0,0,0.01)] transition-all">
                            
                            <label className="text-sm font-bold text-foreground flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span>{field.label}</span>
                                {field.required && (
                                  <span className="text-rose-500 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50 px-2 py-0.5 rounded text-[11px] font-black">اجباری</span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted bg-background px-2 py-1 rounded-md border border-surface-border uppercase tracking-wider">
                                {field.field_type}
                              </span>
                            </label>
                            
                            <div className="mt-1">
                              {(field.field_type === "text" || field.field_type === "int" || field.field_type === "float" || field.field_type === "date") && (
                                <Input readOnly placeholder={`پیش‌نمایش فیلد ${field.field_type}...`} className="bg-background border-surface-border h-12 px-4 w-full text-foreground placeholder:text-muted font-medium rounded-xl cursor-default" />
                              )}

                              {field.field_type === "textarea" && (
                                <textarea 
                                  readOnly rows={3} placeholder="پیش‌نمایش متن طولانی..."
                                  className="w-full rounded-xl border border-surface-border bg-background px-4 py-4 text-sm text-foreground placeholder:text-muted font-medium focus:outline-none resize-none cursor-default"
                                />
                              )}

                              {field.field_type === "select" && (
                                <select className="flex h-12 w-full rounded-xl border border-surface-border bg-background px-4 py-2 text-sm text-foreground font-medium cursor-pointer">
                                  <option value="">انتخاب گزینه‌ها...</option>
                                  {field.options && field.options.split(",").map((opt: string, i: number) => (
                                    <option key={i} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}

                              {field.field_type === "multiselect" && (
                                <div className="flex flex-col gap-3 p-4 bg-background border border-surface-border rounded-xl">
                                  <span className="text-xs text-muted font-bold mb-1">می‌توانید چند گزینه انتخاب کنید:</span>
                                  {field.options && field.options.split(",").map((opt: string, i: number) => (
                                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                      <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-surface cursor-pointer accent-primary" 
                                      />
                                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              )}

                              {field.field_type === "bool" && (
                                <div className="flex items-center gap-3 mt-1 w-full p-2 cursor-pointer">
                                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-surface cursor-pointer accent-primary" />
                                  <span className="text-sm font-medium text-muted">کاربر باید این مورد را تایید کند</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* مودال اتصال فرم (بدون تغییر) */}
      <AnimatePresence>
        {isAttachModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={handleCloseAttachModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-md bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-surface-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-black text-foreground flex items-center gap-2">
                  <LinkIcon className="text-primary" size={20} /> اتصال فرم به این موضوع
                </h3>
                <button onClick={handleCloseAttachModal} className="p-1.5 text-muted hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-foreground rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <p className="text-sm font-medium text-muted">یکی از شابلون‌های فرم که قبلاً در بخش تنظیمات ساخته‌اید را انتخاب کنید:</p>
                
                <div className="relative mb-2">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
                  <input 
                    type="text" 
                    value={attachSearchQuery} 
                    onChange={(e) => setAttachSearchQuery(e.target.value)} 
                    placeholder="جستجوی نام فرم..." 
                    className="w-full bg-background border border-surface-border text-foreground text-sm font-medium rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted" 
                  />
                </div>

                {isLoadingAvailableForms ? (
                  <div className="flex justify-center p-6"><Loader2 className="animate-spin text-primary" /></div>
                ) : filteredAvailableForms.length === 0 ? (
                  <div className="text-center p-6 bg-background rounded-xl border border-dashed border-surface-border text-muted text-sm">
                    {attachSearchQuery ? "فرمی با این نام یافت نشد." : "هیچ فرمی در سیستم ثبت نشده است."}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                    {filteredAvailableForms.map((form) => (
                      <button
                        key={form.id}
                        onClick={() => setSelectedFormToAttach(form.id)}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all border text-right ${
                          selectedFormToAttach === form.id 
                            ? "bg-blue-50 dark:bg-blue-900/20 border-primary" 
                            : "bg-surface border-surface-border hover:border-primary/50 hover:bg-background"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={18} className={selectedFormToAttach === form.id ? "text-primary" : "text-muted"} />
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${selectedFormToAttach === form.id ? "text-primary dark:text-blue-400" : "text-foreground"}`}>{form.title}</span>
                            <span className="text-[11px] text-muted font-medium mt-0.5">{form.fields?.length || 0} فیلد</span>
                          </div>
                        </div>
                        {selectedFormToAttach === form.id && <CheckCircle size={18} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-surface-border bg-slate-50/50 dark:bg-slate-800/30 flex gap-3">
                <button 
                  onClick={handleAttachForm} 
                  disabled={!selectedFormToAttach || isAttaching}
                  className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isAttaching ? <Loader2 size={18} className="animate-spin" /> : "تایید و اتصال فرم"}
                </button>
                <button onClick={handleCloseAttachModal} className="px-6 bg-surface border border-surface-border text-muted font-bold py-3 rounded-xl hover:bg-background transition-colors">لغو</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}