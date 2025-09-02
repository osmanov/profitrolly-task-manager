import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-base placeholder:text-blue-600 outline-none focus:border-blue-500 focus:bg-white focus:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-blue-900",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
