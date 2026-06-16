"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { fieldLabelClass } from "@/components/ui/app-styles";

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label className={cn(fieldLabelClass, className)} {...props} />;
}

export { FieldLabel };
