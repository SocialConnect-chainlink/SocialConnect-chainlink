/// <reference types="node" />
import { Buffer } from 'buffer';
import { AuthParams } from './util';
export interface KeyAgg {
    apk: {
        bytes_str: string;
    };
    hash: string;
}
export interface KeyPair {
    public_key: {
        bytes_str: string;
    };
    expended_private_key: {
        prefix: string;
        private_key: string;
    };
}
export interface EdDsaSign {
    R: {
        bytes_str: string;
    };
    s: string;
}
export interface EdDsaData {
    id: string;
    keyAgg: KeyAgg;
    keyPair: KeyPair;
}
export declare class EdDsa implements EdDsaData {
    id: string;
    keyAgg: KeyAgg;
    keyPair: KeyPair;
    constructor(id: string, keyAgg: string | KeyAgg, keyPair: string | KeyPair);
    /**
     * Generate a new EdDSA instance with a new key pair
     * @param endpoint
     * @param authParams
     * @returns {Promise<EdDsa>}
     */
    static gen(endpoint: string, authParams: string | AuthParams): Promise<EdDsa>;
    /**
     * get EdDSA instance from json or EdDsaData
     * @param data
     * @returns {EdDsa}
     */
    static from(data: string | EdDsaData): EdDsa;
    /**
     * to json
     * @returns {string}
     */
    to(): string;
    /**
     * get public key
     * @return {Buffer}
     */
    pub(): Buffer;
    /**
     * sign a message
     * @param endpoint
     * @param authParams
     * @param message
     * @returns {Promise<Buffer>}
     */
    sign(endpoint: string, authParams: string | AuthParams, message: Buffer | Uint8Array | Array<number>): Promise<Buffer>;
    /**
     * batch sign messages
     * @param endpoint
     * @param authParams
     * @param messages
     */
    batchSign(endpoint: string, authParams: string | AuthParams, messages: Buffer[]): Promise<Buffer[]>;
    private _sign;
}
