"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/Supabase/browser-client";
import { useRouter } from "next/navigation";
import { validatePasswordStrength, validateEmail, mapAuthError, mapSignupError } from "@/lib/security/passwordValidation";
import { isRateLimited, getRemainingRequests } from "@/lib/security/rateLimit";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(0);
  const router = useRouter();

  // Get client IP for rate limiting (simplified - in production use proper IP detection)
  const getClientKey = () => {
    return `auth-${email.toLowerCase()}`;
  };

  const handleSignup = async () => {
    setLoading(true);
    setErrorMessage("");

    // Rate limiting check
    const clientKey = getClientKey();
    if (isRateLimited(clientKey, 'auth')) {
      const remaining = getRemainingRequests(clientKey, 'auth');
      setErrorMessage(`Too many attempts. Please try again later.`);
      setLoading(false);
      return;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.error || "Invalid email");
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      setErrorMessage(passwordValidation.error || "Password too weak");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(mapSignupError(error.message));
        return;
      }

      if (data.user) {
        const { error: insertError } = await supabase.from("users").upsert(
          {
            id: data.user.id,
            email: data.user.email,
            username: email.split("@")[0],
          },
          { onConflict: "id" }
        );

        if (insertError) {
          setErrorMessage(mapSignupError(insertError.message));
          return;
        }

        router.push("/");
      }
    } finally {
      setLoading(false);
      setLastAttempt(Date.now());
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage("");

    // Rate limiting check
    const clientKey = getClientKey();
    if (isRateLimited(clientKey, 'auth')) {
      setErrorMessage("Too many attempts. Please try again later.");
      setLoading(false);
      return;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.error || "Invalid email");
      setLoading(false);
      return;
    }

    // Validate password is not empty
    if (!password) {
      setErrorMessage("Password is required");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(mapAuthError(error.message));
        return;
      }

      router.push("/");
    } finally {
      setLoading(false);
      setLastAttempt(Date.now());
    }
  };

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Login / Signup</h1>

        {errorMessage && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full border border-slate-200 p-2 rounded"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border border-slate-200 p-2 rounded"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          disabled={loading}
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-60"
        >
          Sign Up
        </button>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded disabled:opacity-60"
        >
          Login
        </button>
      </div>
    </main>
  );
}

