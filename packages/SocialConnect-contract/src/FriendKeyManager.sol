// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IFriendKey.sol";
import "./interfaces/IUserManager.sol";
import "./FriendKey.sol";
import "./FriendKeyManagerVRF.sol";

contract FriendKeyManager is FriendKeyManagerVRF {
    IUserManager public userManager;
    IFriendKey[3] public keys;

    uint256 immutable public RANDOM_WINDOW = 1000;
    uint256 immutable public MIN_USERS = 2; // 2 users for test simplicity, 100 users for production
    uint256 immutable public MERGE_PIECES = 3;
    uint256 immutable public USER_DIVIDEN = 5000; // 0.5 (decimals = 4)
    uint256 immutable public DIGEST_BATCH = 10;

    uint256[2] public MERGE_FEES;
    uint256[3] public DIGEST_RETURNS;

    uint256 public latestMintFee;
    uint256 public lastMintTimestamp;
    uint256 public cooldownDuration = 1 days;
    uint256 public feeChangeRate = 2;

    uint256 public minFee = 0.0005 ether;
    uint256 public maxFee = 0.005 ether;

    constructor(
        address userManager_,
        uint64 vrfSubscriptionId_,
        address coordinator_,
        string[] memory uris
    ) FriendKeyManagerVRF(vrfSubscriptionId_, coordinator_) {
        require(uris.length == 3, "Size mismatch");

        userManager = IUserManager(userManager_);

        for (uint i = 0; i < 3; i++) {
            keys[i] = new FriendKey(uris[i]);
        }

        MERGE_FEES[0] = 0.001 ether;
        MERGE_FEES[1] = 0.005 ether;

        DIGEST_RETURNS[0] = 1;
        DIGEST_RETURNS[1] = 4;
        DIGEST_RETURNS[2] = 10;
    }

    function mint(address _to) public payable {
        require(userManager.numUsers() >= MIN_USERS, "User amount is too low");

        uint fee = getMintFee(1);
        require(msg.value >= fee, "Insufficient fee");

        _requestMint(_to, 1);

        // payment return 
        uint cashReturn = msg.value - fee;
        if (cashReturn > 0) {
            payable(msg.sender).transfer(cashReturn);
        }
    }

    function batchMint(address _to, uint _mintAmount) public payable {
        require(userManager.numUsers() >= MIN_USERS, "User amount is too low");

        uint fee = getMintFee(_mintAmount);
        require(msg.value >= fee, "Insufficient fee");

        _requestMint(_to, _mintAmount);

        // payment return 
        uint cashReturn = msg.value - fee;
        if (cashReturn > 0) {
            payable(msg.sender).transfer(cashReturn);
        }
    }

    function mintDigest(uint _level, uint[] memory _ids, uint[] memory _values, address _to) public returns (uint256[] memory, uint256[] memory) {
        uint _total = 0;
        for (uint i = 0; i < _values.length; i++) {
            _total += _values[i];
        }
        require(_ids.length == _values.length, "Input array len mismatch");
        require(_total % DIGEST_BATCH == 0, "Batch size mismatch");
        for (uint i = 0; i < _ids.length; i++) {
            keys[_level].burn(msg.sender, _ids[i], _values[i]);
        }

        uint _mintAmount = DIGEST_RETURNS[_level] * _total / DIGEST_BATCH;
        _requestMint(_to, _mintAmount);
    }

    function merge(uint _id, uint _level) public payable {
        require(_level < 2, "Exceed maximum level");
        uint fee = MERGE_FEES[_level];

        require(msg.value == fee, "Fee mismatch");

        keys[_level].burn(msg.sender, _id, MERGE_PIECES);
        keys[_level + 1].mint(msg.sender, _id, 1);

        uint userFee = fee * USER_DIVIDEN / 10e4;
        payable(userManager.addresses(_id)).transfer(userFee);
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        require(mintRequests[_requestId].exists, "request not found");
        mintRequests[_requestId].fulfilled = true;

        address _to = mintRequests[_requestId].to;
        uint256 _amount = mintRequests[_requestId].amount;
        uint256 _seed = _randomWords[0];

        _mint(_to, _amount, _seed);
    }

    function _mint(address _to, uint _mintAmount, uint _seed) internal returns(uint[] memory, uint[] memory) {
        uint[] memory tokenIds = new uint[](_mintAmount);
        uint[] memory values = new uint[](_mintAmount);
        for (uint i = 0; i < _mintAmount; i++) {
            tokenIds[i] = _getWeightedRandomIndex(_seed, i);
            values[i] = 1;
        }

        keys[0].mintBatch(_to, tokenIds, values);
        return (tokenIds, values);
    }

    function _getWeightedRandomIndex(uint256 _seed, uint256 _index) internal view returns (uint) {
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(_seed, _index, block.timestamp, msg.sender)));

        uint len = userManager.numUsers();
        uint startIndex = randomNumber % len;

        uint end = (startIndex + RANDOM_WINDOW);
        uint endIndex = end < len ? end : len;

        uint totalWeight = 0;
        for (uint i = startIndex; i < endIndex; i++) {
            totalWeight += getPrice(i);
        }

        randomNumber = uint256(keccak256(abi.encodePacked(randomNumber + 1))) % totalWeight;
        uint256 cumulativeWeight = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            cumulativeWeight += getPrice(i);
            if (randomNumber < cumulativeWeight) {
                return i;
            }
        }

        // Should never reach here, but return 0 in case of unforeseen circumstances
        return 0;
    }

    function claimFee(uint _value) public {
        payable(owner()).transfer(_value);
    }

    function getMintFee(uint number) public view returns (uint) {
        // TODO: fix dynamic fee algorithm
        uint256 elapsedTime = block.timestamp - lastMintTimestamp;
        uint256 feeChange = feeChangeRate * elapsedTime * elapsedTime / cooldownDuration * cooldownDuration;
        uint256 adjustedMintFee = latestMintFee + feeChange;

        adjustedMintFee = (adjustedMintFee < minFee) ? minFee : adjustedMintFee;
        adjustedMintFee = (adjustedMintFee > maxFee) ? maxFee : adjustedMintFee;

        return adjustedMintFee * number;
    }

    function getPrice(uint id) public view returns (uint) {
        // TODO: change to dynamic pricing in the future
        return 0.0005 ether;
    }

}
