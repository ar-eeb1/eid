export function encodeWish(data) {
    // Simple base64 encoding for the object
    try {
        return Buffer.from(JSON.stringify(data)).toString('base64url');
    } catch (e) {
        console.error("Error encoding wish:", e);
        return '';
    }
}

export function decodeWish(encoded) {
    try {
        return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    } catch (e) {
        console.error("Error decoding wish:", e);
        return null;
    }
}
