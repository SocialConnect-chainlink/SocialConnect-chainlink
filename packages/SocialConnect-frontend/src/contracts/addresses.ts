const FUJI_ADDRESSES = {
    "UserManager": "0x36BdBF70B474D6A2aF3F17531Cfe1a9Ea1036c03",
    "FriendKeyManager": "0xb64aFd1277EF94F214e4BF8F51B7018Fa0F7C9c9",
    "FriendKey0": "0xC4Dd875618429b8E015f5B612Ed4d18af54d34E7",
    "FriendKey1": "0xd8B16F1007A04a12b84440B96a055f1788BB3d43",
    "FriendKey2": "0x5ff752925cC6223661d18F384940D4223FE5F92b",
}


export const CONTRACT_ADDRESSES = {
    43113: FUJI_ADDRESSES
} as Record<number, Record<string, string>>

export type ChainId = 43113;
export const CHAIN_IDS = Object.keys(CONTRACT_ADDRESSES).map(id => +id);