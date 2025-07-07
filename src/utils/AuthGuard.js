"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner"; // Create this component

export default function AuthGuard({ children }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/sign-in");
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return currentUser ? children : null;
}
