import { ethers } from "ethers";
import { UserManager__factory } from "./typechain/factories/UserManager__factory";
import { CHAIN_IDS, CONTRACT_ADDRESSES } from "./addresses";
import { ChainId } from "@particle-network/chains";

function getAddress(chainId: number) {
    if (!CHAIN_IDS.includes(chainId)) {
        throw new Error(`${chainId} is not available chain. Available: ${CHAIN_IDS.join(', ')}`)
    }
    return CONTRACT_ADDRESSES[chainId as ChainId]['UserManager'];
}

function getContract(chainId: number, provider?: ethers.Provider | ethers.Signer) {
    const contractAddress = getAddress(chainId);
    return UserManager__factory.connect(contractAddress, provider);
}

export const userManagerContract = {
    getAddress,
    getContract
}