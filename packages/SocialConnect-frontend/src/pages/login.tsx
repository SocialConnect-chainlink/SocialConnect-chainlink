import React from "react";
import Image from "next/image";
import { useConnect } from "@particle-network/auth-core-modal";
import { AvalancheTestnet } from "@particle-network/chains";

import { FFButton } from "@/components/ui/FFButton";
import { useFriendFi } from "@/hooks/useFriendFi";

export default function Login() {
  const { connect } = useConnect();
  const { registered, register, fetchData } = useFriendFi();
  return (
    <div className="h-full w-full flex flex-col pt-[100px] pb-[80px] font-sans">
      <div className="flex flex-col items-center">
        <Image src="/logo.svg" width={90} height={90} alt="friendfi logo" />
        <p className="font-bold text-3xl mt-[30px]">Fi your Friend</p>
        <p className="px-[100px] text-center mt-[5px] text-sm text-gray-500">
          You’ll use ETH on mainnet to buy and sell passes on FriendFi
        </p>
      </div>
      <div className="mt-[270px]">
        <FFButton
          size="lg"
          className="w-[350px] mx-auto"
          onClick={async () => {
            await connect({
              chain: AvalancheTestnet,
            });
            await fetchData();
            if (!registered) {
              await register();
            }
          }}
        >
          Sign In
        </FFButton>
        <p className="text-center text-xs px-[80px] mt-16 text-gray-400">
          By continuing, you agree to FriendFi’s Terms of Service and confirm
          that you are at least 13 years old.
        </p>
      </div>
    </div>
  );
}
