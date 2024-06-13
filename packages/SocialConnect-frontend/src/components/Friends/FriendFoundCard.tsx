import { cn } from "@/lib/utils";
import { Best, Close, Common } from "../Icon/Role";
import { IconName } from "../ui/iconName";
import { useMemo } from "react";
import { FriendLevel } from "@/constants/friendLevel";

interface FriendFoundCardProps {
  name: string;
  subName: string;
  amount: number;
  className?: string;
  tier?: FriendLevel;
}

export default function FriendFoundCard({
  name,
  subName,
  amount,
  className,
  tier = 0,
}: FriendFoundCardProps) {
  const Tier = useMemo(() => {
    switch (tier) {
      case 0:
        return <Common />;
      case 1:
        return <Close />;
      case 2:
        return <Best />;
      default:
        return <Common />;
    }
  }, [tier]);
  return (
    <div
      className={cn(
        "flex flex-col items-center border rounded-3xl py-10 px-6 font-sans space-y-3",
        className
      )}
    >
      <IconName name={name} className="w-16 h-16" />
      <div>
        <div className="font-semibold text-base">{name}</div>
        <div className="text-tertiary text-xs">{subName}</div>
      </div>
      {Tier}
      {/* <div className="text-lg">{amount > 0 && amount}</div> */}
    </div>
  );
}
