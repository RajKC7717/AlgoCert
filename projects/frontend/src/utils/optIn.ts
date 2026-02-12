import * as algosdk from 'algosdk';
import * as algoskit from '@algorandfoundation/algokit-utils';
import { getAlgodConfigFromViteEnvironment } from './network/getAlgoClientConfigs';
import { Buffer } from 'buffer';

// Force Polyfill
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

export async function sendCommitmentPing(sender: string) {
  const cleanSender = sender.trim();
  console.log("📝 COMMITMENT DEBUG: Building 0 Algo Ping...");

  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algodClient = algoskit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  });

  const suggestedParams = await algodClient.getTransactionParams().do();

  // 🛠️ FALLBACK STRATEGY: Standard Payment
  // Instead of an Asset Transfer (which is crashing), we send 0 Algo to ourselves.
  // This creates an on-chain record that the exam started, without the SDK bugs.
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: cleanSender,
    to: cleanSender,       // Send to Self
    amount: 0,             // 0 Algo
    note: new Uint8Array(Buffer.from("Smart-Lab Exam Started")), // The Proof
    suggestedParams: suggestedParams,
  });

  return txn;
}