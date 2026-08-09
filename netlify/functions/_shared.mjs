import {
  createSign,
  createVerify,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

let certCache = { expiresAt: 0, certs: null };
let accessTokenCache = { expiresAt: 0, token: null };

function b64urlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  return Buffer.from(normalized + pad, "base64");
}

function b64urlEncode(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function parseJwt(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("Invalid Firebase ID token.");
  const [h, p, s] = parts;
  return {
    signingInput: `${h}.${p}`,
    header: JSON.parse(b64urlDecode(h).toString("utf8")),
    payload: JSON.parse(b64urlDecode(p).toString("utf8")),
    signature: b64urlDecode(s),
  };
}

async function getGoogleCerts() {
  const now = Date.now();
  if (certCache.certs && certCache.expiresAt > now + 30_000) return certCache.certs;

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) throw new Error("Unable to load Firebase signing certificates.");
  const certs = await response.json();

  const cacheControl = response.headers.get("cache-control") || "";
  const match = cacheControl.match(/max-age=(\d+)/i);
  const maxAge = match ? Number(match[1]) : 3600;
  certCache = { certs, expiresAt: now + maxAge * 1000 };
  return certs;
}

export async function verifyFirebaseIdToken(token, projectId) {
  const decoded = parseJwt(token);
  if (decoded.header.alg !== "RS256" || !decoded.header.kid) {
    throw new Error("Invalid Firebase ID token header.");
  }

  const certs = await getGoogleCerts();
  const cert = certs[decoded.header.kid];
  if (!cert) throw new Error("Firebase signing certificate not found.");

  const verifier = createVerify("RSA-SHA256");
  verifier.update(decoded.signingInput);
  verifier.end();

  if (!verifier.verify(cert, decoded.signature)) {
    throw new Error("Firebase ID token signature is invalid.");
  }

  const now = Math.floor(Date.now() / 1000);
  const p = decoded.payload;
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (p.aud !== projectId) throw new Error("Firebase token audience is invalid.");
  if (p.iss !== expectedIssuer) throw new Error("Firebase token issuer is invalid.");
  if (!p.sub || typeof p.sub !== "string") throw new Error("Firebase token subject is invalid.");
  if (!p.exp || p.exp <= now) throw new Error("Firebase ID token has expired.");
  if (!p.iat || p.iat > now + 300) throw new Error("Firebase token issued-at time is invalid.");
  if (p.auth_time && p.auth_time > now + 300) throw new Error("Firebase auth time is invalid.");

  return p;
}

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
  if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.project_id) {
    throw new Error("Firebase service account JSON is incomplete.");
  }
  return serviceAccount;
}

export async function getGoogleAccessToken() {
  const nowMs = Date.now();
  if (accessTokenCache.token && accessTokenCache.expiresAt > nowMs + 60_000) {
    return accessTokenCache.token;
  }

  const serviceAccount = getServiceAccount();
  const now = Math.floor(nowMs / 1000);

  const header = b64urlEncode(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = b64urlEncode(Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  })));

  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = b64urlEncode(signer.sign(serviceAccount.private_key));
  const assertion = `${unsigned}.${signature}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    console.error("Google OAuth error:", data);
    throw new Error("Unable to authenticate the Firestore service account.");
  }

  accessTokenCache = {
    token: data.access_token,
    expiresAt: nowMs + (Number(data.expires_in || 3600) * 1000),
  };
  return data.access_token;
}

function firestoreBase(projectId) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
}

export function fromFirestoreValue(v) {
  if (!v) return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return Boolean(v.booleanValue);
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in v) return fromFirestoreFields(v.mapValue.fields || {});
  return undefined;
}

export function fromFirestoreFields(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, fromFirestoreValue(v)])
  );
}

export function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === "object") return { mapValue: { fields: toFirestoreFields(v) } };
  return { stringValue: String(v) };
}

export function toFirestoreFields(obj = {}) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, toFirestoreValue(v)])
  );
}

export async function firestoreGet(projectId, path) {
  const token = await getGoogleAccessToken();
  const response = await fetch(`${firestoreBase(projectId)}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) return null;
  const data = await response.json();
  if (!response.ok) {
    console.error("Firestore GET error:", data);
    throw new Error("Unable to read Firestore.");
  }
  return { ...fromFirestoreFields(data.fields || {}), __name: data.name };
}

export async function firestoreCreateWithId(projectId, collectionName, documentId, data) {
  const token = await getGoogleAccessToken();
  const url = `${firestoreBase(projectId)}/${collectionName}?documentId=${encodeURIComponent(documentId)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });

  if (response.status === 409) {
    return { alreadyExists: true };
  }

  const result = await response.json();
  if (!response.ok) {
    console.error("Firestore CREATE error:", result);
    throw new Error("Unable to save the order to Firestore.");
  }
  return result;
}

export function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

export function verifyStripeSignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader || !secret) throw new Error("Stripe signature information is missing.");

  let timestamp = null;
  const signatures = [];
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = Number(value);
    if (key === "v1") signatures.push(value);
  }

  if (!timestamp || !signatures.length) throw new Error("Stripe signature header is invalid.");

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) throw new Error("Stripe webhook timestamp is too old.");

  const expectedHex = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  const expected = Buffer.from(expectedHex, "hex");

  const valid = signatures.some((sig) => {
    try {
      const received = Buffer.from(sig, "hex");
      return received.length === expected.length && timingSafeEqual(received, expected);
    } catch {
      return false;
    }
  });

  if (!valid) throw new Error("Stripe webhook signature is invalid.");
}

export async function firestorePatch(projectId, path, data) {
  const token = await getGoogleAccessToken();
  const url = `${firestoreBase(projectId)}/${path}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  const result = await response.json();
  if (!response.ok) {
    console.error("Firestore PATCH error:", result);
    throw new Error("Unable to update Firestore.");
  }
  return { ...fromFirestoreFields(result.fields || {}) };
}

export async function sendEmail({to,subject,html,text}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL;
  if (!apiKey || !from || !to) {
    console.log("Email skipped: RESEND_API_KEY, ORDER_FROM_EMAIL, or recipient is missing.");
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Resend email error:", data);
    return { error: data };
  }
  return data;
}
