import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "../firebase";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const CUSTOMER_ARTWORK_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
];

export async function uploadOrderFile({
  userId,
  orderId,
  file,
  kind = "artwork",
  onProgress,
}) {
  if (!file) throw new Error("Choose a file first.");
  if (!userId) throw new Error("You must be signed in.");
  if (!orderId) throw new Error("Order ID is missing.");
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File is too large. Maximum size is 20 MB.");
  }

  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-");

  const path = `orders/${userId}/${orderId}/${kind}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, path);

  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || "application/octet-stream",
    customMetadata: {
      orderId,
      kind,
      originalName: file.name,
    },
  });

  await new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const pct = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0;
        onProgress?.(pct);
      },
      reject,
      resolve
    );
  });

  return {
    name: file.name,
    url: await getDownloadURL(task.snapshot.ref),
    path,
    contentType: file.type || "",
    size: file.size,
    uploadedAt: new Date().toISOString(),
    kind,
  };
}
