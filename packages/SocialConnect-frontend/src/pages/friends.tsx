import FriendCard from "@/components/Friends/FriendCard";
import RandomLoadingSheet from "@/components/Friends/RandomLoadingSheet";
import RandomSuccessSheet from "@/components/Friends/RandomSuccuessSheet";
import Present from "@/components/Icon/Present";
import { FFButton } from "@/components/ui/FFButton";
import { IconName } from "@/components/ui/iconName";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBalance } from "@/hooks/useBalance";
import { MintedKey, useFriendFi } from "@/hooks/useFriendFi";
import { useEffect, useMemo, useState } from "react";

export default function Friends() {
  const { value } = useBalance();
  const [randomAmount, setRandomAmount] = useState(1);
  const [currentTab, setCurrentTab] = useState<"discover" | "listFriends">(
    "listFriends"
  );
  const [loadingSheetVisible, setLoadingSheetVisible] = useState(false);
  const [successSheetVisible, setSuccessSheetVisible] = useState(false);
  const [mintResult, setMintResult] = useState<MintedKey[]>([]);

  const { mintFee, friendKeys, batchMint, fetchFriendKeys, waitForMintResult } =
    useFriendFi();

  const friendList = useMemo(() => {
    return friendKeys.map((friendKey) => ({
      name: friendKey.name,
      subName: "",
      keys: {
        common: +(friendKey.tier.find((t) => t.level === "0")?.balance || 0),
        close: +(friendKey.tier.find((t) => t.level === "1")?.balance || 0),
        best: +(friendKey.tier.find((t) => t.level === "2")?.balance || 0),
      },
      uuid: friendKey.uuid
    }));
  }, [friendKeys]);

  useEffect(() => {
    fetchFriendKeys();
  }, [fetchFriendKeys]);

  const changeRandomAmount = (amount: number) => {
    setRandomAmount((randomAmount) =>
      randomAmount + amount > 0 ? randomAmount + amount : 1
    );
  };

  const handleMint = async () => {
    try {
      const txHash = await batchMint(randomAmount);
      console.log("Hash: ", txHash);
      setLoadingSheetVisible(true);
      const result = await waitForMintResult(txHash);
      console.log('Mint:', result);
      setMintResult(result);
      setLoadingSheetVisible(false);
      setSuccessSheetVisible(true);
    } catch (e) {
      console.error(e);
    }
    setLoadingSheetVisible(false);
  };

  const fee = useMemo(() => {
    return randomAmount * mintFee;
  }, [randomAmount, mintFee]);

  const openText = useMemo(() => {
    const feeStr = fee.toLocaleString();
    return fee > value
      ? `Insuffient Funds: ${feeStr} ETH`
      : `${fee > 0 ? `${feeStr} ETH` : ""}`;
  }, [fee, value]);

  return (
    <div className="pt-7 font-sans">
      <Tabs
        defaultValue="listFriends"
        value={currentTab}
        onValueChange={(value) =>
          setCurrentTab(value as "discover" | "listFriends")
        }
        className="w-full h-full"
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="discover">
            <div className="flex items-center space-x-1">
              <div>Discover</div>
              {/* {free && free > 0 && (
                <div className="border border-[#E6E6E8] text-secondary text-xs rounded-lg px-2">
                  {free}
                </div>
              )} */}
            </div>
          </TabsTrigger>
          <TabsTrigger value="listFriends">My Friends</TabsTrigger>
        </TabsList>
        <hr />
        <TabsContent
          value="discover"
          className="text-center py-1 flex flex-col items-center px-1"
        >
          <h2 className="text-xl font-semibold mt-5">Discover new friends</h2>
          <p className="text-secondary text-sm">
            Every mystery box contains a Friends reward
            <br /> and unlocked a discover badge
          </p>
          <div className="my-10">
            <Present />
          </div>
          <div className="flex justify-center space-x-3 items-center">
            <button onClick={() => changeRandomAmount(-1)}>
              <IconName name="-" className="bg-white border" />
            </button>
            <div>{randomAmount}</div>
            <button onClick={() => changeRandomAmount(1)}>
              <IconName name="+" className="bg-white border" />
            </button>
          </div>
          <div className="text-secondary text-sm my-3">
            Your Balance: <span className="font-semibold">{value} ETH</span>
          </div>

          <RandomLoadingSheet
            disabled={randomAmount === 0 || mintFee > value}
            textPrice={openText}
            isOpenForce={loadingSheetVisible}
          >
            <FFButton
              className="w-full text-base mt-3"
              disabled={randomAmount === 0 || mintFee > value}
              onClick={handleMint}
            >
              {openText}
            </FFButton>
          </RandomLoadingSheet>
          <RandomSuccessSheet
            isOpenForce={successSheetVisible}
            setIsOpenForce={setSuccessSheetVisible}
            found={mintResult}
          />
        </TabsContent>
        <TabsContent
          value="listFriends"
          className="text-center text-sm font-sans flex flex-col justify-center items-center h-full w-full space-y-3"
        >
          {friendKeys.length === 0 ? (
            <>
              <div className="mt-[200px]">
                <h2 className="text-xl font-semibold">Find some friend</h2>
                <p className="text-secondary">
                  You have never conneted to anyone yet.
                </p>
                <p className="text-secondary">
                  Let&apos;s discover new friends!
                </p>
              </div>
              <div className="w-36 mt-6">
                <FFButton
                  className="w-full text-base"
                  onClick={() => setCurrentTab("discover")}
                >
                  Discover
                </FFButton>
              </div>
            </>
          ) : (
            friendList.map((friend, index) => (
              <FriendCard {...friend} key={index} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
