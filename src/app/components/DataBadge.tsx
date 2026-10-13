import React from "react";
import { CheckCircle2, CloudOff, Database, Cpu, User, BookOpen } from "lucide-react";

export type DataStatus = 
  | "LIVE" 
  | "CACHED" 
  | "OFFLINE" 
  | "USER PROVIDED" 
  | "MODEL GENERATED" 
  | "STATIC REFERENCE";

interface DataBadgeProps {
  status: DataStatus;
  detail?: string;
  source?: string;
  className?: string;
  size?: "sm" | "md";
}

export function DataBadge({ status, detail, source, className = "", size = "sm" }: DataBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case "LIVE":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500 animate-pulse",
          icon: CheckCircle2,
          label: "LIVE"
        };
      case "CACHED":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
          icon: Database,
          label: "CACHED"
        };
      case "OFFLINE":
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-300",
          dot: "bg-slate-500",
          icon: CloudOff,
          label: "OFFLINE"
        };
      case "USER PROVIDED":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
          icon: User,
          label: "USER PROVIDED"
        };
      case "MODEL GENERATED":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          dot: "bg-purple-500",
          icon: Cpu,
          label: "MODEL GENERATED"
        };
      case "STATIC REFERENCE":
      default:
        return {
          bg: "bg-zinc-100 text-zinc-700 border-zinc-200",
          dot: "bg-zinc-400",
          icon: BookOpen,
          label: "STATIC REFERENCE"
        };
    }
  };

  const style = getBadgeStyle();
  const Icon = style.icon;

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border shadow-xs ${style.bg} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        <span>{style.label}</span>
        {detail && <span className="opacity-80 font-normal border-l border-current/20 pl-1.5">{detail}</span>}
        {source && <span className="opacity-70 font-normal italic">({source})</span>}
      </span>
    );
  }

  return (
    <div className={`flex items-center justify-between p-2 rounded-lg border text-xs ${style.bg} ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" />
        <div>
          <span className="font-bold tracking-wider">{style.label}</span>
          {detail && <span className="ml-1.5 font-medium opacity-90">• {detail}</span>}
        </div>
      </div>
      {source && (
        <span className="text-[11px] opacity-75 font-mono truncate max-w-[140px]">{source}</span>
      )}
    </div>
  );
}
