import * as crypto from "crypto";
import { env } from "~/env";

export const encode = (text: string) => {
  if (!env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is not defined");

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(env.NEXTAUTH_SECRET),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decode = (text: string) => {
  if (!env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is not defined");

  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(env.NEXTAUTH_SECRET),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const hash = (text: string) => {
  if (!env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is not defined");

  const hmac = crypto.createHmac("sha256", env.NEXTAUTH_SECRET);
  hmac.update(text);
  return hmac.digest("hex");
};
