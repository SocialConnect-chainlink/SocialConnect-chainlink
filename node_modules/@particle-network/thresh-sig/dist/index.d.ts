export * from './ecdsa';
export * from './eddsa';
export { decryptData, encryptData, generateKey } from './util';
export { ServerError } from './wasm/thresh_sig_wasm';
export declare function initWasm(): Promise<void>;
export declare function getVersion(): string;
