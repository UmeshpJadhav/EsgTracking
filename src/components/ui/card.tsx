"use client";

import * as React from "react";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cls = ["rounded-lg border border-border bg-card text-card-foreground shadow-sm", className].filter(Boolean).join(" ");
  return <div className={cls} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cls = ["flex flex-col space-y-1.5 p-6", className].filter(Boolean).join(" ");
  return <div className={cls} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const cls = ["text-xl font-semibold leading-none tracking-tight", className].filter(Boolean).join(" ");
  return <h3 className={cls} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const cls = ["text-sm text-muted-foreground", className].filter(Boolean).join(" ");
  return <p className={cls} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cls = ["p-6 pt-0", className].filter(Boolean).join(" ");
  return <div className={cls} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cls = ["flex items-center p-6 pt-0", className].filter(Boolean).join(" ");
  return <div className={cls} {...props} />;
}


