import React, { useMemo } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useFriendFi } from "@/hooks/useFriendFi";
import { Search, Notification } from "../Icon";
import { useRouter } from "next/router";

// TODO: handle this
export default function Topbar() {
  const pathname = usePathname();
  const {} = useFriendFi();
  const router = useRouter();

  const parsePathName = pathname?.split("/")[1];

  const Header = useMemo(() => {
    switch (parsePathName) {
      case "":
        return (
          <div className="flex justify-between items-center pt-6">
            <div className="flex space-x-2">
              <Image
                className="cursor-pointer"
                onClick={() => router.push("/")}
                src="/logo.svg"
                width={28}
                height={28}
                alt="friendfi logo"
              />
              <h1 className="text-2xl font-sans font-bold">friendfi</h1>
            </div>

            <div className="flex space-x-2">
              <Search />
              <Notification />
            </div>
          </div>
        );
      case "friend":
        // TODO: not found
        if (!router.query.id)
          return (
            <div className="flex justify-between items-center pt-6">
              <div className="flex space-x-2">
                <Image
                  src="/logo.svg"
                  width={28}
                  height={28}
                  alt="friendfi logo"
                />
                <h1 className="text-2xl font-sans font-bold">friendfi</h1>
              </div>

              <div className="flex space-x-2">
                <Search />
                <Notification />
              </div>
            </div>
          );
        return;
      // return (
      //   <div className="flex justify-end">
      //     <Search />
      // <Notification />
      //   </div>
      // );
      case "friends":
        return (
          <div className="flex justify-between items-center pt-6">
            {/* <div /> */}
            <h1 className="text-lg font-sans font-medium">Friends</h1>
            <div className="flex space-x-2">
              <Search />
              <Notification />
            </div>
          </div>
        );
      case "market":
        return (
          <div className="flex justify-between items-center pt-6">
            {/* <div /> */}
            <h1 className="text-lg font-sans font-medium">Marketplace</h1>
            <div className="flex space-x-2">
              <Search />
              <Notification />
            </div>
          </div>
        );
      case "search":
        return (
          <div className="flex justify-between items-center pt-6">
            <div className="flex items-center space-x-3">
              <Image
                className="cursor-pointer"
                onClick={() => router.push("/")}
                src="/logo.svg"
                width={28}
                height={28}
                alt="friendfi logo"
              />
              <h1 className="text-lg font-sans font-medium">Search</h1>
            </div>

            <div className="flex space-x-2">
              <Search />
              <Notification />
            </div>
          </div>
        );
      // case "/menu":
      //   return (
      //     <div className="flex justify-between items-end">
      //       <div className="flex space-x-2">
      //         <Image
      //           src="/logo.svg"
      //           width={28}
      //           height={28}
      //           alt="friendfi logo"
      //         />
      //         <h1 className="text-2xl font-sans font-bold">
      //           Menu
      //         </h1>
      //       </div>

      //       <div className="flex space-x-2">
      //         <Search />
      //         <Notification />
      //       </div>
      //     </div>
      //   );
      default:
        return;
    }
  }, [pathname, router.query.id, parsePathName]);

  return <div className="w-full">{Header}</div>;
}
