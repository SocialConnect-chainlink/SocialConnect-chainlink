import { ClipLoader } from "react-spinners";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Complete, Wait } from "../Icon/Stauts";
import { FFButton } from "../ui/FFButton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { useAuthCore, useEthereum } from "@particle-network/auth-core-modal";
import { MarketNameInput } from "./MarketNameInput";

export enum STATE {
  sell = "sell",
  buy = "buy",
  buying = "buying",
  selling = "selling",
  sellSuccess = "sellSuccess",
  buySuccess = "buySuccess",
}

export default function MarketActionSheet({
  data,
  isOpenForce = false,
  setIsOpenForce,
}: {
  data: {
    friendName?: string;
    price?: string;
    qty?: number;
    state: STATE;
  };
  isOpenForce: boolean;
  setIsOpenForce: Dispatch<SetStateAction<boolean>>;
}) {
  const [state, setState] = useState<STATE>(data.state);
  const { chainInfo } = useEthereum();

  const Title = useMemo(() => {
    const TitleWithInX = (name: string) => {
      return (
        <>
          <div className="text-black font-medium text-xl">{name}</div>
          <SheetTrigger
            onClick={() => setIsOpenForce(false)}
            className="text-secondary"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </SheetTrigger>
        </>
      );
    };
    const TitleWithOutX = (name: string) => {
      return (
        <>
          <div className="text-black font-medium text-xl">{name}</div>
          <div />
        </>
      );
    };
    switch (state) {
      case STATE.buy:
        return TitleWithInX("Buy");
      case STATE.sell:
        return TitleWithInX("Create sell order");
      case STATE.buySuccess || STATE.sellSuccess:
        return TitleWithInX("");
      default:
        return TitleWithOutX("");
    }
  }, [setIsOpenForce, state]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);

  const totalAmount = useMemo(() => price * quantity, [price, quantity]);

  const handleBuy = () => {
    // place buy function here
    console.log("buy");

    // setState(STATE.buying);
  };

  const handleSell = () => {
    // place sell function here
    console.log("sell");

    // setState(STATE.selling);
  };

  useEffect(() => {
    if (state === STATE.sell || isOpenForce === true) {
      setPrice(0);
      setQuantity(0);
    }
  }, [data.price, data.qty, isOpenForce, state]);

  const list = [
    {
      value: "vitalik-best",
      label: "Vitalik Buterin (Best)",
    },
    {
      value: "vitalik-close",
      label: "Vitalik Buterin (Close)",
    },
  ];

  const content = useMemo(() => {
    switch (state) {
      case STATE.sell:
        return (
          <>
            <div />
            <div className="space-y-6 flex flex-col items-center w-full">
              <MarketNameInput value={name} setValue={setName} list={list} />
              <div className="flex w-full items-center">
                <Input
                  className="rounded-l-full"
                  placeholder="Price"
                  type="number"
                  onChange={(e) => setPrice(+e.target.value)}
                />
                <div className="border-r border-y rounded-r-full h-full px-4 flex items-center">
                  <div>{chainInfo.nativeCurrency.symbol}</div>
                </div>
              </div>

              <Input
                className="rounded-full"
                placeholder="Quantity"
                type="number"
                onChange={(e) => setQuantity(+e.target.value)}
              />
              <div className="border rounded-xl w-full p-4">
                <div className="flex justify-between">
                  <div>Network</div>
                  <div>{chainInfo.fullname}</div>
                </div>
                <div className="flex justify-between">
                  <div>Total</div>
                  <div>
                    {totalAmount} {chainInfo.nativeCurrency.symbol}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full">
              <FFButton className="w-full" onClick={() => handleSell()}>
                Sell
              </FFButton>
            </div>
          </>
        );
      case STATE.buy:
        return (
          <>
            <div />
            <div className="space-y-6 flex flex-col items-center w-full">
              <Input
                className="rounded-full"
                placeholder="Friends"
                value={data.friendName}
                disabled
              />
              <div className="flex w-full items-center">
                <Input
                  className="rounded-l-full"
                  placeholder="Price"
                  type="number"
                  value={data.price}
                  disabled
                />
                <div className="border-r border-y rounded-r-full h-full px-4 flex items-center">
                  <div>{chainInfo.nativeCurrency.symbol}</div>
                </div>
              </div>

              <Input
                className="rounded-full"
                placeholder="Quantity"
                type="number"
                value={data.qty}
                disabled
              />
              <div className="border rounded-xl w-full p-4">
                <div className="flex justify-between">
                  <div>Network</div>
                  <div>{chainInfo.fullname}</div>
                </div>
                <div className="flex justify-between">
                  <div>Total</div>
                  <div>
                    {+(data.price || 0) * data.qty!}{" "}
                    {chainInfo.nativeCurrency.symbol}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full">
              <FFButton className="w-full" onClick={() => handleBuy()}>
                Buy
              </FFButton>
            </div>
          </>
        );
      case STATE.buying:
        return (
          <>
            <div />
            <div className="space-y-3 flex flex-col items-center">
              <ClipLoader color="#FFDD3C" size={55} />
              <div className="font-medium text-xl">You are now buying</div>
            </div>
            <div className="text-secondary text-sm">
              Confirm this transaction in your wallet
            </div>
          </>
        );
      case STATE.selling:
        return (
          <>
            <div />
            <div className="space-y-3 flex flex-col items-center">
              <ClipLoader color="#FFDD3C" size={55} />
              <div className="font-medium text-xl">
                You are now posting your order
              </div>
            </div>
            <div className="text-secondary text-sm">
              Confirm this transaction in your wallet
            </div>
          </>
        );
      case STATE.buySuccess:
        return (
          <>
            <div />
            <div className="space-y-3 flex flex-col items-center">
              <Complete />
              <div className="font-medium text-xl">Purchase completed</div>
              <div className="text-secondary text-sm">
                <div>
                  Buyer will pay cash in person only. <br /> Go to the my orders
                </div>
              </div>
            </div>
            <div className="w-full">
              <FFButton
                className="w-full"
                onClick={() => setIsOpenForce(false)}
              >
                Done
              </FFButton>
            </div>
          </>
        );
      case STATE.sellSuccess:
        return (
          <>
            <div />
            <div className="space-y-3 flex flex-col items-center">
              <Wait />
              <div className="font-medium text-xl">
                Waiting for buyer&apos;s payment
              </div>
              <div className="text-secondary text-sm">
                <div>
                  You have now completed your purchase <br /> and own a new
                  friends!
                </div>
              </div>
            </div>
            <div className="w-full">
              <FFButton
                className="w-full"
                onClick={() => setIsOpenForce(false)}
              >
                Done
              </FFButton>
            </div>
          </>
        );
      default:
        return <div />;
    }
  }, [
    chainInfo.fullname,
    chainInfo.nativeCurrency.symbol,
    data.friendName,
    data.price,
    data.qty,
    list,
    name,
    setIsOpenForce,
    state,
    totalAmount,
  ]);

  useEffect(() => {
    setState(data.state);
  }, [data.state]);
  return (
    <Sheet open={isOpenForce}>
      <SheetContent className="font-serif rounded-t-2xl h-2/3" side="bottom">
        <SheetHeader className="h-full max-w-[500px] mx-auto">
          <SheetTitle className="flex justify-between items-center">
            <div />
            {Title}
          </SheetTitle>
          <SheetDescription className="min-h-52 flex flex-col justify-between items-center text-center text-black h-full">
            {content}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
