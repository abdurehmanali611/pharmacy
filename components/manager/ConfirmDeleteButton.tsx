"use client";

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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function ConfirmDeleteButton({
  label = "Delete",
  title,
  description,
  onConfirm,
  iconOnly = false,
  ariaLabel,
}: {
  label?: string;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  iconOnly?: boolean;
  ariaLabel?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size={iconOnly ? "icon-sm" : "sm"}
          variant="destructive"
          aria-label={iconOnly ? ariaLabel ?? label : undefined}
          title={iconOnly ? ariaLabel ?? label : undefined}
        >
          {iconOnly ? <Trash2 className="h-4 w-4" /> : label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="border-red-500/40 bg-red-600 font-semibold text-white hover:bg-red-500"
            onClick={() => void onConfirm()}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
