/// <reference types="node" />
import { Buffer } from 'buffer';
import { AuthParams } from './util';
import { AccessListEIP2930TxData, FeeMarketEIP1559TxData, TxData } from '@ethereumjs/tx';
export interface MasterKey2 {
    public: {
        q: {
            x: string;
            y: string;
        };
        p1: {
            x: string;
            y: string;
        };
        p2: {
            x: string;
            y: string;
        };
        paillier_pub: {
            n: string;
        };
        c_key: string;
    };
    private: {
        x2: string;
    };
    chain_code: string;
}
export interface EcdsaSign {
    r: string;
    s: string;
    recid: number;
}
export interface EcdsaSignBuffer {
    r: Buffer;
    s: Buffer;
    v: number;
}
export interface EcdsaData {
    id: string;
    masterKey: MasterKey2;
    childKey: MasterKey2;
}
export declare class Ecdsa implements EcdsaData {
    id: string;
    masterKey: MasterKey2;
    childKey: MasterKey2;
    constructor(id: string, masterKey: string | MasterKey2, childKey: string | MasterKey2);
    /**
     * Generate a new Ecdsa instance with a new key pair
     * @param endpoint
     * @param authParams
     * @returns {Promise<EdDsa>}
     */
    static gen(endpoint: string, authParams: string | AuthParams): Promise<Ecdsa>;
    /**
     * get Ecdsa instance from json or EcdsaData
     * @param data
     * @returns {EdDsa}
     */
    static from(data: string | EcdsaData): Ecdsa;
    /**
     * to json
     * @returns {string}
     */
    to(): string;
    /**
     * public key
     * @return {Buffer}
     */
    pub(): Buffer;
    /**
     * sign a message
     * @param endpoint
     * @param authParams
     * @param message
     * @param uniqSign
     * @returns {Promise<EcdsaSignBuffer>}
     */
    sign(endpoint: string, authParams: string | AuthParams, message: Buffer | Uint8Array | Array<number>, uniqSign?: boolean): Promise<EcdsaSignBuffer>;
    /**
     * batch sign messages
     * @param endpoint
     * @param authParams
     * @param messages
     */
    batchSign(endpoint: string, authParams: string | AuthParams, messages: Buffer[] | Uint8Array[] | Array<number>[]): Promise<EcdsaSignBuffer[]>;
    private _sign;
    signTx(endpoint: string, authParams: string | AuthParams, txData: any): Promise<TxData | AccessListEIP2930TxData | FeeMarketEIP1559TxData>;
    signTronTx(endpoint: string, authParams: string | AuthParams, txData: any): Promise<string>;
    rpcRequest(endpoint: string, authParams: string | AuthParams, chainId: number, method: string, ...params: any[]): Promise<any>;
    refresh(endpoint: string, authParams: string | AuthParams): Promise<Ecdsa>;
}
export declare function get_message_to_sign(str: string): Buffer;
