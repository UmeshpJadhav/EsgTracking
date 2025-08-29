"use client";

import * as React from "react";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const cls = ["text-sm font-medium text-gray-900", className].filter(Boolean).join(" ");
  return <label className={cls} {...props} />;
}

export default Label;


