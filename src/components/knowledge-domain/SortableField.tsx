// src/components/knowledge-domain/SortableField.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { FormField } from "./types";

interface Props {
  field: FormField;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function SortableField({ field, isActive, onClick, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      onClick={onClick}
      className={`group relative flex items-center gap-4 p-4 mb-3 bg-white border-2 rounded-2xl cursor-pointer transition-all ${
        isActive ? "border-blue-500 shadow-md ring-4 ring-blue-500/10" : "border-slate-200 hover:border-slate-300 shadow-sm"
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
        <GripVertical size={20} />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">{field.label || "بدون عنوان"}</span>
          {field.required && <span className="text-red-500 text-[10px] font-black bg-red-50 px-1.5 py-0.5 rounded border border-red-100">اجباری</span>}
        </div>
        <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-black bg-slate-100 inline-block px-2 py-0.5 rounded-md border border-slate-200">
          {field.type}
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl transition-all"
        title="حذف فیلد"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}