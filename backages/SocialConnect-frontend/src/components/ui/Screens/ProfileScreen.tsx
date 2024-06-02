import React, { useEffect, useMemo } from "react";

import { formatDateString } from "@/utils/date.util";

import { Button } from "../button";
import More from "@/components/Icon/More";
import MenuTab from "@/components/Menu/MenuTab";
import MoreSheet from "@/components/Menu/MoreSheet";
import { IconName } from "../iconName";
import Merge from "@/components/Icon/Merge";
import MergeSheet from "@/components/Menu/MergeSheet";
import { useEthereum } from "@particle-network/auth-core-modal";
import toast from "react-hot-toast";
import { useFriendFi } from "@/hooks/useFriendFi";

export default function ProfileScreen({
  name,
  socialMediaLink,
  userInfo,
  isOpen,
  setIsOpen,
  mode = "me",
}: {
  name: string;
  socialMediaLink: React.ReactNode;
  userInfo?: import("@particle-network/auth-core").UserInfo;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  mode: "me" | "friend";
}) {
  const { address } = useEthereum();
  const [mergeStateSheet, setMergeStateSheet] = React.useState<
    "merge" | "complete"
  >("merge");
  const {
    fetchFriendKeys,
    friendKeyWhiteList,
    friendKeyWhiteListHolding,
    friendKeys,
    fetchAddressByUUID,
    fetchIdByAddress,
    merge,
  } = useFriendFi();
  const handleMerge = async (level: string) => {
    const address = await fetchAddressByUUID(userInfo?.uuid || "");
    const id = await fetchIdByAddress(address);
    console.log("id", id.toString(), "level:", level);
    const tx_hash = await merge(id.toString(), level);
    console.log("merge: tx_hash", tx_hash);
    setMergeStateSheet("complete");
  };

  useEffect(() => {
    (async () => await fetchFriendKeys())();
  }, [fetchFriendKeys]);

  const keyTier = useMemo(() => {
    const f = friendKeyWhiteList.filter(({ uuid }) => uuid === userInfo?.uuid);
    const highestTier = f.reduce(
      (acc: number, curr: { uuid: string; tier: string }) => {
        if (+curr.tier > acc) return +curr.tier;
        return acc;
      },
      -1
    );
    return highestTier;
  }, [friendKeyWhiteList, userInfo?.uuid]);

  const keyAmount = useMemo(() => {
    console.log("friendKeyWhiteListHolding", friendKeyWhiteListHolding);
    const keys = [0, 0, 0];
    if (!friendKeyWhiteListHolding || friendKeyWhiteListHolding.length === 0) return keys;
    friendKeyWhiteListHolding.forEach((item) => {
      if (+item.tier === 0) keys[0]++;
      if (+item.tier === 1) keys[1]++;
      if (+item.tier === 2) keys[2]++;
    });
    return keys;
  }, [friendKeyWhiteListHolding]);

  const friendInfo = useMemo(() => {
    return friendKeys.find((item) => item.uuid === userInfo?.uuid);
  }, [friendKeys, userInfo?.uuid]);

  if (name === "") return <></>;

  return (
    <div className="text-sm font-sans flex flex-col w-full">
      <div className="w-full h-32 bg-[#2B2A4D] relative">
        <div className="absolute -bottom-10 left-3 bg-white p-1 rounded-full">
          <IconName name={name} className="w-20 h-20" />
          {/* <Image
        src={userInfo?.avatar || ""}
        alt="my profile logo"
        width={20}
        height={20}
      /> */}
        </div>
      </div>
      <div className="flex justify-end pt-6 px-6 space-x-2">
        {mode === "me" ? (
          <Button
            className="py-1 rounded-xl bg-[#EAEFF4] text-black focus:bg-[#EAEFF9]"
            onClick={() => mode === "me" && setIsOpen && setIsOpen(true)}
          >
            <More />
          </Button>
        ) : (
          <Button
            className="py-1 rounded-xl"
            onClick={() =>
              mode === "friend" &&
              setIsOpen &&
              (setMergeStateSheet("merge"), setIsOpen(true))
            }
          >
            <Merge />
            Merge
          </Button>
        )}
      </div>
      <div className="flex space-x-2 items-center">
        <h2 className="text-lg font-medium">{name}</h2>
        {socialMediaLink}
      </div>
      {mode === "me" ? (
        <span
          className=" cursor-pointer"
          onClick={() => {
            toast.success("Copy address to clipboard!!");
            navigator.clipboard.writeText(address || "");
          }}
        >
          {address}
        </span>
      ) : (
        <div />
      )}
      <div className="text-secondary mt-3">
        Joined
        {userInfo &&
          userInfo.created_at &&
          formatDateString(userInfo?.created_at || "")}
      </div>
      {mode === "me" && (
        <span className="mt-1 text-secondary">
          <span className="text-black">{keyAmount[0]}</span> Common{" "}
          <span className="text-black">{keyAmount[1]}</span> Close{" "}
          <span className="text-black">{keyAmount[2]}</span> Best
        </span>
      )}
      <MenuTab
        name={userInfo?.name || ""}
        uuid={userInfo?.uuid || ""}
        highestTier={keyTier}
      />
      {mode === "me" && isOpen && setIsOpen && (
        <MoreSheet isOpenForce={isOpen} setIsOpenForce={setIsOpen} />
      )}
      {mode === "friend" && isOpen && setIsOpen && (
        <MergeSheet
          isOpenForce={isOpen}
          setIsOpenForce={setIsOpen}
          data={{ name, subName: "" }}
          onMerge={handleMerge}
          state={mergeStateSheet}
          friendInfo={friendInfo}
        />
      )}
    </div>
  );
}
