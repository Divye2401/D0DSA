import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "config.env" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const encryptCookie = async (cookie) => {
  const { data: encryptedCookie, error: encryptError } = await supabase.rpc(
    "encrypt_cookie",
    {
      cookie_value: cookie.value,
      secret_key: process.env.DB_ENCRYPTION_KEY,
    }
  );
  if (encryptError) {
    console.error("Encryption error:", encryptError);
    return encryptError;
  }
  return encryptedCookie;
};

export const decryptCookie = async (cookie) => {
  const { data: decryptedCookie, error: decryptError } = await supabase.rpc(
    "decrypt_cookie",
    {
      encrypted_cookie: cookie,
      secret_key: process.env.DB_ENCRYPTION_KEY,
    }
  );

  if (decryptError || !decryptedCookie) {
    return decryptError;
  }
  return decryptedCookie;
};
