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
  variant?: "outline" | "secondary" | "destructive";
  className?: string;
};

/** ปุ่มถอยกลับและรีเซ็ต Workflow — ใช้เมื่อต้องแก้งบประมาณ/วิธีจัดซื้อ (ล้างขั้นถัดไป) */
export function RollbackToEditProjectButton({
  onConfirm,
  loading = false,
  size = "sm",
  variant = "destructive",
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
          title="ถอยกลับไปขั้นตอนที่ 1 และล้างข้อมูลขั้นตอนถัดไปทั้งหมด"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Undo2 className="h-3.5 w-3.5" />
          )}
          ถอยกลับและเริ่มทำใหม่ (Reset Workflow)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการถอยกลับและเริ่มทำใหม่</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {ROLLBACK_TO_EDIT_PROJECT_CONFIRM_MSG}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
          >
            ยืนยัน Reset Workflow
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
