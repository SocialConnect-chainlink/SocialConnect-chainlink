# thresh-sig

## Installation

```yarn add @particle-network/thresh-sig```

## Usage

- base params

```js
let endpoint = "https://api.particle.network";

// json string | AuthParams
let params = JSON.stringify({
    token: "555ebd5b-0fea-45e4-910d-a97fffd4388b",
    project_uuid: "8f881767-5a69-4b1b-b7a2-2554b76e4462",
    project_client_key: "crSldYouTIQIUzut0WhIKexkl28rg2RblfdXET5l",
    project_app_uuid: "7066b3c0-284c-4390-893c-4a38915a3160",
    sdk_version: "android_1.0.0",
    device_id: "9907eab5-82fd-49bb-a442-fe9fb67c6487",
    mac_key: "9907eab5-82fd-49bb-a442-fe9fb67c6487",
    // timestamp: Math.floor(Date.now() / 1000),
    // random_str: "9907eab5-82fd-49bb-a442-fe9fb67c6487",
});
```

### EdDSA

#### simple sign & batch sign

```js
import {EdDsa, ServerError} from "@particle-network/thresh-sig";

(async () => {
    let eddsa = await EdDsa.gen(endpoint, params);
    console.log(eddsa);
    console.log("pub key: ", eddsa.pub());
    console.log("to json: ", eddsa.to());
    console.log("eddsa from json | EdDsaData: ", EdDsa.from(eddsa.to()));
    try {
        console.log("sign: ", await eddsa.sign(endpoint, params, "some message"));

        console.log("batch sign: ", await eddsa.batchSign(endpoint, params, [
            "some message",
            "some message2",
            "some message3",
        ]));
    } catch (e) {
        if (e instanceof ServerError) {
            console.log("server error: ", e);
        } else {
            console.log("error: ", e);
        }
    }
})();
```

#### solana transaction sign

```js
import {EdDsa} from "@particle-network/thresh-sig";
import * as web3 from "@solana/web3.js";

(async () => {
    let conn = new web3.Connection(
        web3.clusterApiUrl('devnet'),
        'confirmed',
    );
    // airdrop some sol
    const pubKey = new web3.PublicKey(eddsa.pub());
    console.log("from pub key: ", pubKey.toBase58());
    const ads = await conn.requestAirdrop(
        pubKey,
        web3.LAMPORTS_PER_SOL,
    );
    await conn.confirmTransaction(ads);

    let to = web3.Keypair.generate();
    console.log("to pub key: ", to.publicKey.toBase58());

    // new tx with transfer
    const recentBlockhash = await conn.getRecentBlockhash();
    let tx = new web3.Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: pubKey,
        instructions: [
            web3.SystemProgram.transfer({
                fromPubkey: pubKey,
                toPubkey: to.publicKey,
                lamports: web3.LAMPORTS_PER_SOL / 100,
            })
        ]
    })

    // sign tx msg
    let msg = tx.serializeMessage();
    // console.log("tx serialize msg: ", msg);
    let txSign = await eddsa.sign(endpoint, params, msg);
    console.log("eddsa sign: ", txSign, txSign.toString("hex"));

    // add sign & send tx
    tx.addSignature(pubKey, txSign);
    console.log("tx: ", tx);

    const signature = await conn.sendRawTransaction(tx.serialize());
    console.log("tx sign: ", signature);
    console.log("confirm: ", await conn.confirmTransaction(signature, "confirmed"));
})();
```

#### aptos transaction sign

