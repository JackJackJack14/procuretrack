import { BookOpen } from "lucide-react";
import { useGuideMode } from "@/contexts/GuideModeContext";

/** สลับโหมดคู่มือ — แสดง Tooltip ฟิลด์ค้างไว้ทุกจุด */
export function GuideModeToggle() {
  const { guideMode, toggleGuideMode } = useGuideMode();

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground transition-colors">
      <input
        type="checkbox"
        className="h-3.5 w-3.5 accent-primary rounded"
        checked={guideMode}
        onChange={toggleGuideMode}
      />
      <BookOpen className="h-3.5 w-3.5 shrink-0" />
      <span>โหมดคู่มือเจ้าหน้าที่พัสดุ (แสดงคำอธิบายฟิลด์ค้างไว้)</span>
    </label>
  );
}
