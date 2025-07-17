"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/sign-in");
  }, []);

  return (
    <div>
      <p>This page is not used.</p>
    </div>
  );
}
