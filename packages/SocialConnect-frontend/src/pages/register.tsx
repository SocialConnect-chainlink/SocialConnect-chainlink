import NewUser from "@/components/Icon/NewUser";
import { FFButton } from "@/components/ui/FFButton";
import { Button } from "@/components/ui/button";
import { useFriendFi } from "@/hooks/useFriendFi";
import { backend } from "@/services/backend";
import { useConnect, useEthereum } from "@particle-network/auth-core-modal";
import { useAuthCore } from "@particle-network/auth-core-modal";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PuffLoader } from "react-spinners";

const INTERVAL = 15 * 1000;

export default function Reigster() {
  const router = useRouter();
  const { registered, fetching, register, fetchData } = useFriendFi();
  const { disconnect } = useConnect();
  const { userInfo } = useAuthCore();
  const { address } = useEthereum();

  const [registering, setRegistering] = useState(false);
  const [iv, setIv] = useState<NodeJS.Timeout | null>(null);

  console.log(address);

  useEffect(() => {
    if (registered) {
      router.push("/");

      if (iv) {
        clearInterval(iv);
        setIv(null);
      }
    }

    return () => {
      if (iv) {
        clearInterval(iv);
        setIv(null);
      }
    };
  }, [registered, router, iv]);

  useEffect(() => {
    if (userInfo) {
      console.log(userInfo);
      const uuid = userInfo.uuid;
      const token = userInfo.token;
      backend
        .register(uuid, token, userInfo)
        .then((res: any) => {
          console.log("Register: ", res);
        })
        .catch((e: any) => {
          console.error(e);
        });
    }
  }, [userInfo]);

  const handleRegister = async () => {
    try {
      await register();
      setRegistering(true);

      const iv = setInterval(async () => {
        await fetchData();
      }, INTERVAL);
      setIv(iv);
    } catch (e) {
      console.error(e);
    }
  };

  if (fetching || registered) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center font-sans text-center">
        <PuffLoader color="#FDE047" size={150} />
      </div>
    );
  }

  if (!registering) {
    return (
      <div className="w-full h-screen flex flex-col justify-between items-center font-sans py-6">
        <div />
        <div className="text-center flex flex-col items-center text-sm text-secondary">
          <NewUser />
          <div className="font-semibold text-xl text-black">
            You&apos;re new here!
          </div>
          <div className="text-sm">Please complete the registration.</div>
          <div className="text-sm">
            Make sure you top up some gas to your wallet.
          </div>
          <div className="text-sm">
            Check your wallet on the buttom right corner.
          </div>
          <div>
            Your Address:{" "}
            <span
              className="text-red-500 cursor-pointer"
              onClick={() => {
                toast.success("Copy address to clipboard!!");
                navigator.clipboard.writeText(address || "");
              }}
            >
              {address}
            </span>
          </div>
        </div>
        <div className="flex flex-col space-y-3 w-full">
          <FFButton onClick={handleRegister} className="w-full">
            Register
          </FFButton>
          <FFButton
            onClick={disconnect}
            className="w-full text-tertiary"
            inside="bg-white"
            outside="bg-[#EFEFEF] border-[#EFEFEF]"
          >
            Cancel
          </FFButton>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col justify-between items-center font-sans text-center py-6">
      <div />
      <div className="flex flex-col items-center space-y-3">
        <PuffLoader color="#FDE047" size={150} />
        <div className="text-xl font-semibold">Register Processing</div>
        <div className="text-center text-sm text-secondary">
          <div>The process will take around 1 minute.</div>
          <div>
            Once it&apos;s done, you will be automatically directed into the new
            world.
          </div>
        </div>
      </div>
      <div className="text-secondary text-xs">
        Feel free to grab some water. It should be finishe by then...
      </div>
    </div>
  );
}
