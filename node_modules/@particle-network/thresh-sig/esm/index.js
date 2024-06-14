"use client";

// src/util.ts
import { Buffer as Buffer2 } from "buffer";

// src/ecdsa.ts
import { Buffer } from "buffer";
import { ec as EC } from "elliptic";
import { Transaction, TransactionFactory } from "@ethereumjs/tx";
import { Common, Hardfork } from "@ethereumjs/common";
var ec = new EC("secp256k1");
var Ecdsa = class {
  id;
  masterKey;
  childKey;
  constructor(id, masterKey, childKey) {
    this.id = id;
    this.masterKey = typeof masterKey == "string" ? JSON.parse(masterKey) : masterKey;
    this.childKey = typeof childKey == "string" ? JSON.parse(childKey) : childKey;
  }
  static async gen(endpoint, authParams) {
    await initWasm();
    const key = await ecdsa_keygen(endpoint, typeof authParams == "string" ? authParams : JSON.stringify(authParams));
    return new Ecdsa(key.id, key.master_key, key.child_key);
  }
  static from(data) {
    const ecdsa = typeof data == "string" ? JSON.parse(data) : data;
    return new Ecdsa(ecdsa.id, ecdsa.masterKey, ecdsa.childKey);
  }
  to() {
    return JSON.stringify({
      id: this.id,
      masterKey: this.masterKey,
      childKey: this.childKey
    });
  }
  pub() {
    const keyPair = ec.keyFromPublic({
      x: this.childKey.public.q.x,
      y: this.childKey.public.q.y
    });
    return hex2Buffer(keyPair.getPublic().encodeCompressed("hex"));
  }
  async sign(endpoint, authParams, message, uniqSign = false) {
    await initWasm();
    return this._sign(endpoint, authParams, message, uniqSign);
  }
  async batchSign(endpoint, authParams, messages) {
    await initWasm();
    return Promise.all(messages.map((message) => this._sign(endpoint, authParams, message)));
  }
  async _sign(endpoint, authParams, message, uniqSign = false) {
    message = toBuffer(message);
    authParams = typeof authParams == "string" ? authParams : JSON.stringify(authParams);
    const key = new EcdsaKey(this.id, "", JSON.stringify(this.childKey));
    const sign = JSON.parse(await ecdsa_sign(endpoint, authParams, message, key, uniqSign));
    return {
      r: hex2Buffer(sign.r),
      s: hex2Buffer(sign.s),
      v: sign.recid
    };
  }
  async signTx(endpoint, authParams, txData) {
    await initWasm();
    const key = new EcdsaKey(this.id, "", JSON.stringify(this.childKey));
    const data = JSON.parse(
      await ecdsa_sign_tx(endpoint, typeof authParams == "string" ? authParams : JSON.stringify(authParams), JSON.stringify(txData), key)
    );
    if (isLegacyTx(txData)) {
      data.v = "0x" + (parseInt(data.v.substring(2), 16) + (txData?.chainId || 1) * 2 + 35).toString(16);
    }
    return data;
  }
  async signTronTx(endpoint, authParams, txData) {
    await initWasm();
    let chainId = txData?.chainId || 728126428;
    chainId = typeof chainId === "string" && chainId.startsWith("0x") ? parseInt(chainId, 16) : Number(chainId);
    const data = Object.keys(txData).filter(
      (key) => [
        "from",
        "to",
        "value",
        "data",
        "gas",
        "originEnergyLimit",
        "name",
        "abi",
        "consumeUserResourcePercent",
        "tokenId",
        "tokenValue"
      ].includes(key)
    ).reduce((obj, key) => {
      obj[key] = txData[key];
      return obj;
    }, {});
    if (!data?.to) {
      data.originEnergyLimit = data?.originEnergyLimit || 1e17;
    }
    if (data?.data?.length > 2) {
      data.gas = data?.gas || `0x${Number(357e5).toString(16)}`;
    }
    const res = await this.rpcRequest(endpoint, authParams, chainId, "buildTransaction", { ...data });
    if (!res.result) {
      throw new ServerError(res?.error?.code ?? 10001, res?.error?.message ?? "System error", "", "");
    }
    const tx = res.result.transaction;
    const signature = await this.sign(endpoint, authParams, hex2Buffer(tx.txID));
    tx.signature = [signature.r.toString("hex") + signature.s.toString("hex") + `0${signature.v}`];
    return `0x${Buffer.from(JSON.stringify(tx)).toString("hex")}`;
  }
  async rpcRequest(endpoint, authParams, chainId, method, ...params) {
    authParams = typeof authParams == "string" ? JSON.parse(authParams) : authParams;
    const url = `${endpoint.replace("api", "rpc")}/evm-chain?chainId=${chainId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${authParams.project_uuid}:${authParams.project_client_key}`, "utf8").toString("base64")}`
      },
      body: JSON.stringify({
        id: +new Date(),
        jsonrpc: "2.0",
        chainId,
        method,
        params
      })
    });
    if (!response.ok) {
      throw new ServerError(10001, "System error, request failed");
    }
    return response.json();
  }
  async refresh(endpoint, authParams) {
    await initWasm();
    const key = new EcdsaKey(this.id, JSON.stringify(this.masterKey), "");
    const data = await ecdsa_rotate(endpoint, typeof authParams == "string" ? authParams : JSON.stringify(authParams), key);
    const newKey = new Ecdsa(data.id, data.master_key, data.child_key);
    this.id = newKey.id;
    this.masterKey = newKey.masterKey;
    this.childKey = newKey.childKey;
    return newKey;
  }
};
function get_message_to_sign(str) {
  const txData = JSON.parse(str);
  if (isLegacyTx(txData)) {
    let chainId = 1;
    if ("chainId" in txData && txData.chainId !== void 0) {
      if (typeof txData.chainId === "number") {
        chainId = txData.chainId;
      } else {
        chainId = txData.chainId.startsWith("0x") ? parseInt(txData.chainId.substring(2), 16) : parseInt(txData.chainId);
      }
    }
    const tx = Transaction.fromTxData(txData, {
      common: Common.custom({ chainId }, { hardfork: Hardfork.SpuriousDragon })
    });
    return tx.getMessageToSign();
  } else {
    const tx = TransactionFactory.fromTxData(txData);
    return tx.getMessageToSign();
  }
}
function isLegacyTx(txData) {
  return !("type" in txData) || txData.type === void 0 || txData.type === "0x0" || txData.type === 0;
}

// src/wasm/thresh_sig_wasm.js
var wasm;
var heap = new Array(128).fill(void 0);
heap.push(void 0, null, true, false);
function getObject(idx) {
  return heap[idx];
}
var heap_next = heap.length;
function dropObject(idx) {
  if (idx < 132)
    return;
  heap[idx] = heap_next;
  heap_next = idx;
}
function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}
var cachedTextDecoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }) : { decode: () => {
  throw Error("TextDecoder not available");
} };
if (typeof TextDecoder !== "undefined") {
  cachedTextDecoder.decode();
}
var cachedUint8Memory0 = null;
function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
function addHeapObject(obj) {
  if (heap_next === heap.length)
    heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];
  heap[idx] = obj;
  return idx;
}
var WASM_VECTOR_LEN = 0;
var cachedTextEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder("utf-8") : { encode: () => {
  throw Error("TextEncoder not available");
} };
var encodeString = typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view) {
  return cachedTextEncoder.encodeInto(arg, view);
} : function(arg, view) {
  const buf = cachedTextEncoder.encode(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length
  };
};
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr2 = malloc(buf.length) >>> 0;
    getUint8Memory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len) >>> 0;
  const mem = getUint8Memory0();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 127)
      break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3) >>> 0;
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);
    offset += ret.written;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
function isLikeNone(x) {
  return x === void 0 || x === null;
}
var cachedInt32Memory0 = null;
function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}
function debugString(val) {
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString(val[i]);
    }
    debug += "]";
    return debug;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    return toString.call(val);
  }
  if (className == "Object") {
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  if (val instanceof Error) {
    return `${val.name}: ${val.message}
