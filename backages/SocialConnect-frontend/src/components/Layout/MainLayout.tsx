import ParticleProvider from "@/providers/particle.provider";
import AuthProvider from "@/providers/auth.provider";
import { usePathname } from "next/navigation";
import Bottombar from "./Bottombar";
import { Toaster } from "react-hot-toast";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const path = usePathname();
  return (
    <div className={`h-full max-w-[500px] mx-auto relative`}>
      <ParticleProvider>
        <AuthProvider>
          <div className="overflow-scroll min-h-full px-2">
            {children}
            {path !== "/login" && path !== "/register" && <Bottombar />}
          </div>
          <Toaster position="top-center" reverseOrder={true} />
        </AuthProvider>
      </ParticleProvider>
    </div>
  );
}
