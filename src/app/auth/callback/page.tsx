"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/Supabase/browser-client";

export default function AuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth callback error:", error);
        router.push("/?error=auth_error");
        return;
      }

      if (session) {
        // User is logged in - redirect to hotspots
        // The trigger will automatically create user records in the background
        router.push("/hotspots");
      } else {
        // No session - redirect to home
        router.push("/");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Completing login...</p>
      </div>
    </div>
  );
}

