import axios from 'axios';

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export const uploadToIPFS = async (file: File | Blob, name: string): Promise<string> => {
    if (!PINATA_JWT) throw new Error("Missing VITE_PINATA_JWT in .env");

    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = JSON.stringify({ name: name });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({ cidVersion: 1 });
    formData.append('pinataOptions', options);

    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        maxBodyLength: Infinity,
        headers: {
            'Authorization': `Bearer ${PINATA_JWT}`
        }
    });

    return `ipfs://${res.data.IpfsHash}`;
};

export const uploadJSONToIPFS = async (jsonData: object, name: string): Promise<string> => {
    if (!PINATA_JWT) throw new Error("Missing VITE_PINATA_JWT in .env");

    const data = JSON.stringify({
        pinataOptions: { cidVersion: 1 },
        pinataMetadata: { name: name },
        pinataContent: jsonData
    });

    const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", data, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PINATA_JWT}`
        }
    });

    return `ipfs://${res.data.IpfsHash}`;
};

// Helper: Convert Base64 to Blob for uploading
export const base64ToBlob = (base64: string): Blob => {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/png' });
};