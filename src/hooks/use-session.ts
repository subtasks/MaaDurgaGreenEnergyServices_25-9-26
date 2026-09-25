import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SessionInfo = {
  user: User | null;
  fullName: string;
  isAdmin: boolean;
  loading: boolean;
};

export function useSession(): SessionInfo {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setFullName("");
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", nextUser.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", nextUser.id),
      ]);
      if (!active) return;
      setFullName(
        profile?.full_name ||
          (nextUser.user_metadata?.["full_name"] as string | undefined) ||
          nextUser.email?.split("@")[0] ||
          "there",
      );
      setIsAdmin(Boolean(roles?.some((r) => r.role === "admin")));
      setLoading(false);
    };

    supabase.auth.getUser().then(({ data }) => load(data.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load(session?.user ?? null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, fullName, isAdmin, loading };
}