```js
import {EdDsa} from "@particle-network/thresh-sig";
import {AptosClient, FaucetClient} from "aptos";
import * as SHA3 from "js-sha3";

(async () => {
    const client = new AptosClient('https://fullnode.devnet.aptoslabs.com');
    const faucetClient = new FaucetClient('https://fullnode.devnet.aptoslabs.com', 'https://faucet.devnet.aptoslabs.com');
    const accountBalance = async function (accountAddress) {
        const resource = await client.getAccountResource(accountAddress, "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
        if (resource == null) {
            return null;
        }

        return parseInt((resource.data)['coin']['value']);
    }

    const eddsa = await EdDsa.gen(endpoint, params);
    const hash = SHA3.sha3_256.create();
    hash.update(eddsa.pub());
    hash.update("\x00");
    const address = '0x' + hash.hex();
    const pubKey = '0x' + eddsa.pub().toString('hex');
    console.log('address: ', address, 'public key: ', pubKey);

    await faucetClient.fundAccount(address, 200000);
    console.log('balance: ', await accountBalance(address));

    const payload = {
        type: 'script_function_payload',
        function: '0x1::coin::transfer',
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: ['0x18f8a9d1e5c68e75d287d2a721e6328955e99473938c35750c504c5b6578835c', '10000'],
    };
    const txnRequest = await client.generateTransaction(address, payload);
    const message = await client.createSigningMessage(txnRequest);
    let signature = await eddsa.sign(endpoint, authParams, HexString.ensure(message).toBuffer());
    signature = HexString.fromBuffer(signature).toString(); // 0xxxxxxx
    console.log("signature:", signature);

    const signedTxn = {
        ...txnRequest,
        signature: {
            type: 'ed25519_signature',
            public_key: pubKey,
            signature,
        },
    };
    const res = await client.submitTransaction(signedTxn);
    console.log('res: ', res);
})();
```

#### near transaction sign

```js
import {connect, keyStores, transactions, utils} from 'near-api-js';
import {sha256 as JsSha256} from 'js-sha256'

(async () => {
    const eddsa = await EdDsa.gen(endpoint, params);
    const address = eddsa.pub().toString('hex');

    const networkId = "testnet";
    const keyType = 0;
    const publicKey = utils.PublicKey.from(utils.serialize.base_encode(eddsa.pub()));

    const near = await connect({networkId, nodeUrl: "https://rpc.testnet.near.org"});
    const account = await near.account(address);
    console.log('address: ', address, 'account: ', account, await account.getAccountBalance());

    const receiverId = 'ddemo.testnet';
    const actions = [transactions.transfer('1000000000000000000000000')]; // 1NEAR

    let nonce;
    try {
        const accessKey = await near.connection.provider.query({
            request_type: 'view_access_key',
            account_id: address,
            public_key: publicKey.toString(),
            finality: 'optimistic'
        });
        nonce = ++accessKey.nonce;
    } catch (e) {
        if (e.type == 'AccessKeyDoesNotExist') {
            nonce = 0;
        } else {
            throw e;
        }
    }

    const block = await near.connection.provider.block({finality: 'final'});
    const blockHash = utils.serialize.base_decode(block.header.hash);
    const transaction = transactions.createTransaction(address, publicKey, receiverId, nonce, actions, blockHash);

    const message = JsSha256.array(utils.serialize.serialize(transactions.SCHEMA, transaction));
    let signature = await eddsa.sign(endpoint, authParams, message);
    signature = new transactions.Signature({keyType, data: signature});

    const res = await near.connection.provider.sendTransaction(new transactions.SignedTransaction({
        transaction,
        signature,
    }));
    console.log('res: ', res);
})();
```

### ECDSA

#### simple sign & key refresh

```js
import {Ecdsa} from "@particle-network/thresh-sig";

(async () => {
    let ecdsa = await Ecdsa.gen(endpoint, params);
    console.log(ecdsa);
    console.log("pub key: ", ecdsa.pub());
    console.log("to json: ", ecdsa.to());
    console.log("ecdsa from json | EcdsaData: ", Ecdsa.from(ecdsa.to()));
    console.log("sign: ", await ecdsa.sign(endpoint, params, "some message", true));
    ecdsa = await ecdsa.refresh(endpoint, params);
    console.log(ecdsa);
    console.log("new json: ", ecdsa.to());
})();
```

#### ethereum transaction sign

