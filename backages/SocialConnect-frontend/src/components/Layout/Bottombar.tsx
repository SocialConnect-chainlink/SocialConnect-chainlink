import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { BOTTOM_MENU_ITEMS } from "@/constants/menu";
import React from "react";

export default function Bottombar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex justify-center fixed bottom-0 z-10 font-sans">
      <div className="flex justify-center border p-3 px-4 md:px-10 mb-5 rounded-full shadow-sm w-full bg-white ">
        <div className="flex items-center space-x-8 md:space-x-12 select-none text-gray-800">
          {BOTTOM_MENU_ITEMS.map((item) => {
            const isActived =
              item.path === "/" || pathname?.includes("search")
                ? pathname === "/"
                : pathname?.includes(item.path);
            return (
              <button
                onClick={() => router.push(item.path)}
                key={item.path}
                className={`flex flex-col items-center ${
                  isActived || item.name === "Chat"
                    ? "cursor-default"
                    : "cursor-pointer hover:opacity-70"
                } ${item.name === "Chat" ? "opacity-30" : ""}`}
                disabled={item.name === "Chat"}
              >
                <div className="w-6 h-6">
                  <item.icon strokeWidth={isActived ? 2.5 : 2} />
                </div>
                <p className={`${isActived ? "font-semibold" : "font-normal"}`}>
                  {item.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
