"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MandatoryProfileGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function checkProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("bank_name, account_number, account_name, full_name, phone, role")
          .eq("id", user.id)
          .single();

        if (data && data.role === "investor") {
          const isComplete = Boolean(
            data.bank_name && 
            data.account_number && 
            data.account_name &&
            data.full_name &&
            data.phone
          );
          
          if (mounted) {
            setComplete(isComplete);
            if (!isComplete && pathname !== "/investor/settings") {
              // Force replace so they can't 'back' out of it
              router.replace("/investor/settings?guard=true");
            }
          }
        }
      } catch (err) {
        console.error("Profile check error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkProfile();

    return () => { mounted = false; };
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Prevent rendering underlying protected pages if incomplete
  if (!complete && pathname !== "/investor/settings") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