```js
import {Ecdsa} from "@particle-network/thresh-sig";
import Web3 from "web3";
import {FeeMarketEIP1559Transaction, TransactionFactory} from "@ethereumjs/tx";
import Common, {Hardfork} from "@ethereumjs/common";
import {publicToAddress} from "ethereumjs-util";
import axios from "axios";

(async () => {
    // test
    const ecdsa = Ecdsa.gen(endpoint, params);
    console.log(ecdsa);
    const address = "0x" + publicToAddress(ecdsa.pub(), true).toString("hex");
    console.log("address: ", address);

    // ethereum
    const rpc = "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"; // https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
    const chainId = 3; // 1

    // polygon
    // const rpc = "https://matic-mumbai.chainstacklabs.com"; // https://polygon-rpc.com
    // const chainId = 80001; // 137

    // binance
    // const rpc = "https://data-seed-prebsc-1-s2.binance.org:8545"; // https://bsc-dataseed.binance.org
    // const chainId = 97; // 56

    // avalanche
    // const rpc = "https://api.avax-test.network/ext/bc/C/rpc"; // https://api.avax.network/ext/bc/C/rpc
    // const chainId = 43113; // 43114

    console.log(rpc);
    const web3 = new Web3(rpc);
    const common = Common.custom({chainId: chainId}, {hardfork: Hardfork.London});
    console.log("balance: ", await web3.eth.getBalance(address))

    const suggest = (await axios.get(`https://gas-api.metaswap.codefi.network/networks/${chainId}/suggestedGasFees`)).data;
    const tip = web3.utils.toHex(web3.utils.toWei(parseFloat(suggest.medium.suggestedMaxPriorityFeePerGas).toFixed(9), "gwei"));
    const fee = web3.utils.toHex(web3.utils.toWei(parseFloat(suggest.medium.suggestedMaxFeePerGas).toFixed(9), "gwei"));

    // FeeMarketEIP1559Transaction
    let txData = {
        nonce: 3,
        from: address,
        to: "0x6D5fCEd0C74F22a1B145ef48B25527Ce9BF829bF",
        value: web3.utils.toHex(web3.utils.toWei("0.1", "ether")),
        maxPriorityFeePerGas: tip,
        maxFeePerGas: fee,
        gasLimit: 21000,
        type: "0x02",
    };
    const unsigned = FeeMarketEIP1559Transaction.fromTxData(txData, {common});
    const sign = await ecdsa.sign(endpoint, params, unsigned.getMessageToSign());
    console.log("tx sign: ", sign);

    txData.v = "0x" + sign.v.toString(16);
    txData.r = "0x" + sign.r.toString("hex");
    txData.s = "0x" + sign.s.toString("hex");
    console.log("tx data: ", txData);

    let tx = FeeMarketEIP1559Transaction.fromTxData(txData, {common});


    // or use signTx
    txData = {
        chainId: chainId,
        nonce: 0, // use 0 for new tx or specific nonce for speed up|cancel
        from: address,
        to: "0x6D5fCEd0C74F22a1B145ef48B25527Ce9BF829bF",
        value: web3.utils.toHex(web3.utils.toWei("0.1", "ether")),
        maxPriorityFeePerGas: tip,
        maxFeePerGas: fee,
        gasLimit: 21000,
        type: 2,
    };
    txData = await ecdsa.signTx(endpoint, params, txData);
    tx = TransactionFactory.fromTxData(txData);

    console.log("sender address: ", tx.getSenderAddress().toString());
    web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'))
        .on('transactionHash', function (hash) {
            console.log("transactionHash: ", hash);
        })
        .on('receipt', function (receipt) {
            console.log("receipt: ", receipt);
        })
        .on('confirmation', function (confirmationNumber, receipt) {
            console.log("confirmation number: ", confirmationNumber, "receipt: ", receipt);
        })
        .on('error', console.error);
})();
```

#### cosmos transaction sign

```js
import {encodePubkey, makeAuthInfoBytes, makeSignBytes, makeSignDoc, Registry} from "@cosmjs/proto-signing";
import {fromBase64, toBech32, toBase64} from '@cosmjs/encoding';
import {encodeSecp256k1Signature, pubkeyToAddress} from '@cosmjs/amino';
import {coins, StargateClient} from '@cosmjs/stargate';
import {sha256} from '@cosmjs/crypto';
import {TxRaw} from 'cosmjs-types/cosmos/tx/v1beta1/tx';

