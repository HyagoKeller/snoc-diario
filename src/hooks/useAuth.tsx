import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/snoc";
import { turnoAtual } from "@/lib/snoc";
import { toast } from "sonner";

type Profile = { id: string; nome: string; email: string; grupo_ad: string | null; ativo: boolean };

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  role: AppRole | null;
  isManager: boolean;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  role: null,
  isManager: false,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

const PRIORITY: AppRole[] = ["super_admin", "gestor", "operador"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState<string>(turnoAtual());

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setRoles([]);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    let alive = true;
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      if (!alive) return;
      
      const userProfile = p as Profile;
      if (userProfile && !userProfile.ativo) {
        toast.error("Sua conta está aguardando ativação por um gestor.");
        await signOut();
        return;
      }

      setProfile(userProfile ?? null);
      setRoles(((r ?? []) as { role: AppRole }[]).map((x) => x.role));
    })();
    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  // Shift boundary logout logic
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const nowShift = turnoAtual();
      if (nowShift !== currentShift) {
        toast.info("Fim do turno atingido. Por segurança, sua sessão foi encerrada.");
        signOut();
        setCurrentShift(nowShift);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session, currentShift]);

  const role = PRIORITY.find((p) => roles.includes(p)) ?? null;

  const value: AuthValue = {
    session,
    user: session?.user ?? null,
    profile,
    roles,
    role,
    isManager: roles.includes("gestor") || roles.includes("super_admin"),
    isAdmin: roles.includes("super_admin"),
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
