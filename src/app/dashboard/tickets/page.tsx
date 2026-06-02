"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Filter, MoreHorizontal, CheckCircle2, 
  AlertCircle, ChevronDown, X, Send, User, Bot, FileText, 
  History, CalendarDays, Layers, ChevronLeft, ChevronRight, Folder, FolderOpen, 
  Loader2, Eye, GitMerge, Play, CornerUpRight, Briefcase, ArrowUpDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

// 🌟 ایمپورت پکیج‌های سراسری هشدار و تاییدیه 🌟
import { toast } from 'sonner';
import { confirmAlert } from '@/lib/swal';

// 🌟 ایمپورت کامپوننت فرم داینامیک 🌟
import { DynamicField } from "@/components/DynamicField"; 

const findNodeById = (nodes: any[], id: number): any => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const SelectableTreeItem = ({ node, level = 0, onSelect, searchQuery }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  useEffect(() => {
    if (searchQuery && hasChildren) setIsOpen(true);
    else if (!searchQuery && level === 0) setIsOpen(false);
  }, [searchQuery, hasChildren, level]);

  return (
    <div className="w-full text-right relative">
      <div 
        className={`group relative flex items-center p-3 w-full transition-all duration-200 rounded-xl cursor-pointer ${
          hasChildren ? "hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground" : "hover:bg-blue-50 dark:hover:bg-blue-950/30 text-foreground hover:text-primary"
        }`}
        onClick={() => hasChildren ? setIsOpen(!isOpen) : onSelect(node)}
      >
        <div className={`flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? "-rotate-90" : "rotate-0"} text-muted mr-1 ml-2`}>
          {hasChildren ? <ChevronLeft size={16} strokeWidth={2.5} /> : <span className="w-4" />}
        </div>
        <div className={`shrink-0 transition-colors ml-3 ${hasChildren ? "text-muted group-hover:text-primary" : "text-primary group-hover:text-primary-hover"}`}>
          {hasChildren ? (isOpen ? <FolderOpen size={20} className="fill-blue-500/10" /> : <Folder size={20} className="fill-surface-border group-hover:fill-blue-50 dark:group-hover:fill-blue-950/20" />) : <FileText size={18} />}
        </div>
        <span className={`truncate flex-1 text-[15px] pt-0.5 ${hasChildren ? "font-bold" : "font-medium"}`}>{node.name}</span>
      </div>
      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden w-full relative">
            <div className="relative flex flex-col pr-6 mr-4 mt-1 mb-2 space-y-1">
              <div className="absolute right-0 top-0 bottom-4 w-[2px] bg-surface-border rounded-full" />
              {node.children.map((child: any) => (
                <div key={child.id} className="relative">
                  <div className="absolute right-0 top-[22px] w-6 h-[2px] bg-surface-border rounded-l-full z-0" />
                  <div className="relative z-10"><SelectableTreeItem node={child} level={level + 1} onSelect={onSelect} searchQuery={searchQuery} /></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge = ({ state }: { state: string }) => {
  if (state === "open" || state === "new") return <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50/80 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-full text-xs font-bold border border-rose-100/50 dark:border-rose-900/30"><AlertCircle size={14} className="text-rose-500" /> باز</div>;
  return <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-100/50 dark:border-emerald-900/30"><CheckCircle2 size={14} className="text-emerald-500" /> بسته شده</div>;
};

const SortableHeader = ({ title, columnKey, sortConfig, onSort, align = "right" }: any) => {
  const isActive = sortConfig?.key === columnKey;
  return (
    <th 
      onClick={() => onSort(columnKey)} 
      className={`px-6 py-4 text-${align} font-bold text-muted text-xs uppercase tracking-wider group cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors select-none`}
    >
      <div className={`flex items-center justify-${align === 'center' ? 'center' : 'start'} gap-1.5`}>
        {title}
        <div className={`p-1 rounded-md transition-all ${isActive ? "text-primary bg-blue-50 dark:bg-blue-950/50" : "text-slate-300 group-hover:text-primary group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30"}`}>
           <ArrowUpDown size={14} className="transition-transform duration-200" />
        </div>
      </div>
    </th>
  );
};

const StatusFilterHeader = ({ statusFilter, setStatusFilter }: { statusFilter: string, setStatusFilter: (v: any) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <th className="px-6 py-4 text-right font-bold text-muted text-xs uppercase tracking-wider relative group" ref={ref}>
      <div 
        className="flex items-center gap-1.5 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        وضعیت
        <div className={`p-1 rounded-md transition-all ${statusFilter !== 'all' ? 'text-primary bg-blue-50 dark:bg-blue-950/50' : 'text-slate-300 group-hover:text-primary group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30'}`}>
          <Filter size={14} className={isOpen ? 'text-primary' : ''} />
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute top-full right-4 mt-2 bg-surface border border-surface-border shadow-[0_10px_40px_rgb(0,0,0,0.1)] rounded-xl z-50 w-40 overflow-hidden font-medium text-sm flex flex-col"
          >
            <div onClick={() => {setStatusFilter('all'); setIsOpen(false)}} className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${statusFilter === 'all' ? 'text-primary font-bold bg-blue-50/50 dark:bg-blue-900/20' : 'text-foreground'}`}>همه تیکت‌ها</div>
            <div onClick={() => {setStatusFilter('open'); setIsOpen(false)}} className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${statusFilter === 'open' ? 'text-rose-600 font-bold bg-rose-50/50 dark:bg-rose-900/20' : 'text-foreground'}`}>فقط باز</div>
            <div onClick={() => {setStatusFilter('closed'); setIsOpen(false)}} className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${statusFilter === 'closed' ? 'text-emerald-600 font-bold bg-emerald-50/50 dark:bg-emerald-900/20' : 'text-foreground'}`}>بسته شده</div>
          </motion.div>
        )}
      </AnimatePresence>
    </th>
  );
};

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "mine">("mine");
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [historyModalUser, setHistoryModalUser] = useState<string | null>(null); 

  const [ticketArticles, setTicketArticles] = useState<any[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [ticketFormData, setTicketFormData] = useState<any[]>([]);
  const [isLoadingFormData, setIsLoadingFormData] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [showActionModal, setShowActionModal] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWfId, setSelectedWfId] = useState<string>("");
  const [engineState, setEngineState] = useState<"idle" | "waiting_for_user" | "completed">("idle");
  const [engineStepId, setEngineStepId] = useState<number | null>(null);
  const [engineUiData, setEngineUiData] = useState<{ title: string; choices: any[] } | null>(null);
  const [isEngineLoading, setIsEngineLoading] = useState(false);

  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null);
  const [newTicketEngineData, setNewTicketEngineData] = useState<{ step_id: number; ui_data: any } | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  const [replyBody, setReplyBody] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const [customerQuery, setCustomerQuery] = useState("");
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isNewCustomerForm, setIsNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ firstname: "", lastname: "", mobile: "", national_id: "" });

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [newTicketFormData, setNewTicketFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  const [showTreeModal, setShowTreeModal] = useState(false);
  const [searchTreeQuery, setSearchTreeQuery] = useState("");
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  const selectedCategoryNode = selectedCategoryId ? findNodeById(treeData, Number(selectedCategoryId)) : null;

  const filteredTree = useMemo(() => {
    if (!searchTreeQuery) return treeData;
    const filterNodes = (nodes: any[]): any[] => nodes.reduce<any[]>((acc, node) => {
      const isMatch = node.name.toLowerCase().includes(searchTreeQuery.toLowerCase());
      let filteredChildren: any[] = [];
      if (node.children && node.children.length > 0) filteredChildren = filterNodes(node.children);
      if (isMatch || filteredChildren.length > 0) acc.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : (isMatch ? node.children : []) });
      return acc;
    }, []);
    return filterNodes(treeData);
  }, [searchTreeQuery, treeData]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedTicketsList = useMemo(() => {
    let items = [...ticketsList];
    
    if (statusFilter !== "all") {
      items = items.filter(t => t.state === statusFilter || (statusFilter === 'open' && t.state === 'new'));
    }

    if (sortConfig !== null) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'date') {
          aVal = a.date + a.time;
          bVal = b.date + b.time;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [ticketsList, sortConfig, statusFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId !== null) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    if (selectedTicket || isCreatingTicket || historyModalUser) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [selectedTicket, isCreatingTicket, historyModalUser]);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await api.get('/workflow/workflows/');
        const data = response.data.results || response.data;
        setWorkflows(data.filter((wf: any) => wf.is_active));
      } catch (error) {
        console.error("Error fetching workflows:", error);
      }
    };
    fetchWorkflows();
  }, []);

  useEffect(() => {
    if (showActionModal && selectedTicket) {
      const fetchWorkflowState = async () => {
        setIsEngineLoading(true);
        try {
          const response = await api.get(`/workflow/state/${selectedTicket.id}/`);
          if (response.data && response.data.current_step_id) {
            setEngineState("waiting_for_user");
            setEngineStepId(response.data.current_step_id);
            setEngineUiData(response.data.ui_data);
          } else {
            setEngineState("idle");
          }
        } catch (error) {
          setEngineState("idle");
        } finally {
          setIsEngineLoading(false);
        }
      };
      fetchWorkflowState();
    }
  }, [showActionModal, selectedTicket]);

  useEffect(() => {
    const fetchFormFields = async () => {
      if (!selectedCategoryId) {
        setDynamicFields([]);
        return;
      }
      setIsLoadingForm(true);
      try {
        const response = await api.get(`/forms/category/${selectedCategoryId}/`);
        const fields = response.data.data || [];
        setDynamicFields(fields);
        
        const initialData: Record<string, any> = {};
        fields.forEach((field: any) => {
          if (field.field_type === 'multiselect') initialData[field.field_id.toString()] = [];
          else initialData[field.field_id.toString()] = field.field_type === 'bool' ? false : '';
        });
        setNewTicketFormData(initialData);
      } catch (error) {
        console.error("Error fetching form fields:", error);
      } finally {
        setIsLoadingForm(false);
      }
    };
    fetchFormFields();
  }, [selectedCategoryId]);

  const fetchTickets = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingTickets(true);
    try {
      let query = `?tab=${activeTab}&page=${currentPage}`;
      if (tableSearchQuery) query += `&search=${tableSearchQuery}`;

      const response = await api.get(`/tickets/list/${query}`);
      const rawTickets = response.data.results || response.data.data || [];
      const total = response.data.total_pages || 1; 

      const formattedTickets = rawTickets.map((t: any) => {
        const dateObj = t.created_at ? new Date(t.created_at) : new Date();
        return {
          ...t,
          date: dateObj.toLocaleDateString('fa-IR'),
          time: dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };
      });
      
      setTicketsList(formattedTickets);
      setTotalPages(total);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      if (showLoading) setIsLoadingTickets(false);
    }
  }, [activeTab, currentPage, tableSearchQuery]);

  useEffect(() => {
    fetchTickets(true); 
    const intervalId = setInterval(() => {
      fetchTickets(false); 
    }, 15000);
    return () => clearInterval(intervalId);
  }, [fetchTickets]);

  const fetchCustomerHistoryData = async (identifier: string) => {
    if (!identifier || identifier === "نامشخص") {
      setCustomerHistory([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const response = await api.get(`/tickets/customer/${identifier}/`);
      const formattedHistory = (response.data.tickets || [])
        .map((t: any) => {
          const dateObj = t.created_at ? new Date(t.created_at) : new Date();
          return {
            id: t.id,
            title: t.title,
            state: t.state === 'new' ? 'open' : t.state,
            date: dateObj.toLocaleDateString('fa-IR'),
            is_reopenable: t.is_reopenable, 
            resolution: t.resolution 
          };
        })
        .sort((a: any, b: any) => b.id - a.id); 
        
      setCustomerHistory(formattedHistory);
    } catch (error) {
      console.error("Error fetching history data:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchTicketFormData = async (ticketId: number) => {
    setIsLoadingFormData(true);
    try {
      const response = await api.get(`/tickets/${ticketId}/dynamic-data/`);
      setTicketFormData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching form data:", error);
    } finally {
      setIsLoadingFormData(false);
    }
  };

  const fetchTicketDetails = async (ticketId: number) => {
    setIsLoadingArticles(true);
    try {
      const response = await api.get(`/tickets/${ticketId}/detail/`);
      setTicketArticles(response.data.history || []);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketDetails(selectedTicket.id);
      fetchTicketFormData(selectedTicket.id);
      
      const identifier = selectedTicket.customer_identifier || selectedTicket.customer;
      if (identifier && identifier !== "نامشخص") {
        fetchCustomerHistoryData(identifier);
      } else {
        setCustomerHistory([]); 
      }
    } else {
      setTicketArticles([]);
      setTicketFormData([]);
      setReplyBody("");
      setEngineState("idle");
      setSelectedWfId("");
    }
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (historyModalUser) fetchCustomerHistoryData(historyModalUser);
    else if(!selectedTicket) setCustomerHistory([]);
  }, [historyModalUser]);

  useEffect(() => {
    if (customerQuery.trim().length < 3) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    if (selectedCustomer && (selectedCustomer.identifier === customerQuery || selectedCustomer.phone === customerQuery)) return;

    setIsSearchingCustomer(true);
    setShowCustomerDropdown(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await api.get(`/tickets/customer/${customerQuery}/`);
        const data = response.data;
        setCustomerResults([{
          ...data.profile, 
          name: data.profile.full_name,
          phone: data.profile.identifier,
          kyc: data.profile.kyc_level
        }]);
        
        const formattedHistory = (data.tickets || [])
          .map((t: any) => {
            const dateObj = t.created_at ? new Date(t.created_at) : new Date();
            return {
              id: t.id,
              title: t.title,
              state: t.state === 'new' ? 'open' : t.state,
              date: dateObj.toLocaleDateString('fa-IR'),
              resolution: t.resolution 
            };
          })
          .sort((a: any, b: any) => b.id - a.id);
          
        setCustomerHistory(formattedHistory);
      } catch (error) {
        setCustomerResults([]);
        setCustomerHistory([]);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 800); 

    return () => clearTimeout(delayDebounceFn);
  }, [customerQuery, selectedCustomer]);

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.phone || customer.identifier);
    setShowCustomerDropdown(false);
    setIsNewCustomerForm(false);
  };

  const handleTriggerNewCustomerForm = () => {
    setSelectedCustomer(null); 
    setIsNewCustomerForm(true); 
    setShowCustomerDropdown(false); 
    
    const isMobile = customerQuery.startsWith("09") && customerQuery.length === 11;
    const isNationalId = customerQuery.length === 10;
    
    setNewCustomerData({ 
      firstname: "", lastname: "", mobile: isMobile ? customerQuery : "", national_id: isNationalId ? customerQuery : "" 
    });
  };

  const handleFormChange = (label: string, value: any) => setNewTicketFormData(prev => ({ ...prev, [label]: value }));

  const handleOpenTreeModal = async () => {
    setShowTreeModal(true);
    if (treeData.length === 0) {
      setIsLoadingTree(true);
      try {
        const response = await api.get('/knowledge/tree/');
        setTreeData(response.data.data || []);
      } catch (error) {
        console.error("Error fetching knowledge tree:", error);
      } finally {
        setIsLoadingTree(false);
      }
    }
  };

  const resetCreateModalState = () => {
    setIsCreatingTicket(false);
    setCustomerQuery("");
    setSelectedCustomer(null);
    setSelectedCategoryId("");
    setNewTicketFormData({});
    setDynamicFields([]);
    setIsNewCustomerForm(false);
    setNewCustomerData({ firstname: "", lastname: "", mobile: "", national_id: "" });
    setNewTicketEngineData(null);
    setCreatedTicketId(null);
    setExpandedHistoryId(null);
  };

  const handleCloseCreateModal = async () => {
    const hasUnsavedData = selectedCustomer || isNewCustomerForm || selectedCategoryId || Object.keys(newTicketFormData).length > 0;
    if (newTicketEngineData) {
      resetCreateModalState();
      return; 
    }
    if (hasUnsavedData) {
      const result = await confirmAlert(
        "خروج از فرم ثبت تیکت",
        "شما اطلاعاتی را وارد کرده‌اید که هنوز ثبت نشده است. آیا از بستن این صفحه مطمئن هستید؟",
        "بله، بسته شود",
        "ماندن در فرم",
        true
      );
      if (!result.isConfirmed) return; 
    }
    resetCreateModalState();
  };

  const injectOptimisticTicket = (newId: number) => {
    const customerName = isNewCustomerForm ? `${newCustomerData.firstname} ${newCustomerData.lastname}`.trim() : selectedCustomer?.name;
    const customerIdentifier = isNewCustomerForm ? (newCustomerData.mobile || newCustomerData.national_id) : (selectedCustomer?.identifier || selectedCustomer?.phone);
    
    const optimisticTicket = {
      id: newId,
      title: selectedCategoryNode?.name || "تیکت جدید",
      customer: customerName,
      customer_identifier: customerIdentifier,
      owner: "شما", 
      state: "new",
      date: new Date().toLocaleDateString('fa-IR'),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };
    setTicketsList(prev => [optimisticTicket, ...prev]);
  };

  const handleSubmitNewTicket = async () => {
    if ((!selectedCustomer && !isNewCustomerForm) || !selectedCategoryId) {
      toast.error("لطفاً مشتری و موضوع را به درستی مشخص کنید.");
      return;
    }
    if (isNewCustomerForm && !newCustomerData.firstname) {
      toast.error("نام کاربر جدید الزامی است.");
      return;
    }

    for (const field of dynamicFields) {
      if (field.required) {
        const fieldKey = field.field_id.toString();
        const fieldValue = newTicketFormData[fieldKey];
        if (
          fieldValue === undefined || 
          fieldValue === null || 
          (typeof fieldValue === 'string' && fieldValue.trim() === '') ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        ) {
          toast.error(`پر کردن فیلد "${field.label}" الزامی است!`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_identifier: isNewCustomerForm 
          ? (newCustomerData.mobile || newCustomerData.national_id || `user_${Date.now()}`) 
          : (selectedCustomer.identifier || selectedCustomer.phone),
        category_id: selectedCategoryId,
        form_data: newTicketFormData,
        ...(isNewCustomerForm && {
          firstname: newCustomerData.firstname,
          lastname: newCustomerData.lastname || undefined,
          mobile: newCustomerData.mobile || undefined,
          national_id: newCustomerData.national_id || undefined,
        })
      };

      const response = await api.post('/tickets/submit/', payload);
      const responseData = response.data;

      if (responseData.workflow_status === "waiting_for_user" || responseData.engine_status === "waiting_for_user") {
        toast.info("تیکت ثبت شد! لطفاً اقدام بعدی را مشخص کنید.");
        setCreatedTicketId(responseData.ticket_id);
        setNewTicketEngineData({
          step_id: responseData.current_step_id,
          ui_data: responseData.ui_data
        });
        injectOptimisticTicket(responseData.ticket_id);
        fetchTickets(false); 
      } else {
        toast.success("تیکت با موفقیت در سیستم ثبت شد!");
        injectOptimisticTicket(responseData.ticket_id);
        resetCreateModalState();
        fetchTickets(false); 
      }
    } catch (error: any) {
      console.error("Error submitting ticket:", error);
      toast.error(error.response?.data?.error || "خطا در ارتباط با سرور.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyBody.trim() || !selectedTicket) return;
    setIsReplying(true);
    try {
      await api.post(`/tickets/${selectedTicket.id}/reply/`, { body: replyBody });
      toast.success("یادداشت و پاسخ شما با موفقیت ثبت شد.");
      setReplyBody("");
      fetchTicketDetails(selectedTicket.id); 
    } catch (error) {
      toast.error("خطا در ارسال پاسخ تیکت.");
    } finally {
      setIsReplying(false);
    }
  };
  
  const handleAssignToMe = async () => {
    if (!selectedTicket) return;
    try {
      await api.post(`/tickets/${selectedTicket.id}/assign/`);
      toast.success("تیکت با موفقیت به کارتابل شما اضافه شد.");

      setSelectedTicket(prev => prev ? { ...prev, owner: "شما" } : null);
      setTicketsList(prevList => 
        prevList.map(t => 
          t.id === selectedTicket.id ? { ...t, owner: "شما" } : t
        )
      );

      fetchTicketDetails(selectedTicket.id);

      setTimeout(() => {
        fetchTickets(false); 
      }, 2000);

    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در تخصیص تیکت.");
    }
  };

  const executeEngine = async (payload: any, isFromNewTicketModal = false) => {
    setIsEngineLoading(true);
    try {
      const response = await api.post('/workflow/execute/', payload);
      const data = response.data;

      if (data.status === "waiting_for_user") {
        if (isFromNewTicketModal) {
          setNewTicketEngineData({ step_id: data.current_step_id, ui_data: data.ui_data });
        } else {
          setEngineState("waiting_for_user");
          setEngineStepId(data.current_step_id);
          setEngineUiData(data.ui_data);
        }
      } else if (data.status === "completed") {
        toast.success(data.message || "اقدام با موفقیت انجام شد.");
        if (isFromNewTicketModal) {
          resetCreateModalState();
          fetchTickets(false); 
        } else {
          setEngineState("completed");
          setTimeout(() => {
            setShowActionModal(false);
            setEngineState("idle");
            fetchTicketDetails(selectedTicket.id);
            fetchTickets(false); 
          }, 2000);
        }
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error: any) {
      console.error("Error workflow engine:", error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "خطا در ارتباط با موتور گردش‌کار");
    } finally {
      setIsEngineLoading(false);
    }
  };

  const handleStartWorkflow = () => {
    if (!selectedWfId || !selectedTicket) return;
    executeEngine({
      ticket_id: selectedTicket.id,
      workflow_id: parseInt(selectedWfId)
    });
  };

  const handleExecuteChoice = (choiceId: string, isFromNewTicket = false) => {
    if (isFromNewTicket) {
      if (!newTicketEngineData?.step_id || !createdTicketId) return;
      executeEngine({
        ticket_id: createdTicketId,
        current_step_id: newTicketEngineData.step_id,
        condition_value: choiceId
      }, true);
    } else {
      if (!engineStepId || !selectedTicket) return;
      executeEngine({
        ticket_id: selectedTicket.id,
        current_step_id: engineStepId,
        condition_value: choiceId
      }, false);
    }
  };

  const displayArticles = useMemo(() => {
    return ticketArticles.filter(art => {
      const plainText = art.body.replace(/(<([^>]+)>)/gi, "");
      return !plainText.includes("برای مشاهده اطلاعات تکمیل‌شده در فرم");
    });
  }, [ticketArticles]);

  return (
    <div className="w-full min-h-screen bg-background p-6 md:p-10 flex flex-col gap-8 animate-in fade-in duration-500 text-right dir-rtl relative" dir="rtl">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">تیکت‌های پشتیبانی</h1>
          <p className="text-muted mt-2 text-sm md:text-base font-medium">مدیریت، پیگیری و پاسخ‌گویی به درخواست‌های کاربران</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-surface border border-surface-border p-1 rounded-xl flex items-center shadow-inner">
            <button 
              onClick={() => { setActiveTab("mine"); setCurrentPage(1); }} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "mine" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              کارهای من
            </button>
            <button 
              onClick={() => { setActiveTab("all"); setCurrentPage(1); }} 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              همه تیکت‌ها
            </button>
          </div>
          <button onClick={() => setIsCreatingTicket(true)} className="flex items-center gap-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-600/20">
            <Plus size={18} strokeWidth={2.5} /> تیکت جدید
          </button>
        </div>
      </div>

      {/* جدول تیکت‌ها */}
      <div className="w-full bg-surface rounded-[2rem] border border-surface-border shadow-sm overflow-hidden flex flex-col relative z-10">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface gap-4 flex-wrap">
          <div className="relative w-full max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={18} />
            <input 
              type="text" 
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
              placeholder="جستجو در عنوان، شناسه یا شماره کاربر (اینتر بزنید)..." 
              className="w-full bg-background border border-surface-border text-foreground text-sm font-medium rounded-xl pr-10 pl-4 py-2.5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto w-full min-h-[250px]">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-surface-border">
              <tr>
                <SortableHeader title="شناسه" columnKey="id" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="عنوان درخواست" columnKey="title" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="مشتری (کاربر)" columnKey="customer" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader title="مسئول (کارشناس)" columnKey="owner" sortConfig={sortConfig} onSort={handleSort} />
                <StatusFilterHeader statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
                <SortableHeader title="تاریخ و زمان" columnKey="date" sortConfig={sortConfig} onSort={handleSort} />
                <th className="px-6 py-4 text-center font-bold text-muted text-xs uppercase tracking-wider">عملیات</th>
              </tr>
            </thead>
            <tbody className="bg-surface">
              {isLoadingTickets ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted gap-3">
                      <Loader2 size={32} className="animate-spin text-primary" />
                      <span className="text-sm font-medium">در حال دریافت تیکت‌ها از سیستم...</span>
                    </div>
                  </td>
                </tr>
              ) : processedTicketsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted font-medium text-sm">هیچ تیکتی با این مشخصات یافت نشد.</td>
                </tr>
              ) : (
                processedTicketsList.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-surface-border hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4"><span className="text-muted font-bold text-sm">#{ticket.id}</span></td>
                    <td className="px-6 py-4"><span className="text-foreground font-bold text-[15px]">{ticket.title}</span></td>
                    <td className="px-6 py-4"><span className="text-muted font-medium text-sm font-mono tracking-wider">{ticket.customer}</span></td>
                    
                    <td className="px-6 py-4">
                      {ticket.owner === "-" || ticket.owner === "تخصیص نیافته" || !ticket.owner ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 bg-background text-muted rounded-md border border-surface-border">تخصیص نیافته</span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-md border border-blue-100 dark:border-blue-900/50">{ticket.owner}</span>
                      )}
                    </td>

                    <td className="px-6 py-4"><StatusBadge state={ticket.state} /></td>
                    <td className="px-6 py-4"><div className="flex flex-col"><span className="text-foreground font-bold text-sm">{ticket.date}</span><span className="text-muted font-medium text-xs mt-0.5">{ticket.time}</span></div></td>
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === ticket.id ? null : ticket.id);
                        }} 
                        className={`p-2 rounded-lg transition-all ${openDropdownId === ticket.id ? 'bg-blue-50 dark:bg-blue-900/30 text-primary' : 'text-muted hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                      >
                        <MoreHorizontal size={20} />
                      </button>
                      
                      <AnimatePresence>
                        {openDropdownId === ticket.id && (
                          <motion.div 
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -5, scale: 0.95 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            className="absolute left-6 top-10 bg-surface shadow-xl rounded-xl border border-surface-border z-50 flex flex-col min-w-[160px] overflow-hidden"
                          >
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); setOpenDropdownId(null); }} 
                              className="flex items-center gap-2.5 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-foreground w-full text-right"
                            >
                              <Eye size={16} className="text-primary" /> مشاهده جزئیات
                            </button>
                            <div className="w-full h-px bg-surface-border"></div>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setHistoryModalUser(ticket.customer_identifier || ticket.customer); 
                                setOpenDropdownId(null); 
                              }} 
                              className="flex items-center gap-2.5 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-foreground w-full text-right"
                            >
                              <History size={16} className="text-muted" /> تاریخچه کاربر
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoadingTickets && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
            <span className="text-sm font-bold text-muted">صفحه {currentPage} از {totalPages}</span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 bg-surface border border-surface-border rounded-xl text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 bg-surface border border-surface-border rounded-xl text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* مودال تاریخچه عمومی تیکت‌های مشتری */}
      <AnimatePresence>
        {historyModalUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setHistoryModalUser(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                <h3 className="font-black text-foreground text-lg flex items-center gap-2">
                  <History className="text-primary" size={20} /> تاریخچه کاربر: {historyModalUser}
                </h3>
                <button onClick={() => setHistoryModalUser(null)} className="p-1.5 text-muted hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-foreground rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-background">
                {isLoadingHistory ? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" size={24} /></div>
                ) : customerHistory.length === 0 ? (
                  <div className="text-center text-muted text-sm py-4">تاریخچه‌ای برای این کاربر یافت نشد.</div>
                ) : (
                  <div className="space-y-4">
                    {customerHistory.map(hist => (
                      <div key={hist.id} className="flex flex-col p-4 border border-surface-border bg-surface rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-muted">#{hist.id}</span>
                          <StatusBadge state={hist.state} />
                        </div>
                        <h5 className="font-bold text-sm mb-3 text-foreground">{hist.title}</h5>
                        <div className="flex justify-between items-center text-[11px] font-bold text-muted border-t border-surface-border pt-3">
                          <span className="flex items-center gap-1"><CalendarDays size={14} /> {hist.date}</span>
                          {hist.resolution && <span>اقدام نهایی: {hist.resolution}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* کشوی بزرگ جزئیات تیکت و چت هماهنگ */}
      <AnimatePresence>
        {selectedTicket && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSelectedTicket(null)} />
            <motion.div initial={{ x: "-100%", opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "-100%", opacity: 0.5 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-full max-w-[90vw] lg:max-w-5xl bg-surface shadow-2xl z-50 flex flex-col md:flex-row border-r border-surface-border overflow-hidden">
              
              {/* بخش سایدبار داخلی چت */}
              <div className="w-full md:w-[320px] lg:w-[360px] bg-slate-50/50 dark:bg-slate-800/20 border-l border-surface-border shrink-0 flex flex-col h-full">
                <div className="p-8 border-b border-surface-border flex flex-col items-center justify-center text-center bg-surface relative">
                  <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/50 border-4 border-surface bg-surface shadow-sm flex items-center justify-center text-primary mb-4"><User size={36} strokeWidth={1.5} /></div>
                  <h3 className="font-black text-foreground text-xl tracking-wide">{selectedTicket.customer}</h3>
                  <span className="text-sm font-bold text-muted mt-1">مشتری صرافی</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <h4 className="text-sm font-black text-foreground flex items-center gap-2 mb-5">
                    <History size={18} className="text-primary" /> تاریخچه تیکت‌های کاربر
                  </h4>
                  
                  <div className="space-y-4">
                    {isLoadingHistory ? (
                      <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" size={24} /></div>
                    ) : customerHistory.length === 0 ? (
                      <div className="text-center text-muted text-sm py-4">تاریخچه‌ای برای این کاربر یافت نشد.</div>
                    ) : (
                      customerHistory.map(hist => {
                        const isSelected = selectedTicket.id === hist.id;
                        return (
                          <div 
                            key={hist.id} 
                            onClick={() => setSelectedTicket(hist)} 
                            className={`flex flex-col p-4 border rounded-2xl transition-all cursor-pointer group relative overflow-hidden ${
                              isSelected 
                                ? 'border-primary bg-blue-50/40 dark:bg-blue-950/20 shadow-sm' 
                                : 'border-surface-border bg-surface hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2.5">
                              <span className={`text-xs font-black transition-colors ${isSelected ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>#{hist.id}</span>
                              <StatusBadge state={hist.state} />
                            </div>
                            <h5 className={`font-bold text-sm mb-4 leading-snug ${isSelected ? 'text-primary dark:text-blue-400' : 'text-foreground'}`}>{hist.title}</h5>
                            <div className={`flex items-end justify-between mt-auto border-t pt-3 ${isSelected ? 'border-blue-100 dark:border-blue-900/50' : 'border-surface-border'}`}>
                              <div className={`flex items-center text-[11px] font-bold gap-1.5 ${isSelected ? 'text-primary' : 'text-muted'}`}>
                                <CalendarDays size={14} /> {hist.date}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* بخش بدنه اصلی پیام‌ها */}
              <div className="flex-1 flex flex-col bg-surface h-full relative">
                <div className="px-8 py-6 border-b border-surface-border flex items-start justify-between bg-surface z-10 shrink-0">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleAssignToMe}
                        className="bg-blue-50 dark:bg-blue-900/30 text-primary hover:bg-primary hover:text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm border border-blue-100 dark:border-blue-900/40"
                      >
                        به عهده گرفتن تیکت
                      </button>
                      <span className="text-xs font-black px-2.5 py-1 bg-background border border-surface-border text-foreground rounded-lg">#{selectedTicket.id}</span>
                      
                      <button 
                        onClick={() => setShowActionModal(true)}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                          selectedTicket.state === "open" || selectedTicket.state === "new" 
                            ? "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100" 
                            : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100"
                        }`}
                      >
                        {selectedTicket.state === "open" || selectedTicket.state === "new" ? (
                          <><Briefcase size={14} /> در جریان (ثبت اقدام) <ChevronDown size={14}/></>
                        ) : (
                          <><CheckCircle2 size={14} /> حل شده (ویرایش وضعیت) <ChevronDown size={14}/></>
                        )}
                      </button>
                    </div>
                    
                    <h2 className="text-2xl font-black text-foreground leading-tight mt-1">{selectedTicket.title}</h2>
                    <span className="text-xs font-bold text-muted flex items-center gap-1.5 mt-1"><CalendarDays size={14} /> زمان ثبت: {selectedTicket.date} - ساعت {selectedTicket.time}</span>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="p-2.5 text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground rounded-full transition-colors bg-background border border-surface-border"><X size={20} strokeWidth={2.5} /></button>
                </div>
                
                {/* 🌟 پیام‌ها و پیش‌نمایش فرم (استفاده از کامپوننت DynamicField) 🌟 */}
                <div className="flex-1 overflow-y-auto p-8 bg-background flex flex-col gap-8 custom-scrollbar">
                  
                  {isLoadingFormData ? (
                     <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={24} /></div>
                  ) : ticketFormData.length > 0 ? (
                    <div className="bg-surface border border-surface-border rounded-[1.5rem] p-6 shadow-sm w-full">
                      <h4 className="font-bold text-foreground mb-5 flex items-center gap-2 border-b border-surface-border pb-4">
                        <FileText size={18} className="text-primary" /> اطلاعات فرم ثبت‌شده موضوعی
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ticketFormData.map((item, idx) => (
                          <div key={idx} className={`flex flex-col gap-2 p-4 rounded-xl border border-surface-border ${item.field_type === 'textarea' ? 'md:col-span-2' : 'bg-background/50'}`}>
                             <span className="text-xs font-bold text-primary">{item.label}</span>
                             <div className="opacity-90">
                               {/* 🌟 استفاده از DynamicField برای نمایش یکپارچه 🌟 */}
                               <DynamicField 
                                 field={{ 
                                   field_type: item.field_type,
                                   // در صورتی که بک‌اِند گزینه‌ها را برنگرداند، مقادیر انتخاب‌شده را به عنوان گزینه پیش‌فرض پاس می‌دهیم تا رندر شوند
                                   options: item.options || item.value 
                                 }} 
                                 value={item.value} 
                                 readOnly={true} 
                               />
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-6">
                    {isLoadingArticles ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-primary" size={32} />
                      </div>
                    ) : displayArticles.length === 0 ? (
                      <div className="text-center text-muted py-10">هیچ پیامی در این تیکت ثبت نشده است.</div>
                    ) : (
                      displayArticles.map((art) => {
                        const isAgent = art.internal || art.type === "note";
                        const dateObj = new Date(art.created_at);
                        const time = dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <div key={art.id} className={`flex w-full gap-3 ${!isAgent ? "justify-start" : "justify-end"}`}>
                            {!isAgent && <div className="w-10 h-10 rounded-full bg-surface border border-surface-border flex items-center justify-center text-muted shrink-0 shadow-sm"><User size={20} /></div>}
                            <div className={`flex flex-col max-w-[80%] ${!isAgent ? "items-start" : "items-end"}`}>
                              <div 
                                className={`px-5 py-4 text-[15px] font-medium leading-loose shadow-sm ${!isAgent ? "bg-surface border border-surface-border text-foreground rounded-3xl rounded-tr-md text-right" : "bg-primary text-white rounded-3xl rounded-tl-md text-right"}`}
                                dangerouslySetInnerHTML={{ __html: art.body }}
                              />
                              <span className="text-[11px] font-bold text-muted mt-2 px-1">{time}</span>
                            </div>
                            {isAgent && <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-primary shrink-0 flex items-center justify-center border border-blue-200 dark:border-blue-900"><Bot size={20} /></div>}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* فوتر چت: فیلد متنی ارسال پاسخ */}
                <div className="p-6 border-t border-surface-border bg-surface shrink-0 z-10">
                  <div className="relative flex items-end gap-2">
                    <textarea 
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="پاسخ یا یادداشت خود را برای کاربر بنویسید..." 
                      rows={1} 
                      className="w-full bg-background border border-surface-border text-foreground text-[15px] font-medium rounded-2xl pl-16 pr-5 py-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none min-h-[60px] max-h-[150px]" 
                    />
                    <button 
                      onClick={handleSendReply}
                      disabled={isReplying || !replyBody.trim()}
                      className="absolute left-2.5 bottom-2.5 p-3 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:bg-blue-300 dark:disabled:bg-blue-950 shadow-md shadow-primary/20"
                    >
                      {isReplying ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="rotate-180" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* مودال دستیار هوشمند جریان کارگاه */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowActionModal(false)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-black text-foreground text-lg flex items-center gap-2">
                  <Bot className="text-primary" size={20} /> دستیار هوشمند اقدام فرآیند
                </h3>
                <button onClick={() => setShowActionModal(false)} className="p-1.5 text-muted hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-foreground rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-6">
                {engineState === "idle" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <label className="text-sm font-bold text-foreground">یک فرآیند گردش‌کار متناسب انتخاب کنید:</label>
                    <select 
                      value={selectedWfId} 
                      onChange={(e) => setSelectedWfId(e.target.value)}
                      disabled={isEngineLoading}
                      className="w-full h-14 px-4 bg-background border border-surface-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">انتخاب کنید...</option>
                      {workflows.map(wf => (
                        <option key={wf.id} value={wf.id}>{wf.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={handleStartWorkflow} 
                      disabled={!selectedWfId || isEngineLoading}
                      className="w-full flex items-center justify-center gap-2 bg-primary disabled:bg-blue-300 text-white h-14 rounded-xl text-sm font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                    >
                      {isEngineLoading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                      شروع اجرای فرآیند هوشمند
                    </button>
                  </motion.div>
                )}

                {engineState === "waiting_for_user" && engineUiData && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                      <GitMerge size={24} className="text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-primary mb-1">اقدام مورد نیاز در این گره جاری</p>
                        <p className="text-base font-black text-foreground">{engineUiData.title}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {engineUiData.choices.map((choice) => (
                        <div 
                          key={choice.id}
                          onClick={() => {
                            if (!isEngineLoading) handleExecuteChoice(choice.id);
                          }}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                            isEngineLoading ? 'opacity-50 pointer-events-none border-surface-border' : 'border-surface-border hover:border-primary bg-surface hover:bg-blue-50 dark:hover:bg-blue-950/30'
                          } group`}
                        >
                          <CornerUpRight size={24} className="text-muted group-hover:text-primary transition-colors" />
                          <span className="text-sm font-bold text-foreground group-hover:text-primary text-center">{choice.label}</span>
                        </div>
                      ))}
                    </div>
                    {isEngineLoading && <p className="text-xs font-bold text-muted text-center animate-pulse mt-4">در حال هدایت به مسیر بعدی...</p>}
                  </motion.div>
                )}

                {engineState === "completed" && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8 text-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={36} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-foreground">فرآیند با موفقیت تکمیل شد</h4>
                      <p className="text-sm font-bold text-muted mt-2">این پنجره به صورت خودکار بسته می‌شود...</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* کشوی ثبت تیکت جدید سه مرحله‌ای */}
      <AnimatePresence>
        {isCreatingTicket && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={handleCloseCreateModal} />
            <motion.div initial={{ x: "-100%", opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "-100%", opacity: 0.5 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-full max-w-[46rem] bg-surface shadow-2xl z-50 flex flex-col border-r border-surface-border">
              
              <div className="px-8 py-6 border-b border-surface-border flex items-center justify-between bg-surface shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-xl flex items-center justify-center">
                    {newTicketEngineData ? <GitMerge size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
                  </div>
                  <h2 className="text-2xl font-black text-foreground">
                    {newTicketEngineData ? "تعیین اقدام فرآیند هوشمند" : "ثبت تیکت پشتیبانی جدید"}
                  </h2>
                </div>
                <button onClick={handleCloseCreateModal} className="p-2 text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground rounded-full transition-colors bg-background border border-surface-border"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-background flex flex-col gap-8 custom-scrollbar relative">
                
                {newTicketEngineData ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full gap-8">
                    <div className="bg-surface p-8 rounded-3xl border border-surface-border shadow-sm w-full">
                      <div className="text-center mb-6">
                        <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold mb-4">تیکت #{createdTicketId} ثبت شد</span>
                        <h3 className="text-xl font-black text-foreground">{newTicketEngineData.ui_data?.title || "لطفاً اقدام بعدی برای فرآیند تیکت را مشخص کنید"}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {newTicketEngineData.ui_data?.choices?.map((choice: any) => (
                          <div 
                            key={choice.id}
                            onClick={() => {
                              if (!isEngineLoading) handleExecuteChoice(choice.id, true);
                            }}
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                              isEngineLoading ? 'opacity-50 pointer-events-none border-surface-border' : 'border-surface-border hover:border-primary bg-background/50 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                            } group`}
                          >
                            <CornerUpRight size={28} className="text-muted group-hover:text-primary transition-colors" />
                            <span className="text-[15px] font-bold text-foreground group-hover:text-primary text-center">{choice.label}</span>
                          </div>
                        ))}
                      </div>
                      {isEngineLoading && <p className="text-sm font-bold text-muted text-center animate-pulse mt-6">در حال ارسال دستورات به موتور اتوماسیون...</p>}
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* مرحله اول: مشتری */}
                    <div className={`bg-surface p-6 rounded-[1.5rem] border ${selectedCustomer ? 'border-emerald-200/60' : 'border-surface-border'} shadow-sm space-y-4 relative z-30 transition-colors`}>
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <User size={18} className="text-primary" /> ۱. استعلام و انتخاب مشتری حساب
                      </h3>
                      
                      {!isNewCustomerForm ? (
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <Input 
                              value={customerQuery} 
                              onChange={(e) => {
                                setCustomerQuery(e.target.value);
                                setSelectedCustomer(null);
                              }}
                              placeholder="شماره موبایل یا شناسه کاربر را تایپ کنید..." 
                              className="bg-background border-surface-border h-14 pl-12 pr-12 w-full text-foreground font-medium rounded-xl focus-visible:ring-primary/20" 
                            />
                            {isSearchingCustomer && (
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary animate-spin"><Loader2 size={20} /></div>
                            )}
                          </div>

                          <AnimatePresence>
                            {showCustomerDropdown && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="absolute z-40 top-full mt-2 w-full bg-surface border border-surface-border rounded-2xl shadow-xl overflow-hidden flex flex-col"
                              >
                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                  {customerResults.length === 0 && customerQuery.length >= 3 && !isSearchingCustomer ? (
                                    <div 
                                      onClick={handleTriggerNewCustomerForm}
                                      className="p-4 flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer rounded-xl transition-colors border border-blue-100 dark:border-blue-900/40"
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-sm font-bold text-primary">کاربر در سیستم یافت نشد</span>
                                        <span className="text-xs font-medium text-muted mt-1">جهت تعریف سریع و ثبت اطلاعات این شخص کلیک کنید</span>
                                      </div>
                                      <Plus className="text-primary" size={20} />
                                    </div>
                                  ) : (
                                    customerResults.map(cust => (
                                      <div 
                                        key={cust.identifier || cust.phone} onClick={() => handleSelectCustomer(cust)}
                                        className="flex items-center justify-between p-3 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer rounded-xl transition-colors group border border-transparent hover:border-surface-border"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-950 group-hover:text-primary transition-colors"><User size={18} /></div>
                                          <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground group-hover:text-primary">{cust.name}</span>
                                            <span className="text-xs font-medium text-muted mt-0.5 tracking-wider font-mono">{cust.phone}</span>
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 bg-background border border-surface-border text-foreground rounded-md">{cust.kyc}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-5 space-y-4 overflow-hidden">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-primary">ثبت پروفایل کاربری جدید در زمد</span>
                            <button onClick={() => {setIsNewCustomerForm(false); setSelectedCustomer(null);}} className="text-xs text-rose-500 hover:underline">انصراف</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-bold text-muted mb-1 block">نام (الزامی)</label>
                              <Input value={newCustomerData.firstname} onChange={e => setNewCustomerData({...newCustomerData, firstname: e.target.value})} className="bg-surface border-surface-border text-foreground h-10" />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-muted mb-1 block">نام خانوادگی</label>
                              <Input value={newCustomerData.lastname} onChange={e => setNewCustomerData({...newCustomerData, lastname: e.target.value})} className="bg-surface border-surface-border text-foreground h-10" />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-muted mb-1 block">شماره موبایل</label>
                              <Input value={newCustomerData.mobile} onChange={e => setNewCustomerData({...newCustomerData, mobile: e.target.value})} className="bg-surface border-surface-border text-foreground h-10" dir="ltr" />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-muted mb-1 block">کد ملی</label>
                              <Input value={newCustomerData.national_id} onChange={e => setNewCustomerData({...newCustomerData, national_id: e.target.value})} className="bg-surface border-surface-border text-foreground h-10" dir="ltr" />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <AnimatePresence>
                        {selectedCustomer && !isNewCustomerForm && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                            <div className="mt-2 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CheckCircle2 size={20} /></div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">مشتری تایید شد: {selectedCustomer.name}</span>
                                  <span className="text-xs font-medium text-emerald-600/80 mt-0.5 font-mono">{selectedCustomer.phone}</span>
                                </div>
                              </div>
                              <span className="text-xs font-black px-2 py-1 bg-surface text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg">{selectedCustomer.kyc}</span>
                            </div>
                            
                            {customerHistory.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-surface-border">
                                <p className="text-xs font-bold text-muted mb-3 flex items-center gap-1.5"><History size={14}/> تیکت‌های اخیر مرتبط با این کاربر:</p>
                                <div className="space-y-2">
                                  {customerHistory.slice(0,3).map(hist => (
                                    <div key={hist.id} className="border border-surface-border rounded-xl bg-surface overflow-hidden shadow-sm">
                                      <div 
                                        className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        onClick={() => setExpandedHistoryId(expandedHistoryId === hist.id ? null : hist.id)}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-black text-muted">#{hist.id}</span>
                                          <span className="text-sm font-bold text-foreground truncate max-w-[200px]">{hist.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <StatusBadge state={hist.state} />
                                          <ChevronDown size={16} className={`text-muted transition-transform ${expandedHistoryId === hist.id ? 'rotate-180' : ''}`} />
                                        </div>
                                      </div>
                                      
                                      <AnimatePresence>
                                        {expandedHistoryId === hist.id && (
                                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className="p-3 bg-background border-t border-surface-border text-xs font-medium text-muted flex justify-between">
                                              <span>تاریخ ثبت: {hist.date}</span>
                                              {hist.resolution && <span>اقدام نهایی: {hist.resolution}</span>}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* مرحله دوم: موضوع */}
                    <div className={`bg-surface p-6 rounded-[1.5rem] border ${!selectedCustomer ? 'opacity-50 pointer-events-none' : 'border-surface-border'} shadow-sm space-y-4 relative z-20 transition-all`}>
                      <h3 className="font-bold text-foreground flex items-center gap-2"><Layers size={18} className="text-primary" /> ۲. ساختار درخت موضوعی درخواست</h3>
                      <div className="relative">
                        <label className="text-xs font-bold text-muted mb-2 block">انتخاب دسته موضوعی درخت دانش <span className="text-rose-500">*</span></label>
                        <div onClick={handleOpenTreeModal} className="relative z-20 flex items-center justify-between h-14 w-full rounded-xl border border-surface-border bg-background px-4 cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-all">
                          <span className={`text-sm font-medium ${selectedCategoryNode ? "text-foreground font-bold" : "text-muted"}`}>
                            {selectedCategoryNode ? selectedCategoryNode.name.replace(" > ", " / ") : "جهت باز شدن ساختار پاپ‌آپ کلیک کنید..."}
                          </span>
                          <ChevronDown size={18} className="text-muted" />
                        </div>
                      </div>
                    </div>

                    {/* مرحله سوم: فرم داینامیک */}
                    <AnimatePresence>
                      {selectedCategoryId && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface p-8 rounded-[1.5rem] border border-surface-border shadow-sm space-y-6 relative z-10">
                          <h3 className="font-bold text-primary flex items-center gap-2 border-b border-surface-border pb-4 text-lg">
                            <FileText size={20} className="text-primary" /> ۳. تکمیل فرم داینامیک مورد نیاز موضوع
                          </h3>
                          
                          {isLoadingForm ? (
                            <div className="flex justify-center items-center py-6">
                              <Loader2 size={24} className="animate-spin text-primary" />
                              <span className="ml-3 text-sm font-medium text-muted">در حال دریافت فیلدهای فرم...</span>
                            </div>
                          ) : dynamicFields.length === 0 ? (
                            <div className="text-sm font-medium text-muted py-4 text-center bg-background border border-dashed border-surface-border rounded-xl">
                              هیچ فرم اختصاصی ثبتی برای این موضوع نقشه وجود ندارد. می‌توانید تیکت را بدون پر کردن فرم بسازید.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                              {dynamicFields.map((field: any) => {
                                const fieldKey = field.field_id.toString();
                                
                                return (
                                <div key={fieldKey} className={`space-y-2 ${field.field_type === 'textarea' ? 'md:col-span-2' : ''}`}>
                                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                                    {field.label} {field.required && <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/40 text-[10px]">اجباری</span>}
                                  </label>
                                  
                                  {/* 🌟 فراخوانی کامپوننت هوشمند برای رندر فرم 🌟 */}
                                  <DynamicField 
                                    field={field} 
                                    value={newTicketFormData[fieldKey]} 
                                    onChange={(val) => handleFormChange(fieldKey, val)} 
                                  />
                                  
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              {/* دکمه‌های پایینی فرم تیکت جدید */}
              {!newTicketEngineData && (
                <div className="p-6 border-t border-surface-border bg-surface shrink-0 flex gap-3">
                  <button onClick={handleCloseCreateModal} className="flex-1 h-12 rounded-xl text-muted font-bold border border-surface-border bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">انصراف</button>
                  <button onClick={handleSubmitNewTicket} disabled={isSubmitting || (!selectedCustomer && !isNewCustomerForm) || !selectedCategoryId} className="w-2/3 h-12 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><GitMerge size={18} /> ثبت و مشاهده اقدام فرآیند</>}
                  </button>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* پاپ‌آپ درخت دانش موضوعی جهت انتخاب دسته */}
      <AnimatePresence>
        {showTreeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowTreeModal(false)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2"><Layers className="text-primary" /> درخت فرآیندی موضوعات سیستم</h3>
                <button onClick={() => setShowTreeModal(false)} className="p-1.5 text-muted hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-foreground rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="p-4 border-b border-surface-border shrink-0 bg-surface">
                 <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input 
                      autoFocus value={searchTreeQuery} onChange={(e) => setSearchTreeQuery(e.target.value)} placeholder="جستجوی موضوع فرآیند در درخت..."
                      className="w-full bg-background border border-surface-border h-12 pl-4 pr-12 text-sm font-medium rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                    />
                 </div>
              </div>

              <div className="p-4 overflow-y-auto custom-scrollbar bg-background flex-1 min-h-[300px] relative">
                {isLoadingTree ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted gap-3">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <span className="text-sm font-medium">در حال ارتباط با بانک درخت دانش...</span>
                  </div>
                ) : filteredTree.length === 0 ? (
                  <div className="text-center text-muted py-10 font-medium">موضوعی با مشخصات وارد شده یافت نشد.</div>
                ) : (
                  <div className="space-y-1 bg-surface p-4 rounded-2xl border border-surface-border shadow-sm">
                    {filteredTree.map(node => (
                      <SelectableTreeItem 
                        key={node.id} node={node} searchQuery={searchTreeQuery}
                        onSelect={(selectedNode: any) => {
                          setSelectedCategoryId(selectedNode.id);
                          setNewTicketFormData({});
                          setShowTreeModal(false);
                          setSearchTreeQuery("");
                        }}
                      />
                    ))}
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