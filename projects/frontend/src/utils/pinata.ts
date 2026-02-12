import axios from 'axios';

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

// --- CORE FUNCTIONS (Used by ExamRoom) ---

export const pinFileToIPFS = async (file: File | Blob): Promise<PinataResponse> => {
  if (!PINATA_JWT) throw new Error("Missing VITE_PINATA_JWT in .env");

  const formData = new FormData();
  formData.append('file', file);
  
  const filename = 'name' in file ? file.name : 'upload.png';
  const metadata = JSON.stringify({ name: filename });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({ cidVersion: 1 });
  formData.append('pinataOptions', options);

  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
    maxBodyLength: Infinity,
    headers: { 'Authorization': `Bearer ${PINATA_JWT}` }
  });

  return res.data; 
};

export const pinJSONToIPFS = async (jsonData: object): Promise<PinataResponse> => {
  if (!PINATA_JWT) throw new Error("Missing VITE_PINATA_JWT in .env");

  const data = JSON.stringify({
    pinataOptions: { cidVersion: 1 },
    pinataMetadata: { name: "metadata.json" },
    pinataContent: jsonData
  });

  const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", data, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PINATA_JWT}`
    }
  });

  return res.data;
};

// --- ALIASES (Used by DevDuel) ---
// These just call the functions above but return the string URL format DevDuel expects.

export const uploadToIPFS = async (file: File | Blob, name: string): Promise<string> => {
    const res = await pinFileToIPFS(file);
    return `ipfs://${res.IpfsHash}`;
};

export const uploadJSONToIPFS = async (jsonData: object, name: string): Promise<string> => {
    const res = await pinJSONToIPFS(jsonData);
    return `ipfs://${res.IpfsHash}`;
};

// --- HELPERS ---

export const ipfsHttpUrl = (cid: string): string => {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
};

export const base64ToBlob = (base64: string): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: 'image/png' });
};