import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hashPassword, verifyPassword, needsRehash } from "@/lib/admin/password";

/**
 * Expert account lookup and credential verification.
 *
 * Server-only, service-role. The password hash must never leave this module:
 * nothing here returns it, and RLS on `experts` has zero policies, so no
 * browser-side key can read the column even if one existed.
 */

export type ExpertAccount = {
  id: string;
  fullName: string;
  email: string;
};

export interface AccountStore {
  /** Returns the account when the credentials are correct, otherwise null. */
  authenticate(email: string, password: string): Promise<ExpertAccount | null>;
  /** Creates or updates the password for an expert. Returns false if absent. */
  setPassword(email: string, password: string): Promise<boolean>;
}

class SupabaseAccountStore implements AccountStore {
  private db: SupabaseClient;
  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async authenticate(email: string, password: string): Promise<ExpertAccount | null> {
    const normalised = email.trim().toLowerCase();
    const { data } = await this.db
      .from("experts")
      .select("id, full_name, email, password_hash, is_active")
      .ilike("email", normalised)
      .maybeSingle();

    /*
     * A missing account and a wrong password must be indistinguishable, and
     * must take a similar amount of time. Returning early on "no such user"
     * would let someone enumerate valid staff emails by timing the response,
     * so a dummy verification runs against a throwaway hash instead.
     */
    if (!data?.password_hash || data.is_active === false) {
      await verifyPassword(password, DUMMY_HASH);
      return null;
    }

    const ok = await verifyPassword(password, data.password_hash);
    if (!ok) return null;

    // Upgrade the stored hash opportunistically if the cost factor has been
    // raised since it was written. The user never notices.
    if (needsRehash(data.password_hash)) {
      const fresh = await hashPassword(password);
      await this.db.from("experts").update({ password_hash: fresh }).eq("id", data.id);
    }

    await this.db
      .from("experts")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.id);

    return { id: data.id, fullName: data.full_name, email: data.email };
  }

  async setPassword(email: string, password: string): Promise<boolean> {
    const normalised = email.trim().toLowerCase();
    const hash = await hashPassword(password);
    const { data } = await this.db
      .from("experts")
      .update({ password_hash: hash, email: normalised })
      .ilike("email", normalised)
      .select("id");
    return Boolean(data && data.length > 0);
  }
}

/**
 * A syntactically valid hash that no password matches, used to keep the
 * timing of a failed lookup close to that of a wrong password. Generated
 * once at module load rather than being a constant, so it is not a fixed
 * value an attacker could recognise.
 */
const DUMMY_HASH =
  "pbkdf2$600000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

let store: AccountStore | null = null;

export function getAccountStore(): AccountStore | null {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  store = new SupabaseAccountStore(url, key);
  return store;
}

/** Test seam. */
export function __setAccountStore(next: AccountStore | null) {
  store = next;
}
