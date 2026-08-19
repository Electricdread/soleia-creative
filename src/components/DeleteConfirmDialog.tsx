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
} from '@/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  /** Text on the confirming button. */
  confirmLabel?: string;
  /** Reserve the destructive styling for actions that actually destroy something. */
  destructive?: boolean;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  trigger,
  title = 'Are you sure?',
  description = 'This action cannot be undone. This will permanently delete this item.',
  confirmLabel = 'Delete',
  destructive = true,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
