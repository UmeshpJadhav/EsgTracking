"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignOutButton() {
  const handleSignOut = () => {
    void signOut({ callbackUrl: "/login", redirect: true });
  };

  return (
    <Button type="button" onClick={handleSignOut}>
      Logout
    </Button>
  );
}