${val.stack}`;
  }
  return className;
}
function makeMutClosure(arg0, arg1, dtor, f) {
  const state = { a: arg0, b: arg1, cnt: 1, dtor };
  const real = (...args) => {
    state.cnt++;
    const a = state.a;
    state.a = 0;
    try {
      return f(a, state.b, ...args);
    } finally {
      if (--state.cnt === 0) {
        wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);
      } else {
        state.a = a;
      }
    }
  };
  real.original = state;
  return real;
}
function __wbg_adapter_26(arg0, arg1, arg2) {
  wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__he561f054b64cb340(arg0, arg1, addHeapObject(arg2));
}
function eddsa_keygen(endpoint, auth_params) {
  const ptr0 = passStringToWasm0(endpoint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(auth_params, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.eddsa_keygen(ptr0, len0, ptr1, len1);
  return takeObject(ret);
}
function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1) >>> 0;
  getUint8Memory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
  return instance.ptr;
}
function eddsa_sign(endpoint, auth_params, message, key) {
  const ptr0 = passStringToWasm0(endpoint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(auth_params, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArray8ToWasm0(message, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  _assertClass(key, EdDsaKey);
  var ptr3 = key.__destroy_into_raw();
  const ret = wasm.eddsa_sign(ptr0, len0, ptr1, len1, ptr2, len2, ptr3);
  return takeObject(ret);
}
function ecdsa_keygen(endpoint, auth_params) {
  const ptr0 = passStringToWasm0(endpoint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(auth_params, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.ecdsa_keygen(ptr0, len0, ptr1, len1);
  return takeObject(ret);
}
function ecdsa_sign(endpoint, auth_params, message, key, uniq_sign) {
  const ptr0 = passStringToWasm0(endpoint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(auth_params, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArray8ToWasm0(message, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  _assertClass(key, EcdsaKey);
  var ptr3 = key.__destroy_into_raw();
  const ret = wasm.ecdsa_sign(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, isLikeNone(uniq_sign) ? 16777215 : uniq_sign ? 1 : 0);
  return takeObject(ret);
}
function ecdsa_sign_tx(endpoint, auth_params, tx_data, key) {
  const ptr0 = passStringToWasm0(endpoint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(auth_params, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(tx_data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len2 = WASM_VECTOR_LEN;
  _assertClass(key, EcdsaKey);
  var ptr3 = key.__destroy_into_raw();
  const ret = wasm.ecdsa_sign_tx(ptr0, len0, ptr1, len1, ptr2, len2, ptr3);
  return takeObject(ret);
}
function ecdsa_rotate(endpoint, auth_params, key) {
  const ptr0 = passStringToWasm0(endpoint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(auth_params, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  _assertClass(key, EcdsaKey);
  var ptr2 = key.__destroy_into_raw();
  const ret = wasm.ecdsa_rotate(ptr0, len0, ptr1, len1, ptr2);
  return takeObject(ret);
}
function hash_password(password, salt) {
  let deferred4_0;
  let deferred4_1;
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passStringToWasm0(password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    wasm.hash_password(retptr, ptr0, len0, ptr1, len1);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    var r3 = getInt32Memory0()[retptr / 4 + 3];
    var ptr3 = r0;
    var len3 = r1;
    if (r3) {
      ptr3 = 0;
      len3 = 0;
      throw takeObject(r2);
    }
    deferred4_0 = ptr3;
    deferred4_1 = len3;
    return getStringFromWasm0(ptr3, len3);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
    wasm.__wbindgen_free(deferred4_0, deferred4_1);
  }
}
function encrypt(plaintext, key) {
  let deferred4_0;
  let deferred4_1;
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passStringToWasm0(plaintext, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    wasm.encrypt(retptr, ptr0, len0, ptr1, len1);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    var r3 = getInt32Memory0()[retptr / 4 + 3];
    var ptr3 = r0;
    var len3 = r1;
    if (r3) {
      ptr3 = 0;
      len3 = 0;
      throw takeObject(r2);
    }
    deferred4_0 = ptr3;
    deferred4_1 = len3;
    return getStringFromWasm0(ptr3, len3);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
    wasm.__wbindgen_free(deferred4_0, deferred4_1);
  }
}
function decrypt(ciphertext, key) {
  let deferred4_0;
  let deferred4_1;
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passStringToWasm0(ciphertext, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    wasm.decrypt(retptr, ptr0, len0, ptr1, len1);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    var r3 = getInt32Memory0()[retptr / 4 + 3];
    var ptr3 = r0;
    var len3 = r1;
    if (r3) {
      ptr3 = 0;
      len3 = 0;
      throw takeObject(r2);
    }
    deferred4_0 = ptr3;
    deferred4_1 = len3;
    return getStringFromWasm0(ptr3, len3);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
    wasm.__wbindgen_free(deferred4_0, deferred4_1);
  }
}
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e));
  }
}
function __wbg_adapter_162(arg0, arg1, arg2, arg3) {
  wasm.wasm_bindgen__convert__closures__invoke2_mut__h47250f64619b534a(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}
var EcdsaKey = class {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(EcdsaKey.prototype);
    obj.__wbg_ptr = ptr;
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_ecdsakey_free(ptr);
  }
  get id() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.__wbg_get_ecdsakey_id(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(deferred1_0, deferred1_1);
    }
  }
  set id(arg0) {
    const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_ecdsakey_id(this.__wbg_ptr, ptr0, len0);
  }
  get master_key() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.__wbg_get_ecdsakey_master_key(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(deferred1_0, deferred1_1);
    }
  }
  set master_key(arg0) {
    const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_ecdsakey_master_key(this.__wbg_ptr, ptr0, len0);
  }
  get child_key() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.__wbg_get_ecdsakey_child_key(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(deferred1_0, deferred1_1);
    }
  }
  set child_key(arg0) {
    const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_ecdsakey_child_key(this.__wbg_ptr, ptr0, len0);
  }
  constructor(id, master_key, child_key) {
    const ptr0 = passStringToWasm0(id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(master_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(child_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.ecdsakey_new(ptr0, len0, ptr1, len1, ptr2, len2);
    return EcdsaKey.__wrap(ret);
  }
};
var EdDsaKey = class {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(EdDsaKey.prototype);
    obj.__wbg_ptr = ptr;
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_eddsakey_free(ptr);
  }
  get id() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.__wbg_get_eddsakey_id(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(deferred1_0, deferred1_1);
    }
  }
  set id(arg0) {
    const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_eddsakey_id(this.__wbg_ptr, ptr0, len0);
  }
  get key_agg() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.__wbg_get_eddsakey_key_agg(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(deferred1_0, deferred1_1);
    }
  }
  set key_agg(arg0) {
    const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_eddsakey_key_agg(this.__wbg_ptr, ptr0, len0);
  }
  get key_pair() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.__wbg_get_eddsakey_key_pair(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(deferred1_0, deferred1_1);
    }
  }
  set key_pair(arg0) {
    const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_eddsakey_key_pair(this.__wbg_ptr, ptr0, len0);
  }
  constructor(id, key_agg, key_pair) {
    const ptr0 = passStringToWasm0(id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(key_agg, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(key_pair, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.eddsakey_new(ptr0, len0, ptr1, len1, ptr2, len2);
    return EdDsaKey.__wrap(ret);
  }
};
var ServerError = class {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(ServerError.prototype);
    obj.__wbg_ptr = ptr;
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_servererror_free(ptr);
  }
  get error_code() {
    const ret = wasm.__wbg_get_servererror_error_code(this.__wbg_ptr);
    return ret;
  }
  set error_code(arg0) {
    wasm.__wbg_set_servererror_error_code(this.__wbg_ptr, arg0);
  }
  get message() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.__wbg_get_servererror_message(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(deferred1_0, deferred1_1);
    }
  }
  set message(arg0) {
    const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_servererror_message(this.__wbg_ptr, ptr0, len0);
  }
  get extra() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.__wbg_get_servererror_extra(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(deferred1_0, deferred1_1);
    }
  }
  set extra(arg0) {
    const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_servererror_extra(this.__wbg_ptr, ptr0, len0);
  }
  get path() {
    let deferred1_0;
    let deferred1_1;
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.__wbg_get_servererror_path(retptr, this.__wbg_ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      deferred1_0 = r0;
      deferred1_1 = r1;
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(deferred1_0, deferred1_1);
    }
  }
  set path(arg0) {
    const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.__wbg_set_servererror_path(this.__wbg_ptr, ptr0, len0);
  }
  constructor(error_code, message, extra, path) {
    const ptr0 = passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    var ptr1 = isLikeNone(extra) ? 0 : passStringToWasm0(extra, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    var ptr2 = isLikeNone(path) ? 0 : passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len2 = WASM_VECTOR_LEN;
    const ret = wasm.servererror_new(error_code, ptr0, len0, ptr1, len1, ptr2, len2);
    return ServerError.__wrap(ret);
  }
};
async function __wbg_load(module2, imports) {
  if (typeof Response === "function" && module2 instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module2, imports);
      } catch (e) {
        if (module2.headers.get("Content-Type") != "application/wasm") {
        } else {
          throw e;
        }
      }
    }
    const bytes = await module2.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module2, imports);
    if (instance instanceof WebAssembly.Instance) {
      return { instance, module: module2 };
    } else {
      return instance;
    }
  }
}
function __wbg_get_imports() {
  const imports = {};
  imports.wbg = {};
  imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
    takeObject(arg0);
  };
  imports.wbg.__wbg_servererror_new = function(arg0) {
    const ret = ServerError.__wrap(arg0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_cb_drop = function(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
      obj.a = 0;
      return true;
    }
    const ret = false;
    return ret;
  };
  imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_is_undefined = function(arg0) {
    const ret = getObject(arg0) === void 0;
    return ret;
  };
  imports.wbg.__wbg_getmessagetosign_e9412d530252fd1e = function(arg0, arg1, arg2) {
    const ret = get_message_to_sign(getStringFromWasm0(arg1, arg2));
    const ptr1 = passArray8ToWasm0(ret, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbg_eddsakey_new = function(arg0) {
    const ret = EdDsaKey.__wrap(arg0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_ecdsakey_new = function(arg0) {
    const ret = EcdsaKey.__wrap(arg0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof obj === "string" ? obj : void 0;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbg_new_abda76e883ba8a5f = function() {
    const ret = new Error();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_stack_658279fe44541cf6 = function(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbg_error_f851667af71bcfc6 = function(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
      deferred0_0 = arg0;
      deferred0_1 = arg1;
    } finally {
      wasm.__wbindgen_free(deferred0_0, deferred0_1);
    }
  };
  imports.wbg.__wbindgen_is_string = function(arg0) {
    const ret = typeof getObject(arg0) === "string";
    return ret;
  };
  imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_instanceof_Window_c5579e140698a9dc = function(arg0) {
    let result;
    try {
      result = getObject(arg0) instanceof Window;
    } catch {
      result = false;
    }
    const ret = result;
    return ret;
  };
  imports.wbg.__wbg_fetch_bb49ae9f1d79408b = function(arg0, arg1) {
    const ret = getObject(arg0).fetch(getObject(arg1));
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_origin_35ef5d6a71c924b6 = function(arg0, arg1) {
    const ret = getObject(arg1).origin;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbg_pathname_715df8a6b71fdfd7 = function(arg0, arg1) {
    const ret = getObject(arg1).pathname;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbg_search_24b39c2a5b10e06c = function(arg0, arg1) {
    const ret = getObject(arg1).search;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbg_setsearch_7aeec58875c5946b = function(arg0, arg1, arg2) {
    getObject(arg0).search = getStringFromWasm0(arg1, arg2);
  };
  imports.wbg.__wbg_searchParams_d5568d267828eeea = function(arg0) {
    const ret = getObject(arg0).searchParams;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_new_f6818a0e274befa9 = function() {
    return handleError(function(arg0, arg1) {
      const ret = new URL(getStringFromWasm0(arg0, arg1));
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_instanceof_Response_7ade9a5a066d1a55 = function(arg0) {
    let result;
    try {
      result = getObject(arg0) instanceof Response;
    } catch {
      result = false;
    }
    const ret = result;
    return ret;
  };
  imports.wbg.__wbg_status_d2b2d0889f7e970f = function(arg0) {
    const ret = getObject(arg0).status;
    return ret;
  };
  imports.wbg.__wbg_ok_0a0ed9a1863d8af5 = function(arg0) {
    const ret = getObject(arg0).ok;
    return ret;
  };
  imports.wbg.__wbg_text_65fa1887e8f7b4ac = function() {
    return handleError(function(arg0) {
      const ret = getObject(arg0).text();
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_instanceof_WorkerGlobalScope_5188d176509513d4 = function(arg0) {
    let result;
    try {
      result = getObject(arg0) instanceof WorkerGlobalScope;
    } catch {
      result = false;
    }
    const ret = result;
    return ret;
  };
  imports.wbg.__wbg_fetch_621998933558ad27 = function(arg0, arg1) {
    const ret = getObject(arg0).fetch(getObject(arg1));
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_url_3325e0ef088003ca = function(arg0, arg1) {
    const ret = getObject(arg1).url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbg_newwithstr_49e8bfa3150f3210 = function() {
    return handleError(function(arg0, arg1) {
      const ret = new Request(getStringFromWasm0(arg0, arg1));
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_newwithstrandinit_a4cd16dfaafcf625 = function() {
    return handleError(function(arg0, arg1, arg2) {
      const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_new_5cb136b036dd2286 = function() {
    return handleError(function() {
      const ret = new URLSearchParams();
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_append_5b8ac576a0a2c65a = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
  };
  imports.wbg.__wbg_new_143b41b4342650bb = function() {
    return handleError(function() {
      const ret = new Headers();
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_set_76353df4722f4954 = function() {
    return handleError(function(arg0, arg1, arg2, arg3, arg4) {
      getObject(arg0).set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments);
  };
  imports.wbg.__wbg_crypto_58f13aa23ffcb166 = function(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_is_object = function(arg0) {
    const val = getObject(arg0);
    const ret = typeof val === "object" && val !== null;
    return ret;
  };
  imports.wbg.__wbg_process_5b786e71d465a513 = function(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_versions_c2ab80650590b6a2 = function(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_node_523d7bd03ef69fba = function(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_msCrypto_abcb1295e768d1f2 = function(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_require_2784e593a4674877 = function() {
    return handleError(function() {
      const ret = module.require;
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbindgen_is_function = function(arg0) {
    const ret = typeof getObject(arg0) === "function";
    return ret;
  };
  imports.wbg.__wbg_getRandomValues_504510b5564925af = function() {
    return handleError(function(arg0, arg1) {
      getObject(arg0).getRandomValues(getObject(arg1));
    }, arguments);
  };
  imports.wbg.__wbg_randomFillSync_a0d98aa11c81fe89 = function() {
    return handleError(function(arg0, arg1) {
      getObject(arg0).randomFillSync(takeObject(arg1));
    }, arguments);
  };
  imports.wbg.__wbg_get_7303ed2ef026b2f5 = function(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_newnoargs_c9e6043b8ad84109 = function(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_next_ec061e48a0e72a96 = function() {
    return handleError(function(arg0) {
      const ret = getObject(arg0).next();
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_done_b6abb27d42b63867 = function(arg0) {
    const ret = getObject(arg0).done;
    return ret;
  };
  imports.wbg.__wbg_value_2f4ef2036bfad28e = function(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_get_f53c921291c381bd = function() {
    return handleError(function(arg0, arg1) {
      const ret = Reflect.get(getObject(arg0), getObject(arg1));
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_call_557a2f2deacc4912 = function() {
    return handleError(function(arg0, arg1) {
      const ret = getObject(arg0).call(getObject(arg1));
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_new_2b6fea4ea03b1b95 = function() {
    const ret = new Object();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_self_742dd6eab3e9211e = function() {
    return handleError(function() {
      const ret = self.self;
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_window_c409e731db53a0e2 = function() {
    return handleError(function() {
      const ret = window.window;
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_globalThis_b70c095388441f2d = function() {
    return handleError(function() {
      const ret = globalThis.globalThis;
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_global_1c72617491ed7194 = function() {
    return handleError(function() {
      const ret = global.global;
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_instanceof_Error_fac23a8832b241da = function(arg0) {
    let result;
    try {
      result = getObject(arg0) instanceof Error;
    } catch {
      result = false;
    }
    const ret = result;
    return ret;
  };
  imports.wbg.__wbg_message_eab7d45ec69a2135 = function(arg0) {
    const ret = getObject(arg0).message;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_name_8e6176d4db1a502d = function(arg0) {
    const ret = getObject(arg0).name;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_toString_506566b763774a16 = function(arg0) {
    const ret = getObject(arg0).toString();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_call_587b30eea3e09332 = function() {
    return handleError(function(arg0, arg1, arg2) {
      const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
      return addHeapObject(ret);
    }, arguments);
  };
  imports.wbg.__wbg_entries_039ff76b77e573c1 = function(arg0) {
    const ret = getObject(arg0).entries();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_now_c857fb0367c762cc = function() {
    const ret = Date.now();
    return ret;
  };
  imports.wbg.__wbg_toString_e2b23ac99490a381 = function(arg0) {
    const ret = getObject(arg0).toString();
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_new_2b55e405e4af4986 = function(arg0, arg1) {
    try {
      var state0 = { a: arg0, b: arg1 };
      var cb0 = (arg02, arg12) => {
        const a = state0.a;
        state0.a = 0;
        try {
          return __wbg_adapter_162(a, state0.b, arg02, arg12);
        } finally {
          state0.a = a;
        }
      };
      const ret = new Promise(cb0);
      return addHeapObject(ret);
    } finally {
      state0.a = state0.b = 0;
    }
  };
  imports.wbg.__wbg_resolve_ae38ad63c43ff98b = function(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_then_8df675b8bb5d5e3c = function(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_then_835b073a479138e5 = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_buffer_55ba7a6b1b92e2ac = function(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_newwithbyteoffsetandlength_88d1d8be5df94b9b = function(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_new_09938a7d020f049b = function(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_set_3698e3ca519b3c3c = function(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
  };
  imports.wbg.__wbg_newwithlength_89eeca401d8918c2 = function(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_subarray_d82be056deb4ad27 = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
  };
  imports.wbg.__wbg_set_07da13cc24b69217 = function() {
    return handleError(function(arg0, arg1, arg2) {
      const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
      return ret;
    }, arguments);
  };
  imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
  };
  imports.wbg.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  };
  imports.wbg.__wbindgen_memory = function() {
    const ret = wasm.memory;
    return addHeapObject(ret);
  };
  imports.wbg.__wbindgen_closure_wrapper734 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 222, __wbg_adapter_26);
    return addHeapObject(ret);
  };
  return imports;
}
function __wbg_init_memory(imports, maybe_memory) {
}
function __wbg_finalize_init(instance, module2) {
  wasm = instance.exports;
  __wbg_init.__wbindgen_wasm_module = module2;
  cachedInt32Memory0 = null;
  cachedUint8Memory0 = null;
  wasm.__wbindgen_start();
  return wasm;
}
async function __wbg_init(input) {
  if (wasm !== void 0)
    return wasm;
  if (typeof input === "undefined") {
    input = new URL("../wasm/thresh_sig_wasm_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports();
  if (typeof input === "string" || typeof Request === "function" && input instanceof Request || typeof URL === "function" && input instanceof URL) {
    input = fetch(input);
  }
  __wbg_init_memory(imports);
  const { instance, module: module2 } = await __wbg_load(await input, imports);
  return __wbg_finalize_init(instance, module2);
}
var thresh_sig_wasm_default = __wbg_init;

// src/util.ts
var toBuffer = (arr) => {
  if (Buffer2.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer2.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer2.from(arr);
  }
};
var hex2Buffer = (hex) => {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return toBuffer(bytes);
};
var toLittleEndian = (buffer) => {
  if (buffer.length < 1) {
    return buffer;
  }
  let j = buffer.length - 1;
  let tmp = 0;
  for (let i = 0; i < buffer.length / 2; i++) {
    tmp = buffer[i];
    buffer[i] = buffer[j];
    buffer[j] = tmp;
    j--;
  }
  return buffer;
};
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function generateKey(password, uuid) {
  await initWasm();
  return hash_password(password, uuid);
}
async function encryptData(plaintext, key) {
  await initWasm();
  return encrypt(plaintext, key);
}
async function decryptData(ciphertext, key) {
  await initWasm();
  return decrypt(ciphertext, key);
}

// src/eddsa.ts
import { Buffer as Buffer3 } from "buffer";
var SCALAR_BYTES_SIZE = 32;
var POINT_BYTES_SIZE = 32;
var EdDsa = class {
  id;
  keyAgg;
  keyPair;
  constructor(id, keyAgg, keyPair) {
    this.id = id;
    this.keyAgg = typeof keyAgg == "string" ? JSON.parse(keyAgg) : keyAgg;
    this.keyPair = typeof keyPair == "string" ? JSON.parse(keyPair) : keyPair;
  }
  static async gen(endpoint, authParams) {
    await initWasm();
    const key = await eddsa_keygen(endpoint, typeof authParams == "string" ? authParams : JSON.stringify(authParams));
    return new EdDsa(key.id, key.key_agg, key.key_pair);
  }
  static from(data) {
    const eddsa = typeof data == "string" ? JSON.parse(data) : data;
    return new EdDsa(eddsa.id, eddsa.keyAgg, eddsa.keyPair);
  }
  to() {
    return JSON.stringify({
      id: this.id,
      keyAgg: this.keyAgg,
      keyPair: this.keyPair
    });
  }
  pub() {
    return hex2Buffer(this.keyAgg.apk.bytes_str);
  }
  async sign(endpoint, authParams, message) {
    await initWasm();
    return this._sign(endpoint, authParams, message);
  }
  async batchSign(endpoint, authParams, messages) {
    await initWasm();
    return Promise.all(messages.map((message) => this._sign(endpoint, authParams, message)));
  }
  async _sign(endpoint, authParams, message) {
    const key = new EdDsaKey(this.id, JSON.stringify(this.keyAgg), JSON.stringify(this.keyPair));
    const sign = JSON.parse(
      await eddsa_sign(endpoint, typeof authParams == "string" ? authParams : JSON.stringify(authParams), toBuffer(message), key)
    );
    const RBuf = Buffer3.from(sign.R.bytes_str.padStart(POINT_BYTES_SIZE * 2, "0"), "hex");
    const sBuf = Buffer3.from(sign.s.padStart(SCALAR_BYTES_SIZE * 2, "0"), "hex");
    const sBufLE = toLittleEndian(sBuf);
    return Buffer3.concat([RBuf, sBufLE], POINT_BYTES_SIZE + SCALAR_BYTES_SIZE);
  }
};

// src/index.ts
var context = {
  initializing: false,
  initialized: false
};
async function initWasm() {
  while (context.initializing) {
    await sleep(10);
  }
  if (!context.initialized) {
    context.initializing = true;
    try {
      await thresh_sig_wasm_default();
      context.initialized = true;
    } catch (e) {
    }
    context.initializing = false;
  }
}
function getVersion() {
  return "0.7.8";
}
export {
  Ecdsa,
  EdDsa,
  ServerError,
  decryptData,
  encryptData,
  generateKey,
  getVersion,
  get_message_to_sign,
  initWasm
};
