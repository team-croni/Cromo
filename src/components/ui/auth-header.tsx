'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@components/ui/button";

export default function AuthHeader() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center gap-4">
      {session ? (
        <div className="flex items-center gap-4">
          <span className="text-sm">Welcome, {session.user?.name}</span>
          <Button onClick={() => signOut()} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
      ) : (
        <Button onClick={() => signIn("google")} size="sm">
          Sign in with Google
        </Button>
      )}
    </div>
  );
}