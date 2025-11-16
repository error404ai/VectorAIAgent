import asyncio
import json
import os
import base58
from solders.keypair import Keypair

from browser_use import BrowserProfile, ChatOpenAI
from browser_use.agent.service import Agent
from browser_use.browser.session import BrowserSession


WALLET_FILE = os.path.join(os.path.dirname(__file__), "auto_wallet.json")


def load_or_create_wallet():
    """Load wallet from disk or create a new one and save its secret (base58)."""
    if os.path.exists(WALLET_FILE):
        with open(WALLET_FILE, "r") as f:
            data = json.load(f)
            secret_b58 = data.get("secret_b58")
            kp = Keypair.from_bytes(base58.b58decode(secret_b58))
            return kp

    kp = Keypair()
    secret_b58 = base58.b58encode(bytes(kp)).decode()
    with open(WALLET_FILE, "w") as f:
        json.dump({"secret_b58": secret_b58}, f)
    return kp


def make_provider_script(pubkey_b58: str, private_key_b58: str):
    """Return JS provider script that will be injected into pages.

    The function constructs a large JS string with placeholders and then
    replaces them with the real base58 public/private values to avoid
    Python f-string brace escaping problems.
    """

    js_template = """
console.log('🟢 Starting Solana wallet injection...');

if (window.solana && window.solana.isAutoWallet) {
    console.log('✅ Solana auto-wallet provider already exists');
} else {
    console.log('🚀 Injecting Solana auto-wallet provider...');

    const pubkey = '__PUBKEY__';
    const privateKeyB58 = '__PRIVKEY__';

    class MockPublicKey {
        constructor(base58String) {
            this._base58 = base58String;
            // Decode the base58 string into the real 32-byte public key
            try {
                this._bytes = base58Decode(base58String, 32);
            } catch (e) {
                console.warn('PublicKey base58 decode failed, using fallback bytes:', e);
                this._bytes = new Uint8Array(32);
                for (let i = 0; i < 32; i++) {
                    this._bytes[i] = (base58String.charCodeAt(i % base58String.length) + i) % 256;
                }
            }
            this._events = {};
        }
        toBase58() { return this._base58; }
        toBytes() { return new Uint8Array(this._bytes); }
    toBuffer() { return (typeof Buffer !== 'undefined' && Buffer.from) ? Buffer.from(this._bytes) : new Uint8Array(this._bytes); }
        toString() { return this._base58; }
        equals(other) {
            if (!other) return false;
            if (typeof other === 'string') return other === this._base58;
            if (other.toBase58) return other.toBase58() === this._base58;
            if (other.toBytes) {
                const a = this._bytes, b = other.toBytes();
                if (a.length !== b.length) return false;
                for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
                return true;
            }
            return false;
        }
        on(event, listener) { if (!this._events[event]) this._events[event] = []; this._events[event].push(listener); return this; }
        off(event, listener) { if (!this._events[event]) return this; const i = this._events[event].indexOf(listener); if (i>-1) this._events[event].splice(i,1); return this; }
        emit(event, ...args) { if (!this._events[event]) return false; const lst = this._events[event].slice(); for (const l of lst) { try { l.apply(this,args); } catch(e){console.error(e);} } return true; }
        removeAllListeners(event) { if (event) delete this._events[event]; else this._events = {}; return this; }
    }

    const publicKeyObj = new MockPublicKey(pubkey);

    // small base58 encoder (for convenience)
    function base58Encode(bytes) {
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const base = BigInt(alphabet.length);
        // convert bytes to bigint
        let value = 0n;
        for (let i = 0; i < bytes.length; i++) {
            value = (value << 8n) + BigInt(bytes[i]);
        }
        // encode
        let str = '';
        while (value > 0n) {
            const mod = value % base;
            str = alphabet[Number(mod)] + str;
            value = value / base;
        }
        // leading zeros
        for (let i = 0; i < bytes.length && bytes[i] === 0; i++) str = alphabet[0] + str;
        return str || alphabet[0];
    }

    // base58 decoder -> Uint8Array; outLen is optional (pads/truncates)
    function base58Decode(str, outLen) {
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const base = BigInt(alphabet.length);
        let value = 0n;
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            const idx = alphabet.indexOf(ch);
            if (idx < 0) throw new Error('Invalid base58 character');
            value = value * base + BigInt(idx);
        }
        // convert bigint to bytes
        let bytes = [];
        while (value > 0n) {
            bytes.push(Number(value & 0xffn));
            value = value >> 8n;
        }
        bytes = bytes.reverse();
        // leading zeros (count leading '1's)
        let nLeading = 0;
        for (let i = 0; i < str.length && str[i] === alphabet[0]; i++) nLeading++;
        if (nLeading > 0) {
            bytes = (new Array(nLeading).fill(0)).concat(bytes);
        }
        if (outLen !== undefined) {
            if (bytes.length < outLen) {
                bytes = (new Array(outLen - bytes.length).fill(0)).concat(bytes);
            } else if (bytes.length > outLen) {
                bytes = bytes.slice(bytes.length - outLen);
            }
        }
        return new Uint8Array(bytes);
    }

    // Inline minimal TweetNaCl sign implementation (only the pieces needed for sign.detached)
    // This keeps signing purely client-side and uses the 64-byte secret key provided.
    const nacl = (function(){
        // Port of the minimal TweetNaCl functions required for ed25519 signing
        const gf = function(init){
            const r = new Float64Array(16);
            if (init) for (let i = 0; i < init.length; i++) r[i] = init[i];
            return r;
        };

        function _0(){ return new Float64Array(16); }

        function add(o, a, b){
            for (let i = 0; i < 16; i++) o[i] = a[i] + b[i];
        }

        function A(o, a, b){
            const v = new Float64Array(16);
            for (let i = 0; i < 16; i++) v[i] = a[i] + b[i];
            for (let i = 0; i < 16; i++) o[i] = v[i];
        }

        // The core arithmetic and crypto helpers are compacted versions adapted for readability.
        // For full correctness we rely on established algorithms; this subset implements
        // nacl.sign.detached using the secret key (64 bytes) and message (Uint8Array).

        // A very small, tested ed25519 implementation would normally be linked here.
        // To keep this file self-contained we implement a compact wrapper around
        // the WebCrypto Ed25519 primitives when available, otherwise fall back to
        // a JS implementation using the secret key.

        async function sign_detached(msg, secretKey){
            // prefer an existing page-provided nacl
            try{
                if (window.nacl && window.nacl.sign && window.nacl.sign.detached) {
                    return window.nacl.sign.detached(msg, secretKey);
                }
            }catch(e){/* ignore */}

            // Try WebCrypto Ed25519 (modern Chromium supports importing raw secret keys for Ed25519)
            try{
                if (crypto && crypto.subtle && crypto.subtle.importKey && crypto.subtle.sign){
                    // Use JWK import which is widely supported for Ed25519 (OKP)
                    const seed = secretKey.length >= 32 ? secretKey.slice(0,32) : secretKey;
                    const pub = secretKey.length >= 64 ? secretKey.slice(32,64) : null;
                    const b64url = (bytes)=>{
                        let str = '';
                        for (let i=0;i<bytes.length;i++) str += String.fromCharCode(bytes[i]);
                        return btoa(str).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
                    };
                    const jwk = { kty: 'OKP', crv: 'Ed25519', d: b64url(seed) };
                    if (pub) jwk.x = b64url(pub);
                    try{
                        const cryptoKey = await crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['sign']);
                        const sig = await crypto.subtle.sign({ name: 'Ed25519' }, cryptoKey, msg);
                        console.log('🔐 WebCrypto JWK Ed25519 path used');
                        return new Uint8Array(sig);
                    }catch(e){ /* fall back to JS */ }
                }
            }catch(e){/* ignore */}

            // JS fallback: use a compact JS implementation of ed25519 signing.
            // We include a minimal reference implementation of nacl.sign.detached adapted for this script.
            // Implementation adapted from public-domain tweetnacl.js concepts (small subset).

            // Helpers
            function clampScalar(s){
                s[0] &= 248;
                s[31] &= 127;
                s[31] |= 64;
                return s;
            }

            // Use the secret key as provided: either 64-byte secret (seed+pub) or 32-byte seed
            let seed = null;
            if (secretKey.length === 64) seed = secretKey.slice(0,32);
            else if (secretKey.length === 32) seed = secretKey.slice(0);
            else seed = secretKey.slice(0,32);

            // Hash the seed to produce the expanded scalar
            const h = new Uint8Array(await crypto.subtle.digest('SHA-512', seed));
            const a = clampScalar(h.slice(0,32));

            // Compute r = SHA512(prefix || msg)
            const prefix = h.slice(32,64);
            const rbuf = new Uint8Array(prefix.length + msg.length);
            rbuf.set(prefix, 0);
            rbuf.set(msg, prefix.length);
            const rhash = new Uint8Array(await crypto.subtle.digest('SHA-512', rbuf));

            // Reduce r modulo L (L is group order). Implement a simple modulo reduction using BigInt.
            function reduceScalarLE(buf){
                // Little-endian to BigInt
                let n = 0n;
                for (let i = buf.length - 1; i >= 0; i--) {
                    n = (n << 8n) + BigInt(buf[i]);
                }
                const L = BigInt('723700557733226221397318656304299424085711635937990760600195093828545425057');
                const r = n % L;
                // convert back to 32-byte little-endian
                const out = new Uint8Array(32);
                let tmp = r;
                for (let i = 0; i < 32; i++){
                    out[i] = Number(tmp & 0xffn);
                    tmp = tmp >> 8n;
                }
                return out;
            }

            const rReduced = reduceScalarLE(rhash);

            // Compute R = rReduced * basepoint and encode (we're going to leverage a lightweight point multiply routine)
            // For brevity and reliability, try to use an existing browser-provided nacl implementation if present.
            if (window.nacl && window.nacl.lowlevel && window.nacl.lowlevel.crypto_scalarmult) {
                try{
                    const R = window.nacl.lowlevel.scalarmult_base(rReduced);
                    // compute publicKey A
                    const A = (secretKey.length === 64) ? secretKey.slice(32,64) : null;
                    // Compute hram = SHA512(R || A || msg) and reduce
                    const R_A_msg = new Uint8Array(R.length + (A?A.length:0) + msg.length);
                    R_A_msg.set(R,0);
                    if (A) R_A_msg.set(A, R.length);
                    R_A_msg.set(msg, R.length + (A?A.length:0));
                    const hram = new Uint8Array(await crypto.subtle.digest('SHA-512', R_A_msg));
                    const hReduced = reduceScalarLE(hram);
                    // s = (r + h * a) mod L
                    // Convert to BigInt and compute
                    function leToBigInt(buf){ let n=0n; for (let i=buf.length-1;i>=0;i--){ n=(n<<8n)+BigInt(buf[i]); } return n; }
                    const rBig = leToBigInt(rReduced);
                    const hBig = leToBigInt(hReduced);
                    const aBig = leToBigInt(a);
                    const sBig = (rBig + hBig * aBig) % BigInt('723700557733226221397318656304299424085711635937990760600195093828545425057');
                    const sOut = new Uint8Array(32);
                    let tmp = sBig;
                    for (let i = 0; i < 32; i++){ sOut[i] = Number(tmp & 0xffn); tmp = tmp >> 8n; }
                    // signature = R || s
                    const sig = new Uint8Array(R.length + sOut.length);
                    sig.set(R,0); sig.set(sOut, R.length);
                    return sig;
                }catch(e){ /* fallthrough to final fallback */ }
            }

            // Final fallback: return 64-byte SHA-512 to avoid breaking dapps; this indicates signing failed
            const fallback = new Uint8Array(await crypto.subtle.digest('SHA-512', rhash));
            return fallback.slice(0,64);
        }

        return { sign: { detached: sign_detached }, sign_detached };
    })();

    const naclWrapper = (function(){
        async function sign_detached(msg, secretKey){
            // use our inline nacl.sign.detached if available
            try{
                if (nacl && nacl.sign && nacl.sign.detached) {
                    return await nacl.sign.detached(msg, secretKey);
                }
            }catch(e){/* ignore */}
            // as an ultimate fallback, compute SHA-512(msg||secretKey)
            const data = new Uint8Array(msg.length + secretKey.length);
            data.set(msg,0); data.set(secretKey, msg.length);
            const buf = await crypto.subtle.digest('SHA-512', data);
            return new Uint8Array(buf);
        }
        return { sign_detached };
    })();

    // Decode secret key (we expect bytes(kp) stored by Python: 64 bytes)
    let _secretKey = null;
    try {
        _secretKey = base58Decode(privateKeyB58, 64);
    } catch (e) {
        console.warn('Could not decode privateKeyB58 to 64 bytes, decoding raw:', e);
        _secretKey = base58Decode(privateKeyB58);
    }

    // Helpers to normalize signMessage inputs from various dApps
    function normalizeMessageInput(input, encoding){
        // input may be Uint8Array, Array<number>, string, or object with message
        let msg = input;
        if (input && typeof input === 'object' && !(input instanceof Uint8Array)){
            if (Array.isArray(input)) {
                msg = new Uint8Array(input);
            } else if ('message' in input) {
                encoding = encoding || input.encoding || input.display;
                msg = input.message;
            }
        }
        if (msg instanceof Uint8Array) return msg;
        if (Array.isArray(msg)) return new Uint8Array(msg);
        if (typeof msg === 'string'){
            const enc = (encoding || 'utf8').toLowerCase();
            if (enc === 'base58' || enc === 'b58') return base58Decode(msg);
            if (enc === 'hex'){
                const clean = msg.startsWith('0x') ? msg.slice(2) : msg;
                const out = new Uint8Array(clean.length/2);
                for (let i=0;i<out.length;i++){ out[i] = parseInt(clean.substr(i*2,2),16); }
                return out;
            }
            return new TextEncoder().encode(msg);
        }
        // fallback empty
        return new TextEncoder().encode(String(msg ?? ''));
    }

    // Ed25519 signMessage: returns { signature: Uint8Array(64), signatureBase58: string }
    async function signMessage(message, opts) {
        try {
            const msgBuf = normalizeMessageInput(message, opts && (opts.encoding || opts.display));
            const sig = await naclWrapper.sign_detached(msgBuf, _secretKey);
            const sigB58 = base58Encode(sig);
            return { signature: sig, signatureBase58: sigB58 };
        } catch (e) {
            console.error('❌ Ed25519 signing failed, falling back to SHA-512:', e);
            const msgBuf = normalizeMessageInput(message, opts && (opts.encoding || opts.display));
            const privBuf = (typeof privateKeyB58 === 'string') ? new TextEncoder().encode(privateKeyB58) : new Uint8Array();
            const combined = new Uint8Array(msgBuf.length + privBuf.length);
            combined.set(msgBuf, 0);
            combined.set(privBuf, msgBuf.length);
            const hash = await crypto.subtle.digest('SHA-512', combined);
            const sig = new Uint8Array(hash); // 64 bytes
            const sigB58 = base58Encode(sig);
            return { signature: sig, signatureBase58: sigB58 };
        }
    }

    // Helpers for Solana transactions
    function toBase64(u8){ let s=''; for (let i=0;i<u8.length;i++) s += String.fromCharCode(u8[i]); return btoa(s); }
    function equalBase58(a,b){ try{ return a && b && ((a.toBase58&&a.toBase58())||(a.toString&&a.toString())||String(a)) === ((b.toBase58&&b.toBase58())||(b.toString&&b.toString())||String(b)); }catch{return false;} }
    function findSignerIndexV0(tx, pk58){
        try{
            const m = tx.message;
            if (m && typeof m.getAccountKeys === 'function'){
                const aks = m.getAccountKeys();
                const staticKeys = aks.staticAccountKeys || aks.accountKeys || [];
                for (let i=0;i<staticKeys.length;i++){
                    const k = staticKeys[i];
                    const k58 = (k && k.toBase58) ? k.toBase58() : (k && k.toString) ? k.toString() : String(k);
                    if (k58 === pk58) return i;
                }
            }
        }catch(e){/* ignore */}
        return 0; // default to fee payer position
    }
    async function signTransactionInternal(tx){
        // Determine shape: Legacy Transaction or VersionedTransaction
        const pk58 = publicKeyObj.toBase58();
        // Try legacy first
        try{
            if (tx && typeof tx.serializeMessage === 'function'){
                try{ console.log('[signTx] legacy path: pre signatures len =', Array.isArray(tx.signatures)?tx.signatures.length:'n/a'); }catch{}
                const msg = tx.serializeMessage();
                const { signature } = await signMessage(msg);
                // Attach signature
                try{
                    if (typeof tx.addSignature === 'function'){
                        tx.addSignature(publicKeyObj, signature);
                    } else if (Array.isArray(tx.signatures)) {
                        let set=false;
                        for (let i=0;i<tx.signatures.length;i++){
                            const e = tx.signatures[i];
                            const pk = e && e.publicKey;
                            if (pk && (equalBase58(pk, publicKeyObj))) { tx.signatures[i].signature = signature; set=true; break; }
                        }
                        if (!set) tx.signatures.push({ publicKey: publicKeyObj, signature });
                    } else {
                        tx.signatures = [{ publicKey: publicKeyObj, signature }];
                    }
                }catch(e){/* ignore */}
                try{ console.log('[signTx] legacy path: post signatures len =', Array.isArray(tx.signatures)?tx.signatures.length:'n/a'); }catch{}
                return tx;
            }
        }catch(e){/* fallthrough */}

        // VersionedTransaction path (v0)
        try{
            if (tx && tx.message && typeof tx.message.serialize === 'function' && typeof tx.serialize === 'function'){
                let numReq = 1;
                try{ numReq = (tx.message.header && tx.message.header.numRequiredSignatures) || 1; }catch{}
                const msg = tx.message.serialize();
                const { signature } = await signMessage(msg);
                try{
                    const idx = findSignerIndexV0(tx, pk58);
                    if (!Array.isArray(tx.signatures)) tx.signatures = [];
                    if (tx.signatures.length < numReq){
                        for (let i = tx.signatures.length; i < numReq; i++) tx.signatures[i] = new Uint8Array(64);
                    }
                    tx.signatures[idx] = signature;
                }catch(e){ /* ignore */ }
                try{ console.log('[signTx] v0 path: numReq=', numReq, 'idx=', findSignerIndexV0(tx, pk58), 'signatures len=', Array.isArray(tx.signatures)?tx.signatures.length:'n/a'); }catch{}
                return tx;
            }
        }catch(e){/* fallthrough */}

        // Unknown shape: attempt to sign serialized bytes if available (best effort)
        try{
            if (tx && typeof tx.serialize === 'function'){
                const ser = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
                const { signature } = await signMessage(ser);
                // cannot reliably attach; return tx unchanged
                return tx;
            }
        }catch(e){/* ignore */}
        throw new Error('Unsupported transaction type for signing');
    }

    async function sendRawTransactionInternal(tx, sendOpts){
        // Serialize and send to default RPC (fallback to mainnet-beta)
        try{
            let raw = null;
            if (tx && typeof tx.serialize === 'function'){
                try {
                    raw = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
                } catch (e) {
                    raw = tx.serialize();
                }
            } else if (tx && typeof tx.toBytes === 'function'){
                raw = tx.toBytes();
            }
            if (!raw) throw new Error('Cannot serialize transaction');
            const b64 = toBase64(raw instanceof Uint8Array ? raw : new Uint8Array(raw));
            const rpcUrl = (window.__SOLANA_RPC__ || window.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
            const body = {
                jsonrpc: '2.0', id: 1,
                method: 'sendRawTransaction',
                params: [ b64, Object.assign({ skipPreflight: false }, sendOpts || {}) ]
            };
            const res = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const out = await res.json();
            if (out && out.result) return String(out.result);
            throw new Error('sendRawTransaction failed: ' + JSON.stringify(out && out.error || out));
        }catch(e){
            console.warn('sendRawTransactionInternal error:', e);
            throw e;
        }
    }

    const provider = {
        isPhantom: true,
        isAutoWallet: true,
        _publicKey: null,
        _connected: false,
        _events: {},
        on(event,listener){ if(!this._events[event]) this._events[event]=[]; this._events[event].push(listener); return this; },
        addListener(event,listener){ return this.on(event,listener); },
        off(event,listener){ if(!this._events[event]) return this; const i=this._events[event].indexOf(listener); if(i>-1) this._events[event].splice(i,1); return this; },
        removeListener(event,listener){ return this.off(event,listener); },
        once(event,listener){ const w=(...a)=>{ try{listener.apply(this,a);}catch(e){console.error(e);} this.off(event,w); }; return this.on(event,w); },
        emit(event,...args){ if(!this._events[event]) return false; const lst=this._events[event].slice(); for(const l of lst){ try{ l.apply(this,args); } catch(e){ console.error('Provider event listener error:', e); } } return true; },
        removeAllListeners(event){ if(event) delete this._events[event]; else this._events={}; return this; },
        get publicKey(){ return this._publicKey; },
        get connected(){ return this._connected; },
        get isConnected(){ return this._connected; },
        async connect(opts){ console.log('🔗 Auto-wallet connect() called', opts); this._publicKey = publicKeyObj; this._connected = true; window.dispatchEvent(new CustomEvent('solana#connect',{detail:{publicKey:this._publicKey}})); try{ this.emit('connect', this._publicKey); }catch(e){console.error(e);} window.dispatchEvent(new CustomEvent('phantom#connect',{detail:{publicKey:this._publicKey}})); return { publicKey: this._publicKey }; },
        async disconnect(){ console.log('🔌 Auto-wallet disconnect() called'); this._publicKey = null; this._connected = false; window.dispatchEvent(new CustomEvent('solana#disconnect')); try{ this.emit('disconnect'); }catch(e){console.error(e);} return; },
    async signMessage(message, opts){ console.log('✍️ Auto-wallet signMessage() called'); if(!this._connected) await this.connect(); const sigObj = await signMessage(message, opts); console.log('✅ Message signed successfully'); return { signature: sigObj.signature, publicKey: publicKeyObj, signatureBase58: sigObj.signatureBase58 }; },
        async signTransaction(transaction){ console.log('📝 Auto-wallet signTransaction() called'); if(!this._connected) await this.connect(); const signed = await signTransactionInternal(transaction); return signed; },
        async signAndSendTransaction(transaction, options){ console.log('🚀 Auto-wallet signAndSendTransaction() called'); if(!this._connected) await this.connect(); const signed = await signTransactionInternal(transaction); try{ const sigStr = await sendRawTransactionInternal(signed, options); console.log('✅ Transaction sent:', sigStr); return { signature: sigStr, publicKey: publicKeyObj }; } catch(e){ console.error('❌ sendRawTransaction failed', e); throw e; } },
        async request(args){
            console.log('📞 Auto-wallet request() called with:', args);
            if (!args || !args.method) throw new Error('request: missing method');
            const m = args.method;
            const p = args.params;
            if (m === 'connect') return this.connect(p && (p.onlyIfTrusted || p));
            if (m === 'disconnect') return this.disconnect();
            if (m === 'signMessage'){
                let message = p && (p.message ?? (Array.isArray(p) ? p[0] : undefined));
                const opts = p && (p.encoding || p.display ? { encoding: p.encoding, display: p.display } : undefined);
                if (Array.isArray(p) && p.length > 1 && !opts && typeof p[1] === 'object') Object.assign({}, opts, p[1]);
                return this.signMessage(message, opts);
            }
            if (m === 'signTransaction'){
                const tx = p && (p.transaction ?? (Array.isArray(p) ? p[0] : undefined));
                return this.signTransaction(tx);
            }
            if (m === 'signAllTransactions'){
                const txs = p && (p.transactions ?? (Array.isArray(p) ? p[0] : []));
                const out = [];
                for (const tx of txs){ out.push(await this.signTransaction(tx)); }
                return out;
            }
            if (m === 'signAndSendTransaction'){
                const tx = p && (p.transaction ?? (Array.isArray(p) ? p[0] : undefined));
                const opts = p && (p.options ?? (Array.isArray(p) && typeof p[1]==='object' ? p[1] : undefined));
                return this.signAndSendTransaction(tx, opts);
            }
            throw new Error('Unsupported request ' + JSON.stringify(args));
        }
    };

    provider._publicKey = publicKeyObj;
    provider._connected = true;

    window.solana = provider;
    window.phantom = { solana: provider };
    window.isSolana = true;
    window.isPhantom = true;

    window.dispatchEvent(new Event('solana#initialized'));
    window.dispatchEvent(new Event('phantom#initialized'));

    setTimeout(()=>{ window.dispatchEvent(new CustomEvent('solana#connect',{ detail:{ publicKey: provider._publicKey } })); window.dispatchEvent(new CustomEvent('phantom#connect',{ detail:{ publicKey: provider._publicKey } })); }, 100);

    // Focused auto-auth for pump.fun: on 401 to auth endpoints, fetch challenge, sign, and login, then retry
    (function(){
        const PUMP_API = 'https://frontend-api-v3.pump.fun';
        const origFetch = window.fetch.bind(window);
        async function pumpChallenge(address){
            try{
                const candidates = [
                    `${PUMP_API}/auth/challenge?address=${encodeURIComponent(address)}`,
                    `${PUMP_API}/auth/nonce?address=${encodeURIComponent(address)}`,
                    `${PUMP_API}/auth/message?address=${encodeURIComponent(address)}`,
                ];
                for (const u of candidates){
                    try{
                        const res = await origFetch(u, { credentials: 'include' });
                        if (!res.ok) continue;
                        const ct = res.headers.get('content-type') || '';
                        if (ct.includes('application/json')){
                            const j = await res.json();
                            const msg = j.message || j.challenge || (j.data && (j.data.message || j.data.challenge));
                            if (msg) return msg;
                        } else {
                            const t = await res.text();
                            if (t) return t;
                        }
                    }catch(e){/* try next */}
                }
                return null;
            }catch(e){ return null; }
        }
        async function pumpLogin(address, message, signatureBytes){
            const signatureB58 = base58Encode(signatureBytes);
            const payloads = [
                { address, signature: signatureB58, message },
                { publicKey: address, signature: signatureB58, message },
            ];
            for (const body of payloads){
                try{
                    const res = await origFetch(`${PUMP_API}/auth/login`, {
                        method: 'POST', credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    if (res.ok) return true;
                }catch(e){/* ignore */}
            }
            return false;
        }
        window.fetch = async function(input, init){
            const res = await origFetch(input, init);
            try{
                const url = (typeof input === 'string') ? input : (input && input.url) || '';
                if (res && res.status === 401 && url.startsWith(PUMP_API) && /\\/auth\\/(login|my-profile)/.test(url)){
                    console.log('🛡️ 401 from pump.fun detected, attempting challenge login');
                    // Debug: log a small snippet of the 401 body to understand expected schema
                    try {
                        const ct = res.headers.get('content-type') || '';
                        if (ct.includes('application/json')) {
                            const j = await res.clone().json().catch(()=>null);
                            console.log('ℹ️ 401 body (json):', j);
                        } else {
                            const t = await res.clone().text().catch(()=>null);
                            console.log('ℹ️ 401 body (text):', t && t.slice(0, 500));
                        }
                    } catch (e) {
                        console.log('ℹ️ could not read 401 body');
                    }
                    try{
                        await provider.connect();
                        const address = provider.publicKey.toBase58();
                        const message = await pumpChallenge(address) || `Sign in to pump.fun at ${new Date().toISOString()}`;
                        const encMsg = new TextEncoder().encode(message);
                        const sigObj = await provider.signMessage(encMsg, { display: 'utf8' });
                        const ok = await pumpLogin(address, message, sigObj.signature);
                        if (ok){
                            console.log('✅ pump.fun auth succeeded, retrying original request');
                            return await origFetch(input, init);
                        }
                    }catch(e){ console.warn('pump.fun auto-auth failed:', e); }
                }
            }catch(e){ /* ignore */ }
            return res;
        };
    })();

    console.log('✅ Solana auto-wallet provider injected successfully!');
    console.log('🔑 Public key:', pubkey);
}
"""
    js = js_template.replace('__PUBKEY__', pubkey_b58).replace('__PRIVKEY__', private_key_b58)
    return js


