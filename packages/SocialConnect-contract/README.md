## SocialConnect Contract

**SocialConnect is a social media platform powered by DeFi. It enables people to connect using financial mechanisms relying on smart contracts.**

<img src="./public/logo-socialconnect.png" width="200" />

There are 3 main contracts in SocialConnect:
-   **socialconnectKeyManager**: The main entry point contract for unlocking socialconnect connections.
-   **UserManager**: The storage contract that holds the list of users in the system.
-   **socialconnectKey**: An ERC1155 token contract used to represent socialconnect connections.

The contracts are integrated with Chainlink and Particle Auth.
-   **UserManagerFunctions**: The user manager relies on Chainlink Functions to validate user authentication from the Particle Auth service.
-   **socialconnectKeyManagerVRF**: The socialconnect key manager relies on Chainlink VRF to provide random numbers for the socialconnect key mining process.

## Deployments

### Avalanche Fuji
- **UserManager**: `0x36BdBF70B474D6A2aF3F17531Cfe1a9Ea1036c03`
- **socialconnectKeyManager**: `0xb64aFd1277EF94F214e4BF8F51B7018Fa0F7C9c9`
- **socialconnectKey0**: `0xC4Dd875618429b8E015f5B612Ed4d18af54d34E7`
- **socialconnectKey1**: `0xd8B16F1007A04a12b84440B96a055f1788BB3d43`
- **socialconnectKey2**: `0x5ff752925cC6223661d18F384940D4223FE5F92b`

## Usage

### Installation
1. Install dependencies
```shell
$ forge install
```
2. Install npm packages
```shell
$ npm i
```

### Build

```shell
$ npm run build
```

### Test

```shell
$ forge test
```

### Deploy

```shell
$ ./commands/deploy-socialconnect-key-manager.sh
```

