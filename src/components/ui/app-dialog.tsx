"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { modalContentClass } from "@/components/ui/app-styles";

type AppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
};

function AppDialog({
  open,
  onOpenChange,
  title,
  children,
  className,
  maxWidth = "max-w-md",
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(modalContentClass, maxWidth, className)}
      >
        {title ? (
          <DialogTitle className="text-base font-bold tracking-tight">{title}</DialogTitle>
        ) : null}
        {children}
      </DialogContent>
    </Dialog>
  );
}

export { AppDialog };
