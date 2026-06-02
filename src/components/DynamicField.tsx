import React from "react";
import { Input } from "@/components/ui/input";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface DynamicFieldProps {
  field: any;
  value: any;
  onChange?: (val: any) => void;
  readOnly?: boolean;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({ field, value, onChange, readOnly = false }) => {
  const fieldType = field.field_type;

  if (fieldType === "text" || fieldType === "int" || fieldType === "float") {
    return (
      <Input 
        type={fieldType === "text" ? "text" : "number"}
        value={value || ""} 
        onChange={(e) => onChange && onChange(e.target.value)} 
        readOnly={readOnly}
        placeholder={readOnly && !value ? "-" : ""}
        className="bg-background border-surface-border h-12 text-foreground font-medium disabled:opacity-70" 
      />
    );
  }

  if (fieldType === "textarea") {
    return (
      <textarea 
        value={value || ""} 
        onChange={(e) => onChange && onChange(e.target.value)} 
        readOnly={readOnly}
        rows={3} 
        placeholder={readOnly && !value ? "-" : ""}
        className="w-full rounded-xl border border-surface-border bg-background p-4 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none disabled:opacity-70" 
      />
    );
  }

  if (fieldType === "select") {
    // 🌟 در حالت فقط‌خواندنی، نیازی به باز شدن لیست کشویی نیست 🌟
    if (readOnly) {
      return (
        <Input 
          type="text"
          value={value || "-"} 
          readOnly={true}
          className="bg-background border-surface-border h-12 text-foreground font-medium disabled:opacity-70 cursor-default" 
        />
      );
    }

    return (
      <select 
        value={value || ""} 
        onChange={(e) => onChange && onChange(e.target.value)} 
        className="flex h-12 w-full rounded-xl border border-surface-border bg-background px-4 py-2 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
      >
        <option value="">انتخاب کنید...</option>
        {field.options?.split(",").map((opt: string, i: number) => (
          <option key={i} value={opt.trim()}>{opt.trim()}</option>
        ))}
      </select>
    );
  }

  if (fieldType === "multiselect") {
    const currentValues = Array.isArray(value) ? value : (typeof value === 'string' && value ? value.split(',') : []);
    
    // 🌟 در حالت فقط‌خواندنی، گزینه‌های انتخاب شده را به صورت تگ (Badge) نشان می‌دهیم 🌟
    if (readOnly) {
      return (
        <div className="flex flex-wrap gap-2 mt-1 min-h-[48px] items-center p-2 bg-background border border-surface-border rounded-xl">
          {currentValues.length > 0 ? (
            currentValues.map((v: string, i: number) => (
              <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-surface-border shadow-sm">
                {v.trim()}
              </span>
            ))
          ) : (
            <span className="text-sm font-medium text-muted px-2">-</span>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 p-4 bg-background border border-surface-border rounded-xl">
        <span className="text-xs text-muted font-bold mb-1">می‌توانید چند گزینه انتخاب کنید:</span>
        {field.options?.split(",").map((opt: string, i: number) => {
          const trimmedOpt = opt.trim();
          const isChecked = currentValues.includes(trimmedOpt);
          return (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isChecked}
                onChange={(e) => {
                  if (!onChange) return;
                  let newVals = [...currentValues];
                  if (e.target.checked) newVals.push(trimmedOpt);
                  else newVals = newVals.filter(v => v !== trimmedOpt);
                  onChange(newVals);
                }}
                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-surface accent-primary" 
              />
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{trimmedOpt}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (fieldType === "bool") {
    if (readOnly) {
      return (
        <div className="h-12 flex items-center px-4 bg-background border border-surface-border rounded-xl">
          <span className={`text-sm font-bold ${value ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {value ? '✅ تایید شده' : '❌ عدم تایید'}
          </span>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center gap-3 p-3 h-12 bg-background rounded-xl border border-surface-border transition-colors hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer" 
        onClick={() => onChange && onChange(!value)}
      >
        <input 
          type="checkbox" 
          checked={!!value} 
          onChange={(e) => onChange && onChange(e.target.checked)} 
          className="w-5 h-5 rounded border-slate-300 text-primary pointer-events-none accent-primary" 
        />
        <span className="text-sm font-bold text-foreground select-none">تایید و احراز صحت مورد</span>
      </div>
    );
  }

  if (fieldType === "date") {
    if (readOnly) {
      // 🌟 تبدیل تاریخ میلادی ISO به شمسی خوانا برای حالت فقط‌خواندنی 🌟
      let displayDate = value || "-";
      if (value) {
        try {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            // فرمت خروجی: ۱۴۰۵/۰۳/۱۰ - ۱۲:۲۰
            displayDate = new Intl.DateTimeFormat('fa-IR', { 
              year: 'numeric', month: '2-digit', day: '2-digit', 
              hour: '2-digit', minute: '2-digit' 
            }).format(d).replace(',', ' -');
          }
        } catch(e) {}
      }

      return (
        <Input 
          type="text"
          value={displayDate} 
          readOnly={true}
          className="bg-background border-surface-border h-12 text-foreground font-medium disabled:opacity-70 cursor-default" 
        />
      );
    }

    return (
      <DatePicker
        value={value ? new Date(value) : ""}
        onChange={(dateObj: any) => {
          if (onChange) {
            onChange(dateObj?.isValid ? dateObj.toDate().toISOString() : "");
          }
        }}
        calendar={persian}
        locale={persian_fa}
        containerClassName="w-full"
        inputClass="w-full bg-background border border-surface-border h-12 px-4 text-foreground font-medium rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
      />
    );
  }

  return null;
};