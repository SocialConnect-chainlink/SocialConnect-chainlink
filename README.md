# SocialConnect

## Vision
Connect with friends globally through the power of decentralized finance.
![System Architecture](https://github.com/samarabdelhameed/pics/blob/main/social%20connect.png
)


## System Architecture

![System Architecture](https://github.com/samarabdelhameed/pics/blob/main/conectdiagram.png?raw=true)

You can find the full-size diagram [here](https://github.com/samarabdelhameed/pics/blob/main/conectdiagram.png).


## Description
SocialConnect is a revolutionary social media platform powered by DeFi. It allows users to discover new friends randomly, unlock exclusive content, and trade connections in the form of tokens. By gamifying global connections and interactions, SocialConnect makes social media more exciting and engaging.

## System Architecture

![System Architecture](path_to_your_architecture_diagram.png)

## Components

### Particle Auth
SocialConnect uses Particle Auth, a third-party authentication service, to streamline the authentication process through familiar social logins (e.g., Google, Facebook, X). Particle Auth generates corresponding wallet addresses and maps user IDs to these addresses, identifying the connection between wallet addresses and social media on-chain.

### FriendKeyContract
The core smart contract of the SocialConnect ecosystem, FriendKeyContract handles on-chain registration and FriendKey (ERC1155) management (e.g., minting, burning, and merging). A FriendKey establishes the connection between users. For instance, if Alice holds a FriendKey of Bob, she can access Bob's content. FriendKeys are generated randomly, meaning users must mint them from the FriendKeyContract or purchase them from other users.

### Chainlink Functions
To ensure the security and reliability of data fetched from off-chain sources, SocialConnect leverages Chainlink Functions. This decentralized oracle network securely retrieves data such as wallet address and social media connections, preserving privacy.

### Chainlink VRF
SocialConnect employs Chainlink's Verifiable Random Function (VRF) to guarantee fair and secure random functions. This mechanism prevents random function attacks and ensures fairness for all users.

### SocialConnect Content Registry
The Content Registry is a centralized demo version for user interaction within the SocialConnect ecosystem, governed by FriendKey access control. Users can post content to the registry, which can be accessed by others who hold the appropriate FriendKey. Content is categorized into three levels: common, close, and best. To access higher levels, users must level up their FriendKeys by merging three keys of a lower level.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/socialconnect.git
   cd socialconnect
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile smart contracts:**
   ```bash
   npx hardhat compile
   ```

4. **Deploy smart contracts:**
   ```bash
   npx hardhat run scripts/deploy.js --network your_network
   ```

5. **Start the frontend:**
   ```bash
   npm run start
   ```

## Usage

1. **Create a Wallet:**
   - Use social logins to create a wallet via Particle Auth.

2. **Mint FriendKeys:**
   - Mint FriendKeys randomly or purchase them from other users.

3. **Interact with Content:**
   - Access and interact with content posted on the SocialConnect Content Registry using your FriendKeys.

## Future Enhancements

- **Decentralized Content Registry:**
  - Transition to a fully decentralized content registry for enhanced security and user control.

- **Expanded FriendKey Utilities:**
  - Introduce new utilities and interactions based on FriendKey connections.

- **Advanced Privacy Controls:**
  - Implement advanced privacy settings for users to manage their content visibility and interactions.
