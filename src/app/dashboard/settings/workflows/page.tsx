"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Network, Plus, ChevronLeft, Loader2, Save, 
  GitMerge, ArrowRight, Trash2, Waypoints, Search, Check, X, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import WorkflowCanvas from "@/components/WorkflowCanvas";
import { Input } from "@/components/ui/input";

// 🌟 ایمپورت پکیج‌های هشدار و تاییدیه 🌟
import { toast } from 'sonner';
import { confirmAlert } from '@/lib/swal';

export default function WorkflowsBuilderPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [actionsDefinition, setActionsDefinition] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepData, setNewStepData] = useState({ title: "", action_id: "" });

  const [editingStep, setEditingStep] = useState<any | null>(null);
  const [stepConfig, setStepConfig] = useState<any>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [routingStep, setRoutingStep] = useState<any | null>(null);
  const [localRoutes, setLocalRoutes] = useState<Record<string, string>>({});
  const [isSavingRoutes, setIsSavingRoutes] = useState(false);

  const [teams, setTeams] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const fetchWorkflowsAndActions = async () => {
    setIsLoadingWorkflows(true);
    try {
      const [actionsRes, workflowsRes, teamsRes, usersRes] = await Promise.all([
        api.get("/workflow/actions/"),
        api.get("/workflow/workflows/"),
        api.get("/accounts/teams/"),
        api.get("/accounts/users/") 
      ]);

      setActionsDefinition(actionsRes.data.results || actionsRes.data);
      setWorkflows(workflowsRes.data.results || workflowsRes.data);
      setTeams(teamsRes.data.results || teamsRes.data);
      setSystemUsers(usersRes.data.results || usersRes.data); 

      if (selectedWorkflow) {
        const updatedDetail = await api.get(`/workflow/workflows/${selectedWorkflow.id}/`);
        setSelectedWorkflow(updatedDetail.data);
      }
    } catch (error) {
      toast.error("خطا در دریافت اطلاعات. لطفاً اتصال خود را بررسی کنید.");
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  useEffect(() => {
    fetchWorkflowsAndActions();
  }, []);

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) {
      toast.warning("لطفاً نام گردش‌کار را وارد کنید.");
      return;
    }
    try {
      await api.post("/workflow/workflows/", { name: newWorkflowName, is_active: true });
      setNewWorkflowName("");
      setIsCreatingWorkflow(false);
      toast.success("گردش‌کار جدید با موفقیت ساخته شد.");
      fetchWorkflowsAndActions();
    } catch (error) {
      toast.error("خطا در ساخت گردش‌کار جدید.");
    }
  };

  const handleSelectWorkflow = async (wf: any) => {
    setIsLoadingWorkflows(true);
    try {
      const detailRes = await api.get(`/workflow/workflows/${wf.id}/`);
      setSelectedWorkflow(detailRes.data);
    } catch (error) {
      toast.error("خطا در دریافت جزئیات گردش‌کار.");
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  const handleAddStep = async () => {
    if (!newStepData.title.trim() || !newStepData.action_id || !selectedWorkflow) {
      toast.warning("لطفاً عنوان مرحله و نوع اکشن را انتخاب کنید.");
      return;
    }
    try {
      await api.post("/workflow/steps/", {
        workflow: selectedWorkflow.id,
        action: newStepData.action_id,
        title: newStepData.title,
        is_start_node: selectedWorkflow.steps?.length === 0,
        config: {} 
      });
      setIsAddingStep(false);
      setNewStepData({ title: "", action_id: "" });
      toast.success("مرحله جدید با موفقیت اضافه شد.");
      handleSelectWorkflow(selectedWorkflow);
    } catch (error) {
      toast.error("خطا در افزودن مرحله جدید.");
    }
  };

  const handleSaveConfig = async () => {
    if (!editingStep) return;
    setIsSavingConfig(true);
    try {
      await api.patch(`/workflow/steps/${editingStep.id}/`, { config: stepConfig });
      setEditingStep(null);
      toast.success("تنظیمات گره با موفقیت ذخیره شد.");
      handleSelectWorkflow(selectedWorkflow);
    } catch (error) {
      toast.error("خطا در ذخیره تنظیمات گره.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleAddChoice = () => {
    const currentChoices = stepConfig.choices || [];
    const newChoiceId = `opt_${Math.random().toString(36).substring(2, 6)}`;
    setStepConfig({ ...stepConfig, choices: [...currentChoices, { id: newChoiceId, label: "" }] });
  };

  const handleChoiceChange = (id: string, newLabel: string) => {
    const updatedChoices = stepConfig.choices.map((c: any) => c.id === id ? { ...c, label: newLabel } : c);
    setStepConfig({ ...stepConfig, choices: updatedChoices });
  };

  const handleRemoveChoice = (id: string) => {
    const updatedChoices = stepConfig.choices.filter((c: any) => c.id !== id);
    setStepConfig({ ...stepConfig, choices: updatedChoices });
  };

  const handleTargetGroupChange = (teamName: string) => {
    const selectedTeam = teams.find(t => t.name === teamName);
    let autoAllowedUsers = [...(stepConfig.allowed_users || [])];

    if (selectedTeam && selectedTeam.members) {
      const teamMemberIds = selectedTeam.members.map((m: any) => m.id ? m.id : m);
      autoAllowedUsers = Array.from(new Set([...autoAllowedUsers, ...teamMemberIds]));
    }

    setStepConfig({ 
      ...stepConfig, 
      target_group: teamName,
      allowed_users: autoAllowedUsers 
    });
  };

  const openRoutingModal = (step: any) => {
    const initialRoutes: Record<string, string> = {};
    const existingRoutes = selectedWorkflow.routes?.filter((r: any) => r.from_step === step.id) || [];
    
    existingRoutes.forEach((r: any) => {
      const key = r.condition_value || 'default';
      initialRoutes[key] = r.to_step.toString();
    });

    setLocalRoutes(initialRoutes);
    setRoutingStep(step);
  };

  const handleSaveRoutes = async () => {
    if (!routingStep) return;
    setIsSavingRoutes(true);
    try {
      const oldRoutes = selectedWorkflow.routes?.filter((r: any) => r.from_step === routingStep.id) || [];
      for (const r of oldRoutes) {
        await api.delete(`/workflow/routes/${r.id}/`);
      }

      const promises = [];
      const hasChoices = routingStep.action_detail?.has_choices;

      if (hasChoices && routingStep.config?.choices) {
        for (const choice of routingStep.config.choices) {
          const toStepId = localRoutes[choice.id];
          if (toStepId) {
            promises.push(api.post('/workflow/routes/', {
              workflow: selectedWorkflow.id,
              from_step: routingStep.id,
              to_step: parseInt(toStepId),
              condition_value: choice.id
            }));
          }
        }
      } else {
        const toStepId = localRoutes['default'];
        if (toStepId) {
          promises.push(api.post('/workflow/routes/', {
            workflow: selectedWorkflow.id,
            from_step: routingStep.id,
            to_step: parseInt(toStepId),
            condition_value: ""
          }));
        }
      }

      await Promise.all(promises);
      setRoutingStep(null);
      toast.success("مسیرهای خروجی با موفقیت ذخیره شدند.");
      handleSelectWorkflow(selectedWorkflow);
    } catch (error) {
      toast.error("خطا در ذخیره مسیرها.");
    } finally {
      setIsSavingRoutes(false);
    }
  };

  const handleNodeDragStop = async (stepData: any, newPosition: {x: number, y: number}) => {
    try {
      const currentConfig = stepData.config || {};
      const newConfig = { ...currentConfig, position: newPosition };
      await api.patch(`/workflow/steps/${stepData.id}/`, { config: newConfig });
    } catch (error) {
      toast.error("خطا در ذخیره موقعیت جدید گره.");
    }
  };

  const handleEdgeCreateFromCanvas = async (sourceId: string, targetId: string, handleId: string) => {
    try {
      const existingRoute = selectedWorkflow.routes?.find(
        (r: any) => r.from_step.toString() === sourceId && (r.condition_value === handleId || (!r.condition_value && handleId === 'default'))
      );
      
      if (existingRoute) {
        await api.delete(`/workflow/routes/${existingRoute.id}/`);
      }

      await api.post('/workflow/routes/', {
        workflow: selectedWorkflow.id,
        from_step: parseInt(sourceId),
        to_step: parseInt(targetId),
        condition_value: handleId === 'default' ? "" : handleId
      });

      handleSelectWorkflow(selectedWorkflow);
    } catch (error) {
      toast.error("خطا در ذخیره مسیر. لطفاً دوباره تلاش کنید.");
      handleSelectWorkflow(selectedWorkflow);
    }
  };

  const handleDeleteStep = async () => {
    if (!editingStep) return;
    
    const result = await confirmAlert(
      "حذف گره",
      "آیا از حذف این گره و تمام مسیرهای متصل به آن اطمینان دارید؟",
      "بله، حذف کن",
      "انصراف",
      true
    );

    if (!result.isConfirmed) return;
    
    try {
      await api.delete(`/workflow/steps/${editingStep.id}/`);
      setEditingStep(null);
      toast.success("گره با موفقیت حذف شد.");
      handleSelectWorkflow(selectedWorkflow);
    } catch (error) {
      toast.error("خطا در حذف گره.");
    }
  };

  const handleEdgeDeleteFromCanvas = async (routeId: string) => {
    try {
      await api.delete(`/workflow/routes/${routeId}/`);
      handleSelectWorkflow(selectedWorkflow);
    } catch (error) {
      toast.error("خطا در حذف مسیر.");
    }
  };

  const currentSelectedTeam = teams.find(t => t.name === stepConfig.target_group);

  const filteredUsers = systemUsers
    .filter(user => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
      const query = userSearchQuery.toLowerCase();
      return fullName.includes(query) || (user.username && user.username.toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const aChecked = (stepConfig.allowed_users || []).includes(a.id);
      const bChecked = (stepConfig.allowed_users || []).includes(b.id);
      if (aChecked && !bChecked) return -1;
      if (!aChecked && bChecked) return 1;
      return 0;
    });

  return (
    <div className="w-full min-h-screen bg-background p-6 md:p-10 flex flex-col gap-8 animate-in fade-in duration-500 text-right dir-rtl" dir="rtl">
      
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex flex-col items-start gap-2">
          <Link href="/dashboard/settings" className="flex items-center gap-2 text-muted hover:text-primary transition-colors text-sm font-bold bg-surface px-4 py-2 rounded-xl border border-surface-border shadow-sm">
            <ArrowRight size={16} /> بازگشت به تنظیمات
          </Link>
          <h1 className="text-3xl font-black text-foreground tracking-tight mt-4 flex items-center gap-3">
            <Network className="text-primary" size={32} /> موتور گردش‌کار (Workflow Engine)
          </h1>
        </div>
      </div>

      <div className="flex-1 w-full bg-surface p-6 md:p-8 rounded-[2rem] border border-surface-border shadow-sm min-h-[600px] flex flex-col md:flex-row gap-8">
        
        {/* ======================= SIDEBAR ======================= */}
        <div className="w-full md:w-[350px] flex flex-col border-l border-surface-border pl-6 shrink-0 h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-foreground">نقشه‌های فرآیند</h2>
            <button onClick={() => setIsCreatingWorkflow(true)} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"><Plus size={18} strokeWidth={2.5} /></button>
          </div>

          <AnimatePresence>
            {isCreatingWorkflow && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-surface-border overflow-hidden">
                <label className="text-xs font-bold text-muted mb-2 block">نام گردش‌کار جدید</label>
                <Input value={newWorkflowName} onChange={e => setNewWorkflowName(e.target.value)} placeholder="مثلاً: SL_BLOCKCHAIN" className="bg-surface border-surface-border text-foreground mb-3" />
                <div className="flex gap-2">
                  <button onClick={handleCreateWorkflow} className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-hover transition">ذخیره</button>
                  <button onClick={() => setIsCreatingWorkflow(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition">لغو</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {isLoadingWorkflows ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted" /></div>
            ) : workflows.length === 0 ? (
              <div className="text-center text-muted text-sm font-medium py-8">هنوز گردش‌کاری ساخته نشده است.</div>
            ) : (
              workflows.map((wf) => (
                <button
                  key={wf.id} onClick={() => handleSelectWorkflow(wf)}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                    selectedWorkflow?.id === wf.id ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 shadow-sm" : "border-surface-border bg-surface hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Network size={18} className={selectedWorkflow?.id === wf.id ? "text-primary" : "text-muted"} />
                    <span className={`text-sm font-bold ${selectedWorkflow?.id === wf.id ? "text-primary dark:text-blue-400" : "text-foreground"}`}>{wf.name}</span>
                  </div>
                  <ChevronLeft size={16} className={selectedWorkflow?.id === wf.id ? "text-primary dark:text-blue-400" : "text-muted"} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* ======================= MAIN CANVAS ======================= */}
        <div className="flex-1 w-full flex flex-col h-full overflow-hidden">
          {!selectedWorkflow ? (
            <div className="h-full flex flex-col items-center justify-center text-muted gap-4 opacity-50">
              <Network size={64} strokeWidth={1} />
              <p className="font-medium text-lg">برای ویرایش گره‌ها و مراحل، یک گردش‌کار انتخاب کنید.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
              
              <div className="flex items-center justify-between border-b border-surface-border pb-5 mb-6 sticky top-0 bg-surface z-10">
                <div>
                  <h2 className="text-2xl font-black text-foreground">{selectedWorkflow.name}</h2>
                  <p className="text-sm text-muted font-medium mt-1">مدیریت مراحل، اکشن‌ها و مسیرهای ارتباطی</p>
                </div>
                <button onClick={() => setIsAddingStep(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-hover transition shadow-sm shadow-primary/20">
                  <Plus size={16} /> مرحله (گره) جدید
                </button>
              </div>

              <AnimatePresence>
                {isAddingStep && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-slate-50 dark:bg-slate-800/50 border border-surface-border rounded-2xl p-6 mb-6 overflow-hidden">
                    <h4 className="font-bold text-foreground mb-4 border-b border-surface-border pb-2">تنظیمات مرحله جدید</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted mb-1 block">عنوان مرحله (برای خودتان)</label>
                        <Input value={newStepData.title} onChange={e => setNewStepData({...newStepData, title: e.target.value})} placeholder="مثال: بررسی اولیه تیکت" className="bg-surface border-surface-border text-foreground" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted mb-1 block">نوع اکشن (ابزار پایه)</label>
                        <select value={newStepData.action_id} onChange={e => setNewStepData({...newStepData, action_id: e.target.value})} className="w-full h-10 px-3 bg-surface border border-surface-border rounded-md text-sm font-medium text-foreground outline-none focus:border-primary">
                          <option value="">انتخاب ابزار...</option>
                          {actionsDefinition.map(act => <option key={act.id} value={act.id}>{act.title}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={handleAddStep} disabled={!newStepData.title || !newStepData.action_id} className="flex items-center gap-2 bg-primary disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover"><Save size={16}/> ثبت گره</button>
                      <button onClick={() => setIsAddingStep(false)} className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600">انصراف</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 w-full h-[600px] relative">
                {(!selectedWorkflow.steps || selectedWorkflow.steps.length === 0) ? (
                  <div className="h-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-surface-border flex flex-col items-center justify-center text-muted gap-3">
                    <GitMerge size={48} strokeWidth={1.5} className="text-slate-300 dark:text-slate-600" />
                    <span className="font-medium">بومِ این گردش‌کار خالی است. گره اول را بسازید.</span>
                  </div>
                ) : (
                  <WorkflowCanvas 
                    workflow={selectedWorkflow} 
                    onNodeClick={(stepData) => {
                      setEditingStep(stepData);
                      setStepConfig(stepData.config || {});
                      setUserSearchQuery(""); 
                    }} 
                    onNodeDragStop={handleNodeDragStop}
                    onEdgeCreate={handleEdgeCreateFromCanvas}
                    onEdgeDelete={handleEdgeDeleteFromCanvas}
                  />
                )}
              </div>

            </motion.div>
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* مودال تنظیمات گره */}
      {/* ======================================================= */}
      <AnimatePresence>
        {editingStep && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingStep(null)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
              
              <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between">
                <h3 className="font-black text-foreground text-lg">تنظیمات: {editingStep.title}</h3>
                <button 
                  onClick={() => {
                    openRoutingModal(editingStep);
                    setEditingStep(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                >
                  <Waypoints size={14} /> تعیین مسیر خروجی
                </button>
              </div>

              <div className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-6">
                {editingStep.action_detail?.code === 'SHOW_RESOLUTION_MODAL' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-surface-border pb-2">
                      <label className="text-sm font-bold text-foreground">گزینه‌های تصمیم‌گیری</label>
                      <button onClick={handleAddChoice} className="text-xs font-bold text-primary bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50">+ افزودن گزینه</button>
                    </div>
                    {(!stepConfig.choices || stepConfig.choices.length === 0) ? (
                      <div className="text-center text-muted text-xs py-4">گزینه‌ای تعریف نشده است.</div>
                    ) : (
                      <div className="space-y-3">
                        {stepConfig.choices.map((choice: any) => (
                          <div key={choice.id} className="flex items-center gap-3">
                            <Input value={choice.label} onChange={(e) => handleChoiceChange(choice.id, e.target.value)} placeholder="مثلاً: پاسخگویی شفاهی" className="flex-1 bg-surface border-surface-border text-foreground" />
                            <button onClick={() => handleRemoveChoice(choice.id)} className="p-2 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 🌟 فرم هوشمند انتخاب گروه و کارشناس 🌟 */}
                {editingStep.action_detail?.code === 'CHANGE_GROUP' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground">انتخاب کارتابل (تیم) مقصد در زمد</label>
                      <select 
                        value={stepConfig.target_group || ""} 
                        onChange={(e) => handleTargetGroupChange(e.target.value)}
                        className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-800/50 border border-surface-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary transition-colors"
                      >
                        <option value="">لطفاً یک کارتابل انتخاب کنید...</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.name}>{team.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3 border-t border-surface-border pt-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-bold text-foreground">انتخاب کارشناسان مجاز</label>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-black">
                          {(stepConfig.allowed_users || []).length} نفر انتخاب شده
                        </span>
                      </div>

                      {(stepConfig.allowed_users || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-3 bg-surface rounded-xl border border-surface-border shadow-sm">
                          {systemUsers
                            .filter(u => (stepConfig.allowed_users || []).includes(u.id))
                            .map(u => {
                              const name = u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username;
                              return (
                                <span key={u.id} className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[11px] font-bold px-2 py-1 rounded-lg">
                                  {name}
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const newAllowed = stepConfig.allowed_users.filter((id: number) => id !== u.id);
                                      setStepConfig({ ...stepConfig, allowed_users: newAllowed });
                                    }}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800 hover:text-rose-500 rounded-full p-0.5 transition-colors"
                                  >
                                    <X size={12} strokeWidth={3} />
                                  </button>
                                </span>
                              );
                            })}
                        </div>
                      )}
                      
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input 
                          type="text"
                          placeholder="جستجو بر اساس نام یا نام خانوادگی..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="w-full h-10 bg-surface border border-surface-border rounded-xl pr-9 pl-4 text-sm font-medium text-foreground outline-none focus:border-primary transition-all placeholder:text-muted"
                        />
                      </div>

                      <div className="max-h-[200px] overflow-y-auto border border-surface-border bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-2 space-y-1 custom-scrollbar">
                        {filteredUsers.length === 0 ? (
                          <div className="text-xs text-muted font-medium text-center py-6">کاربری یافت نشد.</div>
                        ) : (
                          filteredUsers.map(user => {
                            const isChecked = (stepConfig.allowed_users || []).includes(user.id);
                            const isTeamMember = currentSelectedTeam?.members?.some((m: any) => (m.id ? m.id : m) === user.id) || false;
                            const fullName = user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username;
                            const avatarLetter = fullName.charAt(0);

                            return (
                              <label key={user.id} className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${isChecked ? 'bg-surface border-blue-300 dark:border-blue-700 shadow-[0_2px_10px_rgb(59,130,246,0.05)]' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors ${isChecked ? 'bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-400' : 'bg-slate-200 dark:bg-slate-700 text-muted'}`}>
                                    {avatarLetter}
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-bold transition-colors ${isChecked ? 'text-primary dark:text-blue-400' : 'text-foreground'}`}>
                                        {fullName}
                                      </span>
                                      {isTeamMember && (
                                        <span className="flex items-center gap-0.5 text-[9px] font-black bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 px-1.5 py-0.5 rounded-md">
                                          <ShieldCheck size={10} /> عضو کارتابل
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-medium text-muted font-mono tracking-wider">{user.username || user.email}</span>
                                  </div>
                                </div>

                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-primary border-primary' : 'bg-surface border-slate-300 dark:border-slate-600'}`}>
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const currentAllowed = stepConfig.allowed_users || [];
                                      const newAllowed = e.target.checked
                                        ? [...currentAllowed, user.id]
                                        : currentAllowed.filter((id: number) => id !== user.id);
                                      setStepConfig({ ...stepConfig, allowed_users: newAllowed });
                                    }}
                                    className="hidden"
                                  />
                                  {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {editingStep.action_detail?.code === 'SEND_SMS' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">متن پیامک</label>
                    <textarea value={stepConfig.sms_text || ""} onChange={(e) => setStepConfig({ ...stepConfig, sms_text: e.target.value })} rows={3} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-surface-border rounded-xl p-3 text-sm text-foreground focus:border-primary focus:outline-none resize-none" placeholder="کاربر گرامی..." />
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-surface-border bg-slate-50/50 dark:bg-slate-800/30 flex gap-3">
                <button 
                  onClick={handleDeleteStep}
                  className="flex items-center justify-center w-12 h-12 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 transition-colors shrink-0"
                  title="حذف این گره"
                >
                  <Trash2 size={20} />
                </button>
                <button onClick={() => setEditingStep(null)} className="flex-1 h-12 rounded-xl text-muted font-bold border border-surface-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">انصراف</button>
                <button onClick={handleSaveConfig} disabled={isSavingConfig} className="flex-[2] h-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-md shadow-primary/20 transition-all">
                  {isSavingConfig ? <Loader2 size={18} className="animate-spin mx-auto" /> : "ذخیره تنظیمات گره"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* مودال مسیریابی */}
      {/* ======================================================= */}
      <AnimatePresence>
        {routingStep && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setRoutingStep(null)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-surface-border bg-blue-50/50 dark:bg-blue-900/20">
                <h3 className="font-black text-foreground text-lg flex items-center gap-2"><Waypoints className="text-primary" /> مدیریت مسیرهای خروجی</h3>
                <p className="text-xs font-bold text-muted mt-1">گره مبدأ: {routingStep.title}</p>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
                {(() => {
                  const availableSteps = selectedWorkflow.steps.filter((s: any) => s.id !== routingStep.id);
                  const hasChoices = routingStep.action_detail?.has_choices;
                  const choices = routingStep.config?.choices || [];

                  if (availableSteps.length === 0) {
                    return <div className="text-center text-muted text-sm font-medium py-6">گره دیگری در سیستم وجود ندارد. لطفاً ابتدا گره‌های بعدی را بسازید.</div>;
                  }

                  if (hasChoices) {
                    if (choices.length === 0) return <div className="text-center text-rose-500 text-sm py-4">ابتدا در بخش تنظیمات گره، گزینه‌ها را تعریف کنید!</div>;
                    
                    return (
                      <div className="space-y-5">
                        <p className="text-sm font-bold text-foreground mb-4">برای هر دکمه، مشخص کنید تیکت به کدام گره برود:</p>
                        {choices.map((choice: any) => (
                          <div key={choice.id} className="flex items-center justify-between gap-4 p-4 border border-surface-border rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                            <span className="text-sm font-bold text-foreground min-w-[120px]">{choice.label}</span>
                            <ArrowRight size={16} className="text-muted shrink-0" />
                            <select 
                              value={localRoutes[choice.id] || ""} 
                              onChange={e => setLocalRoutes({...localRoutes, [choice.id]: e.target.value})}
                              className="flex-1 h-10 px-3 bg-surface border border-surface-border rounded-lg text-sm font-medium text-foreground outline-none focus:border-primary"
                            >
                              <option value="">پایان مسیر (بستن)</option>
                              {availableSteps.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 p-4 border border-surface-border rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                      <label className="text-sm font-bold text-foreground">پس از اتمام این مرحله، تیکت به کجا برود؟</label>
                      <select 
                        value={localRoutes['default'] || ""} 
                        onChange={e => setLocalRoutes({...localRoutes, ['default']: e.target.value})}
                        className="w-full h-12 px-4 bg-surface border border-surface-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary"
                      >
                        <option value="">پایان مسیر (تیکت می‌ماند)</option>
                        {availableSteps.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                    </div>
                  );
                })()}
              </div>

              <div className="p-6 border-t border-surface-border bg-surface flex gap-3">
                <button onClick={() => setRoutingStep(null)} className="flex-1 h-12 rounded-xl text-muted font-bold border border-surface-border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">لغو</button>
                <button onClick={handleSaveRoutes} disabled={isSavingRoutes} className="flex-[2] h-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-md shadow-primary/20 transition-all">
                  {isSavingRoutes ? <Loader2 size={18} className="animate-spin mx-auto" /> : "ذخیره مسیرها"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}