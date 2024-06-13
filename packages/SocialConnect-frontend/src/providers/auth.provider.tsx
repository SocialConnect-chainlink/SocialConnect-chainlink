import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useUserInfo } from "@particle-network/auth-core-modal";

export default function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { userInfo } = useUserInfo();

  useEffect(() => {
    if (pathname !== "/login" && !userInfo) {
      router.replace("/login");
    }
    if (pathname === "/login" && userInfo) {
      router.replace("/register");
    }
  }, [userInfo, pathname, router]);

  return <>{children}</>;
}
