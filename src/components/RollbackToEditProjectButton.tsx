import { Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ROLLBACK_TO_EDIT_PROJECT_CONFIRM_MSG } from "@/lib/project-basics-edit";

type RollbackToEditProjectButtonProps = {
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "secondary";
  className?: string;
};

/** ปุ่มถอยกลับเพื่อแก้ไขข้อมูลสาระสำคัญ — แสดงทุกขั้นตอนที่ > 1 */
export function RollbackToEditProjectButton({
  onConfirm,
  loading = false,
  size = "sm",
  variant = "outline",
  className,
}: RollbackToEditProjectButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={loading}
          className={className}
          title="ถอยกลับไปขั้นตอนที่ 1 เพื่อแก้ไขงบประมาณและวิธีจัดซื้อ"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Undo2 className="h-3.5 w-3.5" />
          )}
          ถอยกลับเพื่อแก้ไขโครงการ
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการถอยกลับเพื่อแก้ไขโครงการ</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {ROLLBACK_TO_EDIT_PROJECT_CONFIRM_MSG}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            ยืนยันถอยกลับ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