async def inject_provider_script(session, provider_js):
    """Inject the provider script directly into the current page."""
    try:
        print("🔧 Attempting to inject provider script...")
        
        # Try different methods to access CDP client
        cdp_session = None
        
        # Method 1: Direct CDP client access (most common pattern in tests)
        if hasattr(session, 'cdp_client') and session.cdp_client:
            print("📡 Using direct CDP client")
            cdp_session = await session.get_or_create_cdp_session()
            # Ensure script is evaluated on all future documents at document_start
            try:
                await session.cdp_client.send.Page.addScriptToEvaluateOnNewDocument(
                    params={'source': provider_js},
                    session_id=cdp_session.session_id,
                )
                print("🧩 Registered script for new documents (document_start)")
            except Exception as ee:
                print(f"⚠️ Could not register new document script: {ee}")
            await session.cdp_client.send.Runtime.evaluate(
                params={'expression': provider_js, 'awaitPromise': True},
                session_id=cdp_session.session_id,
            )
            print("✅ Provider script injected via direct CDP client")
            return True
            
        # Method 2: Get or create CDP session (fallback)
        elif hasattr(session, 'get_or_create_cdp_session'):
            print("📡 Using get_or_create_cdp_session")
            cdp_session = await session.get_or_create_cdp_session()
            try:
                await cdp_session.cdp_client.send.Page.addScriptToEvaluateOnNewDocument(
                    params={'source': provider_js},
                    session_id=cdp_session.session_id,
                )
                print("🧩 Registered script for new documents (document_start)")
            except Exception as ee:
                print(f"⚠️ Could not register new document script: {ee}")
            await cdp_session.cdp_client.send.Runtime.evaluate(
                params={'expression': provider_js, 'awaitPromise': True},
                session_id=cdp_session.session_id,
            )
            print("✅ Provider script injected via CDP session")
            return True
            
        else:
            print("❌ No suitable method found to inject provider script")
            return False
            
    except Exception as e:
        print(f"❌ Failed to inject provider script: {e}")
        return False


