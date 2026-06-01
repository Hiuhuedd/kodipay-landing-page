const SECRET_KEY_STRING = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'kodi_default_secret_key_32_bytes!';

const str2ab = (str) => new TextEncoder().encode(str);

const ab2base64 = (ab) => {
    let binary = '';
    const bytes = new Uint8Array(ab);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export async function encryptData(text) {
    if (!text) return text;
    if (typeof window === 'undefined') return text; // SSR fallback
    
    try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', str2ab(SECRET_KEY_STRING));
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            hashBuffer,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt"]
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedContent = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            str2ab(text)
        );

        const encryptedBytes = new Uint8Array(encryptedContent);
        const combined = new Uint8Array(iv.length + encryptedBytes.length);
        combined.set(iv, 0);
        combined.set(encryptedBytes, iv.length);
        
        return ab2base64(combined);
    } catch (e) {
        console.error('Encryption failed:', e);
        return text;
    }
}

const base642ab = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

export async function decryptData(encryptedBase64) {
    if (!encryptedBase64 || typeof encryptedBase64 !== 'string') return encryptedBase64;
    if (typeof window === 'undefined') return encryptedBase64;
    // Check if it's base64
    if (!/^[a-zA-Z0-9+/]+={0,2}$/.test(encryptedBase64) || encryptedBase64.length < 28) {
        return encryptedBase64;
    }

    try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', str2ab(SECRET_KEY_STRING));
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            hashBuffer,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );

        const combined = new Uint8Array(base642ab(encryptedBase64));
        const iv = combined.slice(0, 12);
        const encryptedBytes = combined.slice(12);

        const decryptedContent = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            encryptedBytes
        );

        return new TextDecoder().decode(decryptedContent);
    } catch (e) {
        // Fallback if not decryptable
        return encryptedBase64;
    }
}
