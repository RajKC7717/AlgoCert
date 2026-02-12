import * as algoskit from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { getAlgodConfigFromViteEnvironment } from './network/getAlgoClientConfigs';

export async function mintGradeNFT(studentAddress: string, score: number, activeAddress: string) {
  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algodClient = algoskit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  });

  // 1. Define the NFT Metadata (Stored on-chain in the 'Note' field)
  const metadata = {
    standard: "arc69",
    description: `Smart-Lab Certified Developer. Score: ${score}/100. Integrity: High.`,
    properties: {
      exam: "Python Algorithms 101",
      score: score,
      platform: "Smart-Lab",
      timestamp: new Date().toISOString()
    }
  };

  const note = new TextEncoder().encode(JSON.stringify(metadata));

  // 2. Construct the Transaction (Asset Creation)
  const suggestedParams = await algodClient.getTransactionParams().do();
  
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: activeAddress,
    suggestedParams,
    defaultFrozen: false,
    unitName: "GRADE",
    assetName: `Smart-Lab Grade: ${score}`,
    manager: activeAddress,
    reserve: activeAddress,
    freeze: activeAddress,
    clawback: activeAddress,
    assetURL: "https://smart-lab.edu/certificate", // In production, this would be IPFS
    total: 1, // It's an NFT, so unique count is 1
    decimals: 0,
    note: note, // <--- This proves their score on-chain!
  });

  return txn;
}