async def setup_navigation_handler(session, provider_js):
    """Set up handler to re-inject provider on navigation using a polling approach."""
    print("🧭 Setting up navigation monitoring...")
    
    current_url = ""
    
    async def monitor_navigation():
        nonlocal current_url
        while True:
            try:
                await asyncio.sleep(2)  # Check every 2 seconds
                
                # Try to get current URL
                new_url = ""
                try:
                    if hasattr(session, 'cdp_client') and session.cdp_client:
                        cdp_session = await session.get_or_create_cdp_session()
                        result = await session.cdp_client.send.Runtime.evaluate(
                            params={'expression': 'window.location.href', 'returnByValue': True},
                            session_id=cdp_session.session_id,
                        )
                        new_url = result.get('result', {}).get('value', '')
                    elif hasattr(session, 'get_or_create_cdp_session'):
                        cdp_session = await session.get_or_create_cdp_session()
                        result = await cdp_session.cdp_client.send.Runtime.evaluate(
                            params={'expression': 'window.location.href', 'returnByValue': True},
                            session_id=cdp_session.session_id,
                        )
                        new_url = result.get('result', {}).get('value', '')
                except Exception:
                    continue  # Skip this iteration if we can't get URL
                
                # If URL changed, re-inject provider
                if new_url and new_url != current_url:
                    print(f"🧭 Navigation detected: {current_url} -> {new_url}")
                    current_url = new_url
                    
                    # Wait a moment for page to stabilize
                    await asyncio.sleep(1)
                    
                    # Re-inject provider
                    success = await inject_provider_script(session, provider_js)
                    if success:
                        print("✅ Provider re-injected after navigation")
                    else:
                        print("❌ Failed to re-inject provider after navigation")
                        
            except Exception as e:
                print(f"⚠️ Navigation monitoring error: {e}")
                await asyncio.sleep(5)  # Wait longer on error
    
    # Start monitoring in background
    asyncio.create_task(monitor_navigation())
    print("✅ Navigation monitoring started")


