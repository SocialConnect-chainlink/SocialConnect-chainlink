import { useCallback } from "react";
import { IconName } from "../ui/iconName";
import { useRouter } from "next/router";

interface FriendCardProps {
  name: string;
  subName: string;
  keys: {
    common: number;
    close: number;
    best: number;
  };
  uuid: string;
}

export default function FriendCard({ name, subName, keys, uuid }: FriendCardProps) {
  const KeyItems = useCallback((type: string, amount: number) => {
    return (
      <div>
        <div className="font-medium">{amount}</div>
        <div className="text-tertiary text-xs">{type}</div>
      </div>
    );
  }, []);
  const router = useRouter();

  return (
    <div className="flex justify-between w-full border rounded-xl py-3 px-5 items-center cursor-pointer" onClick={() => router.push(`/friend?id=${uuid}`)}>
      <div className="flex space-x-3 items-center">
        <IconName name={name} />
        <div className="text-start">
          <div className="font-medium text-sm">{name}</div>
          <div className="text-tertiary text-xs">{subName}</div>
        </div>
      </div>
      <div className="flex space-x-6">
        {KeyItems("best", keys.best)}
        {KeyItems("close", keys.close)}
        {KeyItems("common", keys.common)}
      </div>
    </div>
  );
}
