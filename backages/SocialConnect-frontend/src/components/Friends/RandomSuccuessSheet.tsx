import useWindowSize from "react-use/lib/useWindowSize";
import Confetti from "react-confetti";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { FFButton } from "../ui/FFButton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import FriendFoundCard from "./FriendFoundCard";
import { useRouter } from "next/router";
import { useFriendFi } from "@/hooks/useFriendFi";
import { backend } from "@/services/backend";

export default function RandomSuccessSheet({
  isOpenForce = false,
  setIsOpenForce,
  found = [],
}: {
  isOpenForce?: boolean;
  setIsOpenForce: Dispatch<SetStateAction<boolean>>;
  found?: { id: number; value: number }[];
}) {
  const { width, height } = useWindowSize();
  const router = useRouter();
  const [foundFriends, setFoundFriends] = useState<any[]>([]);

  const { fetchUUIDbyTokenId } = useFriendFi();

  const foundFriend = useCallback(async () => {
    if (found && found.length > 0) {
      const _uuid: string[] = [];
      const uuids = await Promise.all(
        found.map(async (f) => {
          const uuid = await fetchUUIDbyTokenId(f.id.toString());
          _uuid.push(uuid);
          return {
            amount: f.value,
            uuid: uuid,
          };
        })
      );
      if (_uuid.length > 0) {
        const res = await backend.getUser(_uuid.join(","));
        console.log(res);
        return uuids.map((item) => {
          return {
            ...item,
            name:
              res?.data.data.find((i: any) => i.uuid === item.uuid)?.name || "",
          };
        });
      }
    }
  }, [found]);

  useEffect(() => {
    (async () => {
      const _found = await foundFriend();
      if (_found) setFoundFriends(_found);
    })();
  }, [foundFriend]);
  return (
    <Sheet open={isOpenForce}>
      <SheetContent className="font-serif h-full" side="bottom">
        <SheetHeader className="h-full max-w-[500px] mx-auto py-6">
          <SheetDescription className="min-h-52 font-sans flex flex-col justify-between items-center text-center text-black h-full">
            <div />
            <div className="space-y-3 flex flex-col items-center">
              <Carousel>
                <CarouselContent>
                  {foundFriends.map((friend, index) => (
                    <CarouselItem key={index} className="basis-[100%]">
                      <FriendFoundCard {...friend} className="w-full" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {foundFriends.length > 0 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
              <div className="font-medium text-2xl pt-6">
                You got new friends!
              </div>
              <div className="text-tertiary text-sm">
                Congratulations! You have proven your friends <br />
                and unlocked a discover badge
              </div>
            </div>
            <div className="w-full">
              <FFButton
                className="font-serif w-full"
                onClick={() => {
                  setIsOpenForce(false);
                  router.reload();
                }}
              >
                Find More friend
              </FFButton>
            </div>
            <Confetti width={width} height={height} recycle={false} />
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
