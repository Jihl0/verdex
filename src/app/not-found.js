"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/utils/AuthGuard";

export default function NotFound() {
  const router = useRouter();
  const { currentUser } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(currentUser ? "/dashboard" : "/sign-in");
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentUser, router]);

  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p>Redirecting you to {currentUser ? "dashboard" : "sign in"}...</p>
      </div>
    </AuthGuard>
  );
}
