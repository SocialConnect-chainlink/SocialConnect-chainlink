import { IconName } from "../ui/iconName";
import { FriendLevel } from "@/constants/friendLevel";
import { calculateMinutesDifference } from "@/utils/time.util";
import { useEffect, useMemo, useState } from "react";
import { Best, Close, Common } from "../Icon/Role";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuthCore } from "@particle-network/auth-core-modal";

interface PostItemProps {
  name: string;
  createdAt: Date;
  content: string;
  image?: string;
  level: FriendLevel;
  uuid: string;
}

export default function PostItem({
  name,
  createdAt,
  content,
  image,
  level,
  uuid,
}: PostItemProps) {
  const [postDiff, setPostDiff] = useState<number>(
    calculateMinutesDifference(createdAt)
  );
  const router = useRouter();
  const { userInfo } = useAuthCore();

  const levelIcon = useMemo(() => {
    switch (+level) {
      case 2:
        return <Best />;
      case 1:
        return <Close />;
      case 0:
        return <Common />;
      default:
        return <div />;
    }
  }, [level]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPostDiff(calculateMinutesDifference(createdAt));
    }, 60000);

    return () => clearInterval(intervalId);
  }, [createdAt]);
  return (
    <div className="font-sans space-y-4">
      <div className="flex justify-between items-center">
        <button
          className="space-x-2 flex items-center"
          onClick={() =>
            userInfo?.uuid === uuid
              ? router.push("/menu")
              : router.push(`/friend?id=${uuid}`)
          }
        >
          <IconName name={name} />
          <div className="text-start">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-tertiary text-xs font-normal">
              {postDiff} minutes ago
            </p>
          </div>
        </button>
        {levelIcon}
      </div>
      <p className="text-start text-sm">{content}</p>
      {image && <Image src={image} alt="post" className="w-full" fill />}
    </div>
  );
}