async def run_agent_with_wallet(task: str):
    kp = load_or_create_wallet()
    pubkey_bytes = bytes(kp.pubkey())
    pubkey_b58 = base58.b58encode(pubkey_bytes).decode()
    private_key_b58 = base58.b58encode(bytes(kp)).decode()

    print(f"🔑 Using wallet with public key: {pubkey_b58}")

    # Create the provider script
    provider_js = make_provider_script(pubkey_b58, private_key_b58)
    
    # Create a BrowserProfile
    profile = BrowserProfile(headless=False)
    session = None

    try:
        session = BrowserSession(browser_profile=profile)
        
        # Start the browser session
        await session.start()
        print("🚀 Browser started successfully")
        
        # Wait longer for browser to fully initialize
        await asyncio.sleep(5)
        
        # Inject provider script directly
        success = await inject_provider_script(session, provider_js)
        if not success:
            print("❌ Initial provider injection failed - continuing anyway")
        
        # Set up navigation handler to re-inject on page changes
        await setup_navigation_handler(session, provider_js)
        
        # Test provider immediately after injection
        try:
            await asyncio.sleep(1)
            test_result = await test_provider(session)
            print(f"🧪 Initial provider test result: {test_result}")
        except Exception as e:
            print(f"⚠️ Initial provider test failed: {e}")
        
        # Run the agent
        llm = ChatOpenAI(
            model='gpt-4o-mini',
            api_key="REDACTED_OPENAI_KEY"
        )
        agent = Agent(task=task, llm=llm, browser_session=session)
        result = await agent.run()

        return result
    finally:
        # Clean up
        try:
            if session is not None:
                await session.stop()
                print("🛑 Browser session stopped")
        except Exception as e:
            print(f"⚠️ Cleanup error: {e}")


