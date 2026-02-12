import * as algosdk from 'algosdk';
import * as algoskit from '@algorandfoundation/algokit-utils';
import { getAlgodConfigFromViteEnvironment } from './network/getAlgoClientConfigs';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined' && !window.Buffer) window.Buffer = Buffer;

// ⚠️ THE EXAM AUTHORITY WALLET (Where the fee goes)
// For LocalNet, we can just send it back to the sender or a dummy address
const EXAM_AUTHORITY = "BHND6Z5OFOQLVKDIOFXQQTAKUFTYB7Q7ERHX54NAVEBPIEQZDB4MUUXKLQ"; 

export async function payExamFee(sender: string) {
  const cleanSender = sender.trim();
  console.log("💰 PAYMENT DEBUG: Initiating 0.001 Algo Fee...");

  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algodClient = algoskit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  });

  const suggestedParams = await algodClient.getTransactionParams().do();

  // 🛠️ ROBUST METHOD: Direct Transaction Construction
  const txn = new algosdk.Transaction({
    from: cleanSender,
    to: EXAM_AUTHORITY,
    amount: 1000, // 0.001 Algo (MicroAlgos)
    type: algosdk.TransactionType.pay, // Payment Transaction
    suggestedParams: suggestedParams,
    note: new Uint8Array(Buffer.from("Smart-Lab Exam Fee")),
  });

  return txn;
}