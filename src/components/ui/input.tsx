"use client";

import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const cls = [
      "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm transition-all",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return <input ref={ref} className={cls} {...props} />;
  }
);
Input.displayName = "Input";

export default Input;