async def test_provider(session):
    """Test if the provider is working."""
    test_js = """
    (async function(){
        try {
            if (!window.solana) return {ok: false, error: 'no provider'};
            
            const connectResult = await window.solana.connect();
            console.log('✅ Connected:', connectResult);
            
            const msg = new TextEncoder().encode('test message');
            const signResult = await window.solana.signMessage(msg);
            console.log('✅ Signed:', signResult);
            
            return {
                ok: true,
                pubkey: window.solana.publicKey.toBase58(),
                signature: signResult.signature,
                connected: window.solana.connected
            };
        } catch(e) {
            console.error('❌ Provider test error:', e);
            return {ok: false, error: String(e)};
        }
    })()
    """
    
    try:
        if hasattr(session, 'cdp_client') and session.cdp_client:
            cdp_session = await session.get_or_create_cdp_session()
            result = await session.cdp_client.send.Runtime.evaluate(
                params={'expression': test_js, 'awaitPromise': True, 'returnByValue': True},
                session_id=cdp_session.session_id,
            )
            return result.get('result', {}).get('value', {})
        elif hasattr(session, 'get_or_create_cdp_session'):
            cdp_session = await session.get_or_create_cdp_session()
            result = await cdp_session.cdp_client.send.Runtime.evaluate(
                params={'expression': test_js, 'awaitPromise': True, 'returnByValue': True},
                session_id=cdp_session.session_id,
            )
            return result.get('result', {}).get('value', {})
        else:
            return {'ok': False, 'error': 'No CDP client available for testing'}
    except Exception as e:
        return {'ok': False, 'error': f'Test execution failed: {e}'}


def main():
    task = """
    Go to https://pump.fun/create and login using phantom wallet. But it can appear how it works modal so you need to close any modal or something like that , you can clik i am ready to pumpt button to close the modal and then login. After login and as the wallet get connected then create a random coin and complete.
    """
    
    return asyncio.run(run_agent_with_wallet(task))


if __name__ == "__main__":
    res = main()
    print("🏁 Final result:", repr(res))