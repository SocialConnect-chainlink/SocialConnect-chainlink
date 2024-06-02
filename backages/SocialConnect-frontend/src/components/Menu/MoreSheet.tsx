import { Dispatch, SetStateAction } from "react";
import { X } from "lucide-react";
import Image from "next/image";

import { Complete } from "../Icon/Stauts";
import { FFButton } from "../ui/FFButton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { useAuthCore, useConnect, useEthereum } from "@particle-network/auth-core-modal";
import { IconName } from "../ui/iconName";
import { truncateString } from "@/utils/string.util";
import { useRouter } from "next/router";

export default function MoreSheet({
  isOpenForce = false,
  setIsOpenForce,
}: {
  isOpenForce: boolean;
  setIsOpenForce: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const { disconnect } = useConnect();
  const { chainInfo, address } = useEthereum();
  const { userInfo } = useAuthCore();

  const handleDisconnect = () => {
    disconnect();
    router.replace("/login");
  };


  return (
    <Sheet open={isOpenForce}>
      <SheetContent className="font-serif rounded-t-2xl h-[28%]" side="bottom">
        <SheetHeader className="h-full max-w-[500px] mx-auto">
          <SheetTitle className="flex justify-between items-center">
            <div />
            <SheetTrigger
              onClick={() => setIsOpenForce(false)}
              className="text-secondary"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </SheetTrigger>
          </SheetTitle>
          <SheetDescription className="flex flex-col text-start text-black pt-2 space-y-3">
            <div className="flex justify-between items-center border rounded-2xl p-3">
              <div className="flex flex-row items-center space-x-2">
                <IconName name={userInfo?.name || ""} className="w-14 h-14" />
                <div>
                  <div>{userInfo?.name}</div>
                  <div>{truncateString(address || "")}</div>
                </div>
              </div>
              <Complete width={24} height={24} />
            </div>
            <FFButton
              className="w-full"
              inside="bg-white"
              outside="border-[#EFEFEF] bg-[#EFEFEF]"
              onClick={handleDisconnect}
            >
              Log out
            </FFButton>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