(async () => {
    const ecdsa = Ecdsa.gen(endpoint, params);
    const pubKey = {
        type: 'tendermint/PubKeySecp256k1',
        value: toBase64(ecdsa.pub()),
    };
    const address = pubkeyToAddress(pubKey, 'cosmos');
    console.log('address: ', address);

    const rpc = 'https://rpc.state-sync-02.theta-testnet.polypore.xyz';
    const client = await StargateClient.connect(rpc);
    console.log(await client.getBalance(address, 'uatom'));

    const registry = new Registry();
    const txBodyFields = {
        typeUrl: '/cosmos.tx.v1beta1.TxBody',
        value: {
            messages: [
                {
                    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
                    value: {
                        fromAddress: address,
                        toAddress: 'cosmos1kwhnvngx9f90lykp5acpfu2l0j9xv5w77l7sp6',
                        amount: [
                            {
                                denom: 'uatom',
                                amount: '1000',
                            },
                        ],
                    },
                },
            ],
        },
    };
    const txBodyBytes = registry.encode(txBodyFields);
    let accountNumber, sequence;
    try {
        const seqRes = await client.getSequence(address);
        console.log('seqRes: ', seqRes);
        accountNumber = seqRes.accountNumber;
        sequence = seqRes.sequence;
    } catch (e) {
        accountNumber = 16;
        sequence = 0;
    }

    const authInfoBytes = makeAuthInfoBytes([{pubkey: encodePubkey(pubKey), sequence}], coins(2000, 'uatom'), 200000);
    const chainId = await client.getChainId();
    const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
    const message = sha256(makeSignBytes(signDoc));
    let signature = await ecdsa.sign(endpoint, authParams, message);
    signature = encodeSecp256k1Signature(ecdsa.pub(), new Uint8Array([...signature.r, ...signature.s]));
    console.log('signature: ', signature);

    const txRaw = TxRaw.fromPartial({
        bodyBytes: txBodyBytes,
        authInfoBytes: authInfoBytes,
        signatures: [fromBase64(signature.signature)],
    });
    const txRawBytes = Uint8Array.from(TxRaw.encode(txRaw).finish());
    const res = await client.broadcastTx(txRawBytes);
    console.log('res: ', res);
})();
```

#### tron transaction sign

```js
import * as TronWeb from 'tronweb';

(async () => {
    const ecdsa = Ecdsa.gen(endpoint, params);
    const addressHex = "0x" + publicToAddress(ecdsa.pub(), true).toString("hex");
    const tronWeb = new TronWeb({fullHost: 'https://nile.trongrid.io'})
    const address = tronWeb.address.fromHex(addressHex);
    console.log("address:", addressHex, address);

    const tx = await ecdsa.signTronTx(endpoint, authParams, {
        chainId: 3448148188,
        from: addressHex,
        to: '0x6D5fCEd0C74F22a1B145ef48B25527Ce9BF829bF',
        value: web3.utils.toHex(1000000),
    });
    console.log('tx: ', tx); // hex tx data
})();
```


### Utils

```js
import {decryptData, encryptData, generateKey} from "@particle-network/thresh-sig";

(async () => {
    const key = await generateKey('some password', 'some salt');

    const ciphertext = await encryptData('some text', key);
    const decrypted = await decryptData(ciphertext, key);

    console.log('key: ', key, 'ciphertext: ', ciphertext, 'decrypted: ', decrypted);
})();
```
