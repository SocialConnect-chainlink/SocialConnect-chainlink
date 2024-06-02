import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import Confetti from "react-confetti";
import { X, ArrowBigUpDash } from "lucide-react";
import {
  useAuthCore,
  useConnect,
  useEthereum,
} from "@particle-network/auth-core-modal";
import { useRouter } from "next/router";
import useWindowSize from "react-use/lib/useWindowSize";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FFButton } from "../ui/FFButton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { IconName } from "../ui/iconName";
import FriendFoundCard from "../Friends/FriendFoundCard";
import { Best, Close, Common } from "../Icon/Role";
import Check from "../Icon/Check";

import { truncateString } from "@/utils/string.util";
import { cn } from "@/lib/utils";

type FriendKey = {
  uuid: string;
  tokenId: number;
  tokenUri: string;
  name: string;
  description: string;
  asset_url: string;
  tier: {
    contractAddress: string;
    level: string;
    balance: string;
  }[];
};

export default function MergeSheet({
  data,
  isOpenForce = false,
  setIsOpenForce,
  state,
  onMerge,
  friendInfo,
}: {
  data: {
    name: string;
    subName: string;
  };
  isOpenForce: boolean;
  setIsOpenForce: Dispatch<SetStateAction<boolean>>;
  state: "merge" | "complete";
  onMerge?: (level: string) => void;
  friendInfo?: FriendKey;
}) {
  const { width, height } = useWindowSize();
  const router = useRouter();

  const [tierUsed, setTierUsed] = useState(0);

  const [TierAmount, amount] = useMemo(() => {
    const TierAmount = [0, 0, 0];
    if (!friendInfo) return [TierAmount, 0];
    const tier = friendInfo.tier.reduce(
      (
        acc: {
          contractAddress: string;
          level: string;
          balance: string;
        }[],
        cur
      ) => {
        const found = acc.some(
          (obj) =>
            Object.values(obj).toString() === Object.values(cur).toString()
        );
        if (!found) {
          acc.push(cur);
        }
        return acc;
      },
      []
    );
    tier.forEach((item) => {
      if (+item.level === 0) TierAmount[0] += +item.balance;
      if (+item.level === 1) TierAmount[1] += +item.balance;
      if (+item.level === 2) TierAmount[2] += +item.balance;
    });
    return [TierAmount, TierAmount[tierUsed]];
  }, [friendInfo, tierUsed]);

  const Tier = useCallback((tier: number) => {
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
  }, []);

  const TierText = useCallback((tier: number) => {
    switch (tier) {
      case 0:
        return "Common";
      case 1:
        return "Close";
      case 2:
        return "Best";
      default:
        return "Common";
    }
  }, []);
  const Content = useMemo(() => {
    switch (state) {
      case "merge":
        return (
          <>
            <div className="flex flex-col justify-center items-center w-full mb-20">
              <div className="w-1/3">
                <FriendFoundCard
                  name={data.name}
                  subName={data.subName}
                  amount={0}
                  className="py-4"
                  tier={tierUsed + 1}
                />
              </div>
              <ArrowBigUpDash width={100} height={100} />
              <div className="flex space-x-10">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    className={cn("flex flex-col items-center relative")}
                    key={index}
                  >
                    {Tier(tierUsed)}
                    <div className="absolute -z-10 top-2">
                      <IconName
                        name={data.name}
                        className={cn(
                          "w-20 h-20",
                          amount >= index + 1 && "opacity-50"
                        )}
                      />
                    </div>
                    {amount >= index + 1 && (
                      <div className="absolute top-10">
                        <Check />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center text-lg">
              {TierAmount[2]} Best {TierAmount[1]} Close {TierAmount[0]} Common
            </div>
            <div className="w-full flex justify-center">
              <Select
                value={tierUsed.toString()}
                onValueChange={(value) => setTierUsed(+value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Best</SelectItem>
                  <SelectItem value="0">Close</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FFButton
              className="w-full mt-4"
              onClick={() => onMerge && onMerge(tierUsed.toString())}
              disabled={amount < 3}
            >
              {amount < 3 ? "Not enough" : "Merge Now"}
            </FFButton>
          </>
        );
      case "complete":
        return (
          <>
            <div className="flex flex-col justify-center items-center w-full space-y-3">
              <div className="w-1/2">
                <FriendFoundCard
                  name={data.name}
                  subName={data.subName}
                  amount={0}
                  className=""
                  tier={tierUsed + 1}
                />
              </div>
              <div className="text-xl text-center font-medium">
                Your merge {TierText(tierUsed + 1)} friend on <br /> this level!
              </div>
              <div className="text-tertiary text-sm text-center">
                Now you can access to the close friend content. <br />
                You become a close friend of Vitalik Buterin
              </div>
            </div>
            <FFButton
              className="w-full mt-20"
              onClick={() => {
                setIsOpenForce(false);
                router.reload();
              }}
            >
              Got it
            </FFButton>
            <Confetti width={width} height={height} recycle={false} />
          </>
        );
      default:
        return;
    }
  }, [state, data.name, data.subName, tierUsed, TierAmount, amount, TierText, width, height, Tier, onMerge, setIsOpenForce, router]);
  return (
    <Sheet open={isOpenForce}>
      <SheetContent className="font-serif rounded-t-2xl h-[80%]" side="bottom">
        <SheetHeader className="h-full max-w-[500px] mx-auto">
          <SheetTitle className="flex justify-between items-center">
            <div />
            {state === "merge" && <div>Merge</div>}
            <SheetTrigger
              onClick={() => setIsOpenForce(false)}
              className="text-secondary"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </SheetTrigger>
          </SheetTitle>
          <SheetDescription className="flex flex-col text-start text-black pt-2 space-y-3 w-full">
            {Content}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
