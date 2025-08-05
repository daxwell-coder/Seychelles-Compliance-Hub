// Import necessary libraries
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { parse } from "csv-parse";
import { getStorage } from "firebase-admin/storage";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

// Initialize the Firebase Admin SDK
initializeApp();
const firestore = getFirestore();
const storage = getStorage();

// Define a type for a single transaction record based on the CSV columns
interface TransactionRecord {
  transactionId: string;
  amount: string;
  currency: string;
  description: string;
}

// Define the Cloud Function
export const processTransactionFile = onObjectFinalized({
  bucket: "seychelles-compliance-hub-uploads",
  region: "us-central1",
  serviceAccount: 'seychelles-compliance-hub@appspot.gserviceaccount.com'
}, async (event) => {
  const { name, contentType } = event.data;
  const fileBucket = event.data.bucket;

  if (!name || !contentType || path.basename(name).startsWith('.') || !contentType.startsWith("text/csv")) {
    console.log("This is not a valid CSV file. Exiting.");
    return null;
  }

  console.log(`Processing file: ${name} from bucket: ${fileBucket}`);

  const bucket = storage.bucket(fileBucket);
  const file = bucket.file(name);
  const tempFilePath = path.join(os.tmpdir(), name);
  const collectionRef = firestore.collection("transactions");

  try {
    await file.download({ destination: tempFilePath });
    console.log(`File downloaded to ${tempFilePath}`);

    const records: TransactionRecord[] = await new Promise((resolve, reject) => {
      const parsedRecords: TransactionRecord[] = [];
      fs.createReadStream(tempFilePath)
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on("data", (data: TransactionRecord) => parsedRecords.push(data))
        .on("end", () => resolve(parsedRecords))
        .on("error", (error) => reject(error));
    });

    console.log(`CSV parsed. Found ${records.length} records.`);

    if (records.length > 0) {
      const batch = firestore.batch();
      records.forEach((record) => {
        const docRef = collectionRef.doc();
        batch.set(docRef, record);
      });
      await batch.commit();
      console.log("Successfully imported all records to Firestore.");
    }
    
    fs.unlinkSync(tempFilePath);
    await file.delete();
    console.log(`Successfully deleted temporary file and original uploaded file.`);
    
  } catch (error) {
    console.error("Error processing file:", error);
  }

  return null;
});