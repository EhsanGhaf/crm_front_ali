"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Loader2, CheckCircle2, ChevronLeft, Bot, GitMerge } from "lucide-react";
import { api } from "@/lib/api"; // فرض بر اینه که این همون axios کانفیگ شده شماست

interface TicketWorkflowWidgetProps {
  ticketId: string | number;
}

export default function TicketWorkflowWidget({ ticketId }: TicketWorkflowWidgetProps) {
  // استیت‌های مربوط به لیست گردش‌کارها
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWfId, setSelectedWfId] = useState<string>("");
  
  // استیت‌های مربوط به وضعیت موتور اجرا
  const [isLoading, setIsLoading] = useState(false);
  const [engineState, setEngineState] = useState<"idle" | "waiting_for_user" | "completed">("idle");
  const [currentStepId, setCurrentStepId] = useState<number | null>(null);
  const [uiData, setUiData] = useState<{ title: string; choices: any[] } | null>(null);
  const [message, setMessage] = useState("");

  // گرفتن لیست فرآیندهای فعال برای نمایش در دراپ‌داون
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const res = await api.get("/workflow/workflows/");
        // هندل کردن صفحه‌بندی (Pagination) جنگو
        const data = res.data.results || res.data;
        // فقط فرآیندهای فعال رو نشون بده
        setWorkflows(data.filter((wf: any) => wf.is_active));
      } catch (error) {
        console.error("Error fetching workflows", error);
      }
    };
    fetchWorkflows();
  }, []);

  // تابع یکپارچه برای صحبت با موتور اجرا (engine.py)
  const executeEngine = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.post("/workflow/execute/", payload);
      const data = res.data;

      if (data.status === "waiting_for_user") {
        setEngineState("waiting_for_user");
        setCurrentStepId(data.current_step_id);
        setUiData(data.ui_data);
      } else if (data.status === "completed") {
        setEngineState("completed");
        setMessage(data.message || "فرآیند با موفقیت به پایان رسید.");
        // اینجا می‌تونی یه تابع هم صدا بزنی که کل تیکت رو رفرش کنه تا تغییرات جدید (مثل تغییر گروه) رو ببینی
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "خطا در ارتباط با موتور گردش‌کار");
      setEngineState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  // ۱. استارت زدن فرآیند
  const handleStartWorkflow = () => {
    if (!selectedWfId) return;
    executeEngine({
      ticket_id: ticketId,
      workflow_id: parseInt(selectedWfId)
    });
  };

  // ۲. انتخاب یک گزینه توسط کارشناس و ادامه مسیر
  const handleChoiceSelect = (choiceId: string) => {
    if (!currentStepId) return;
    executeEngine({
      ticket_id: ticketId,
      current_step_id: currentStepId,
      condition_value: choiceId
    });
  };

  // ریست کردن ویجت برای اجرای یک فرآیند دیگه
  const handleReset = () => {
    setEngineState("idle");
    setCurrentStepId(null);
    setUiData(null);
    setSelectedWfId("");
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col dir-rtl text-right w-full" dir="rtl">
      
      {/* هدر ویجت */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
        <Bot size={18} className="text-blue-500" />
        <h3 className="text-sm font-bold text-slate-800">دستیار هوشمند تیکت</h3>
      </div>

      <div className="p-4 relative min-h-[150px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* حالت اول: آماده به کار (انتخاب فرآیند) */}
          {engineState === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-500">یک فرآیند (Workflow) برای این تیکت انتخاب کنید:</label>
              <select 
                value={selectedWfId} 
                onChange={(e) => setSelectedWfId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-blue-400 transition-colors"
                disabled={isLoading}
              >
                <option value="">انتخاب کنید...</option>
                {workflows.map(wf => (
                  <option key={wf.id} value={wf.id}>{wf.name}</option>
                ))}
              </select>
              
              <button 
                onClick={handleStartWorkflow} 
                disabled={!selectedWfId || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 disabled:bg-blue-300 text-white h-10 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors mt-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                شروع اجرای فرآیند
              </button>
            </motion.div>
          )}

          {/* حالت دوم: منتظر اقدام کارشناس (نمایش دکمه‌های داینامیک) */}
          {engineState === "waiting_for_user" && uiData && (
            <motion.div key="waiting" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <GitMerge size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-800 mb-1">اقدام مورد نیاز است</p>
                  <p className="text-sm font-medium text-slate-700">{uiData.title}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {uiData.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice.id)}
                    disabled={isLoading}
                    className="flex items-center justify-between w-full p-3 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl text-sm font-bold text-slate-700 transition-all group"
                  >
                    <span>{choice.label}</span>
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin text-slate-400" />
                    ) : (
                      <ChevronLeft size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* حالت سوم: پایان فرآیند */}
          {engineState === "completed" && (
            <motion.div key="completed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center gap-3 py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="text-sm font-black text-slate-800 mt-2">فرآیند تکمیل شد</h4>
              <p className="text-xs font-medium text-slate-500">{message}</p>
              
              <button onClick={handleReset} className="text-xs font-bold text-blue-600 hover:underline mt-4">
                اجرای یک فرآیند دیگر
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}