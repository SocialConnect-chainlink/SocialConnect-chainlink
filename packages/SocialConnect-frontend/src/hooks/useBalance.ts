import { useEthereum } from "@particle-network/auth-core-modal";
import { ethers, formatEther } from "ethers";
import { useEffect } from "react";
import { useState } from "react";

export function useBalance() {
    const { address, chainInfo } = useEthereum();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [value, setValue] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                if (address && chainInfo) {
                    const provider = new ethers.JsonRpcProvider(chainInfo.rpcUrl);
                    const balance = await provider.getBalance(address);
                    setValue(+formatEther(balance));
                }
            } catch (e) {
                setError(JSON.stringify(e));
            }

        })()
        setLoading(false);
    }, [address, chainInfo]);

    return {
        loading,
        error,
        value
    }
}