import * as React from "react";

import { cn } from "@/lib/utils";
import { nativeSelectClass } from "@/components/ui/app-styles";

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(nativeSelectClass, className)} {...props} />;
}

export { NativeSelect };
