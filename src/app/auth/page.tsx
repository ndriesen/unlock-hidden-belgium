"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, MapPin, Bookmark, ArrowRight, Check, Mail, Lock } from "lucide-react";
import { supabase } from "@/lib/Supabase/browser-client";
import type { UserProfile } from '@/types/user';
import { useAuth } from "@/context/AuthContext";
import { validatePasswordStrength, validateEmail, mapAuthError, mapSignupError } from "@/lib/security/passwordValidation";
import { isRateLimited } from "@/lib/security/rateLimit";
import LoginSlideshow from "@/components/auth/LoginSlideshow";
import GlobeHero from "@/components/discovery/GlobeHero";
import OnboardingWizard from "@/components/auth/OnboardingWizard";

type SignupStep = "account" | "success";

export default function AuthPage() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [signupStep, setSignupStep] = useState<SignupStep>("account");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  // Auth form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const getClientKey = () => `auth-${email.toLowerCase()}`;

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.push("/hotspots");
    }
  }, [session, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(mapAuthError(error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage("");

    const clientKey = getClientKey();
    if (isRateLimited(clientKey, 'auth')) {
      setErrorMessage("Too many attempts. Please try again later.");
      setLoading(false);
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.error || "Invalid email");
      setLoading(false);
      return;
    }

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

      router.push("/hotspots");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSignup = async () => {
    const clientKey = getClientKey();
    if (isRateLimited(clientKey, 'auth')) {
      setErrorMessage("Too many attempts. Please try again later.");
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMessage(emailValidation.error || "Invalid email");
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      setErrorMessage(passwordValidation.error || "Password too weak");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    setErrorMessage('');

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
        // Create defaults
        await supabase.from("lists").insert({
          user_id: data.user.id,
          name: "My Favorites",
          description: "My favorite hidden gems",
          visibility: "private",
          is_default: true,
        });

        await supabase.from("user_settings").insert({
          user_id: data.user.id,
          allow_location: false,
          allow_notifications: false,
        });

        // Trigger onboarding
        await supabase.from("users").update({
          onboarding_completed: false,
        }).eq("id", data.user.id);

        setShowOnboardingWizard(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (data: Pick<UserProfile, 'interests' | 'exploration_style' | 'city'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("users").update({
      interests: data.interests,
      exploration_style: data.exploration_style,
      city: data.city,
      onboarding_completed: true,
    }).eq("id", user.id);

    router.push("/hotspots");
  };

  const handleOnboardingSkip = async () => {
    router.push("/hotspots");
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Globe Hero */}
      {!showOnboardingWizard && signupStep !== "success" && (
        <div className="w-full md:w-1/2 h-[40vh] md:h-screen relative overflow-hidden">
          <LoginSlideshow />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:hidden bg-gradient-to-t from-black/60 to-transparent">
            <h1 className="text-2xl font-bold text-white mb-2">
              Discover hidden places
            </h1>
            <p className="text-white/80 text-sm">
              Explore places locals love and travelers rarely find.
            </p>
          </div>
        </div>
      )}

      {/* Right Side - Auth Card */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md">
          {signupStep === "success" ? (
            <SuccessView />
          ) : showOnboardingWizard ? (
            <OnboardingWizard
              userId=""
              onComplete={handleOnboardingComplete}
              onSkip={handleOnboardingSkip}
            />
          ) : (
            <>
              <div className="hidden md:block mb-8">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <Compass className="w-5 h-5" />
                  <span className="text-sm font-medium">Unlock Hidden Belgium</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {activeTab === "login" ? "Welcome back" : "Start your journey"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  {activeTab === "login" 
                    ? "Continue your exploration of hidden gems"
                    : "Discover places locals love and travelers rarely find"
                  }
                </p>
              </div>

              <div className="md:hidden mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {activeTab === "login" ? "Welcome back" : "Create account"}
                </h1>
              </div>

              <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${activeTab === "login" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab("signup")}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${activeTab === "signup" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                >
                  Sign Up
                </button>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {activeTab === "login" ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <LoginForm
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      rememberMe={rememberMe}
                      setRememberMe={setRememberMe}
                      loading={loading}
                      onLogin={handleLogin}
                      onGoogleLogin={handleGoogleLogin}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <SignupForm
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      confirmPassword={confirmPassword}
                      setConfirmPassword={setConfirmPassword}
                      loading={loading}
                      onSignup={handleAccountSignup}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {activeTab === "signup" && !showOnboardingWizard && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                    What you'll get:
                  </p>
                  <div className="space-y-3">
                    {[{ icon: Bookmark, text: "Save your favorite hidden gems" },
                      { icon: MapPin, text: "Create custom travel collections" },
                      { icon: Compass, text: "Get personalized recommendations" }].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <benefit.icon className="w-4 h-4 text-emerald-600" />
                        </div>
                        {benefit.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// --- Components ---
function LoginForm({ email, setEmail, password, setPassword, rememberMe, setRememberMe, loading, onLogin, onGoogleLogin }: any) {
  return (
    <div className="space-y-4">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            autoComplete="email"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            autoComplete="new-password"
          />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
          </label>
          <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Forgot password?
          </a>
        </div>

      {/* Login button */}
      <button 
        onClick={onLogin} 
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? "Signing in..." : "Continue exploring"}
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* OR divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-slate-900 text-slate-500">or</span>
        </div>
      </div>

      {/* Google Login */}
      <button onClick={onGoogleLogin} disabled={loading} className="w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
        {/* Google icon SVG */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
    </div>
  );
}

function SignupForm({ email, setEmail, password, setPassword, confirmPassword, setConfirmPassword, loading, onSignup }: any) {
  return (
    <div className="space-y-4">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            autoComplete="email"
          />        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            autoComplete="new-password"
          />
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            autoComplete="new-password"
          />
        </div>
      </div>

      {/* Signup button */}
      <button
        onClick={onSignup}
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? "Creating account..." : "Create Account"}
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function SuccessView() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center py-12"
    >
      <Check className="mx-auto w-12 h-12 text-emerald-500 mb-4" />
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Created!</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        You're all set. Please check your email to verify your account.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-200"
      >
        Go to Login
      </button>
    </motion.div>
  );
}