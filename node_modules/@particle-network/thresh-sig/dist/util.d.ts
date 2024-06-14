import { Buffer } from 'buffer';
export interface AuthParams {
    token: string;
    project_uuid: string;
    project_client_key: string;
    project_app_uuid: string;
    sdk_version: string;
    device_id: string;
    mac_key: string;
    random_str: string;
    timestamp: number;
}
export declare const toBuffer: (arr: Buffer | Uint8Array | Array<number>) => Buffer;
export declare const hex2Buffer: (hex: string) => Buffer;
export declare const toLittleEndian: (buffer: Buffer) => Buffer;
export declare function sleep(ms: number): Promise<unknown>;
export declare function generateKey(password: string, uuid: string): Promise<string>;
export declare function encryptData(plaintext: string, key: string): Promise<string>;
export declare function decryptData(ciphertext: string, key: string): Promise<string>;
