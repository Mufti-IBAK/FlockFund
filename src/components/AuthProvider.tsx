"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  isActive: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isActive: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsActive(!!session);
      setIsLoading(false);
    });

    // 2. Listen to ongoing auth changes (Token Refresh, Sign Out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsActive(!!session);
      
      if (event === "SIGNED_OUT") {
        // Clear local storage / rogue cookies securely just in case
        router.refresh(); // Tells Next.js to re-evaluate server components/middleware
        router.push("/login");
      }

      if (event === "TOKEN_REFRESHED") {
        // Token successfully rotated by Supabase client; server cookies will update via middleware on next request.
        console.debug("Session token refreshed automatically.");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <AuthContext.Provider value={{ isActive, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
