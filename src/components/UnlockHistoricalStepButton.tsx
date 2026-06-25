import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

type UnlockHistoricalStepButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
};

/** ปลดล็อกฟอร์มขั้นตอนที่ผ่านมาแล้ว — แก้ไขย่อยโดยไม่รีเซ็ตขั้นถัดไป */
export function UnlockHistoricalStepButton({
  onClick,
  disabled = false,
  size = "default",
  className,
}: UnlockHistoricalStepButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={disabled}
      className={className}
      title="ปลดล็อกฟอร์มเพื่อแก้ไขข้อมูลในขั้นตอนนี้ — ไม่ล้างข้อมูลขั้นถัดไป"
      onClick={onClick}
    >
      <Pencil className="h-4 w-4" />
      ปลดล็อกเพื่อแก้ไขข้อมูลขั้นตอนนี้
    </Button>
  );
}
