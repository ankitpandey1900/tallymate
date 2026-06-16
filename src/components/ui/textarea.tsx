import * as React from "react"

import { cn } from "@/lib/utils"
import { fieldInputClass } from "@/components/ui/app-styles"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16",
        fieldInputClass,
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
