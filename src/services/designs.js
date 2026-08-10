import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export async function saveOrderDesign(orderId, design) {
  if (!orderId) throw new Error("Order ID is required.");

  const ref = doc(db, "orderDesigns", orderId);
  await setDoc(
    ref,
    {
      design,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function loadOrderDesign(orderId) {
  if (!orderId) return null;

  const snap = await getDoc(doc(db, "orderDesigns", orderId));
  if (!snap.exists()) return null;

  return snap.data()?.design || null;
}
