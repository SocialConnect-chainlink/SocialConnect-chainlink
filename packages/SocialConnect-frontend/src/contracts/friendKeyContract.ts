import { ethers } from "ethers";
import { CHAIN_IDS, CONTRACT_ADDRESSES } from "./addresses";
import { ChainId } from "@particle-network/chains";
import { FriendKey__factory } from "./typechain/factories/FriendKey__factory";

function getAddress(chainId: number, level: number) {
    if (!CHAIN_IDS.includes(chainId)) {
        throw new Error(`${chainId} is not available chain. Available: ${CHAIN_IDS.join(', ')}`)
    }
    return CONTRACT_ADDRESSES[chainId as ChainId][`FriendKey${level}`];
}

function getContract(chainId: number, level: number, provider?: ethers.Provider | ethers.Signer) {
    const contractAddress = getAddress(chainId, level);
    return FriendKey__factory.connect(contractAddress, provider);
}

export const friendKeyContract = {
    getAddress,
    getContract
}