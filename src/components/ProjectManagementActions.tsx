import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { deleteProjectAndRelatedData } from "@/lib/delete-project";
import { canEnableProjectBasicsEditButton } from "@/lib/project-workflow-core";
import { shouldShowRollbackToEditProjectButton } from "@/lib/project-basics-edit";
import { RollbackToEditProjectButton } from "@/components/RollbackToEditProjectButton";

type ProjectManagementActionsProps = {
  projectId: string;
  projectName: string;
  currentStep: number;
  /** เรียกเมื่อกดแก้ไข — เฉพาะขั้นตอนที่ 1 */
  onEditProject?: () => void;
  /** ถอยกลับไปขั้นตอนที่ 1 เพื่อแก้ไขสาระสำคัญ */
  onRollbackToEdit?: () => void | Promise<void>;
  rollbackLoading?: boolean;
  /** หลังลบสำเร็จ */
  onDeleted?: () => void;
  className?: string;
};

export function ProjectManagementActions({
  projectId,
  projectName,
  currentStep,
  onEditProject,
  onRollbackToEdit,
  rollbackLoading = false,
  onDeleted,
  className,
}: ProjectManagementActionsProps) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const canEditBasics = canEnableProjectBasicsEditButton(currentStep);
  const showRollback = shouldShowRollbackToEditProjectButton(currentStep);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await deleteProjectAndRelatedData(projectId);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("ยกเลิกโครงการแล้ว");
      onDeleted?.();
      navigate({ to: "/projects" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {canEditBasics && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="แก้ไขชื่อโครงการ งบประมาณ และวิธีจัดซื้อ"
          onClick={onEditProject}
        >
          <Pencil className="h-3.5 w-3.5" />
          แก้ไขข้อมูลโครงการ
        </Button>
      )}

      {showRollback && onRollbackToEdit && (
        <RollbackToEditProjectButton
          onConfirm={onRollbackToEdit}
          loading={rollbackLoading}
        />
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" size="sm" disabled={deleting}>
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            ยกเลิกโครงการ
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการยกเลิกโครงการ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการยกเลิกโครงการ «{projectName}» ใช่หรือไม่?
              ข้อมูลทั้งหมดใน Workflow จะถูกลบออกถาวร
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ไม่ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              ยืนยันลบถาวร
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
