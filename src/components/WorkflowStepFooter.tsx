import { useState } from "react";
import { Loader2 } from "lucide-react";
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

export const CLEAR_CURRENT_STEP_CONFIRM_MSG =
  "⚠️ ยืนยันการล้างข้อมูล? ข้อมูลที่คุณเพิ่งกรอกในขั้นตอนนี้จะถูกลบทั้งหมดและไม่สามารถกู้คืนได้";

type WorkflowStepFooterNavProps = {
  showBack?: boolean;
  onBack?: () => void;
  showClear?: boolean;
  onConfirmClear?: () => void;
  clearLoading?: boolean;
};

/** ปุ่มนำทางด้านซ้ายของ Footer — ใช้ร่วมกันทุก Step */
export function WorkflowStepFooterNav({
  showBack = false,
  onBack,
  showClear = false,
  onConfirmClear,
  clearLoading = false,
}: WorkflowStepFooterNavProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleConfirmClear = () => {
    onConfirmClear?.();
    setClearDialogOpen(false);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {showBack && onBack && (
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          title="กลับไปดูขั้นตอนก่อนหน้า (ไม่ลบข้อมูล)"
          className="h-10"
        >
          ⬅️ กลับไปขั้นตอนก่อนหน้า
        </Button>
      )}
      {showClear && onConfirmClear && (
        <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={clearLoading}
              title="ล้างเฉพาะข้อมูลที่กรอกในขั้นตอนนี้"
              className="h-10 border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {clearLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              🔄 ล้างข้อมูลหน้านี้
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการล้างข้อมูล</AlertDialogTitle>
              <AlertDialogDescription>{CLEAR_CURRENT_STEP_CONFIRM_MSG}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirmClear();
                }}
              >
                ยืนยันการล้างข้อมูล
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
