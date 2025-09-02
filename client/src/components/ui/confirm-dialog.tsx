import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="confirm-dialog" className="bg-white dark:bg-white border border-gray-200 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => {
              if (onCancel) onCancel();
              onOpenChange(false);
            }}
            data-testid="confirm-dialog-cancel"
            className="bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200"
          >
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            data-testid="confirm-dialog-confirm"
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Продолжить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}