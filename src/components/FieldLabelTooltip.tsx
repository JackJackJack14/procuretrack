import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGuideMode } from "@/contexts/GuideModeContext";
import { cn } from "@/lib/utils";

type Props = {
  text?: string | null;
  className?: string;
};

/** ไอคอนคำอธิบายท้าย Label — Hover แสดง / Guide Mode เปิดค้าง */
export function FieldLabelTooltip({ text, className }: Props) {
  const { guideMode } = useGuideMode();
  const content = text?.trim();
  if (!content) return null;

  return (
    <Tooltip open={guideMode ? true : undefined}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            guideMode && "text-primary/70",
            className,
          )}
          aria-label="คำอธิบายฟิลด์นี้"
          onClick={(e) => e.preventDefault()}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-sm text-left text-xs leading-relaxed font-normal bg-popover text-popover-foreground border border-border shadow-md px-3 py-2 z-[60]"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
