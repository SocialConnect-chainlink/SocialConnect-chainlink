## SocialConnect

**SocialConnect is a social media platform powered by DeFi. It enables people to connect using financial mechanisms relying on smart contracts.**

<img src="" width="200" />

SocialConnect is a social media platform powered by DeFi. It enables people to connect using financial mechanisms relying on smart contracts. Users randomly discover new friends, unlock exclusive content, and trade these connections (in the form of tokens). The platform gamifies global connections and interactions, making social media more exciting.

## System Architecture
![System Architecture](https://github.com/samarabdelhameed/pics/blob/main/conectdiagram.png?raw=true)

SocialConnect ecosystem comprises several components as follows:

1. Particle Auth - SocialConnect utilizes Particle Auth, a third-party authentication service, to simplify the authentication process using familiar social logins (e.g., Google, Facebook, X) and generate corresponding wallet addresses. Particle Auth maps user IDs and wallet addresses in their system. This can be used to identify the connection between wallet addresses and social media accounts on-chain.
2. FriendKeyContract - The core smart contract of the ecosystem handles on-chain registration and FriendKey (ERC1155) management (e.g., minting, burning, and merging). A FriendKey determines the connection between users. For example, if Alice holds a FriendKey of Bob, she has a connection to Bob. This connection can be used in many forms of social interaction. This platform uses that connection as a key to access the content of the specific user. A FriendKey can only be generated randomly, meaning users must randomly mint a FriendKey from FriendKeyContract to get access to a user’s content, or they can buy it from other users.
3. Chainlink Functions - Since wallet address and social media connections are stored off-chain for privacy preservation, the data must be fetched from off-chain to the smart contract. Chainlink Functions are used to make this process secure by relying on a decentralized oracle network rather than a single server.
4. Chainlink VRF - The system relies on the verifiable random function (VRF) powered by the Chainlink decentralized oracle network. This mechanism protects against random function attacks, providing a fair random function for every type of user.
5. SocialConnect Content Registry - This is an example of user interaction within the SocialConnect ecosystem, where access control is governed by FriendKey. While the interaction layer should be decentralized, we provide a centralized version for simplicity in this demo. Users can post their content to the content registry, and other users who own a key of the authors can access and interact with their content. The content can be set into three friend levels: common, close, and best. To access higher levels of content, users must level up their FriendKey by merging three keys from a lower level.

## Usage

### Installation
```shell
$ npm i
```

### Start development server

```shell
$ npm run dev
```

### Build

```shell
$ npm run build
```

### Start production server

```shell
$ npm start
```

