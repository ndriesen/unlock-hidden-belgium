"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, MapPin, Compass, Check } from "lucide-react";
import { supabase } from "@/lib/Supabase/browser-client";
import { useRouter } from "next/navigation";
import { validatePasswordStrength, validateEmail, mapAuthError, mapSignupError } from "@/lib/security/passwordValidation";
import { isRateLimited, getRemainingRequests } from "@/lib/security/rateLimit";
import { useAuthModal } from "@/lib/hooks/useAuthModal";
import LoginSlideshow from "@/components/auth/LoginSlideshow";

const EXPLORER_TYPES = [
  { id: "nature", label: "Nature Explorer", icon: "🌲", description: "Parks, forests & outdoor adventures" },
  { id: "food", label: "Food Hunter", icon: "🍽️", description: "Local cuisine & hidden restaurants" },
  { id: "urban", label: "Urban Discoverer", icon: "🏙️", description: "City gems & street art" },
  { id: "hidden", label: "Hidden Gems Seeker", icon: "💎", description: "Off-the-beaten-path spots" },
  { id: "nightlife", label: "Nightlife Explorer", icon: "🌙", description: "Bars & evening hotspots" },
];

const TRAVEL_STYLES = [
  { id: "weekend", label: "Weekend Trips", icon: "📅" },
  { id: "road", label: "Road Trips", icon: "🚗" },
  { id: "city", label: "City Hopping", icon: "🏙️" },
  { id: "backpacking", label: "Backpacking", icon: "🎒" },
  { id: "luxury", label: "Luxury Travel", icon: "✨" },
];

type SignupStep = "account" | "explorer" | "preferences" | "success";

export default function AuthModal() {
  const { isOpen, initialView, closeModal } = useAuthModal();
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialView || "signup");
  const [signupStep, setSignupStep] = useState<SignupStep>("account");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // Onboarding data
  const [selectedExplorers, setSelectedExplorers] = useState<string[]>([]);
  const [homeCity, setHomeCity] = useState("");
  const [country, setCountry] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  
  const router = useRouter();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialView);
      setSignupStep("account");
      setErrorMessage("");
    }
  }, [isOpen, initialView]);

  const getClientKey = () => `auth-${email.toLowerCase()}`;

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
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage(mapAuthError(error.message));
        return;
      }

      // Alleen closeModal nodig
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (signupStep === "account") {
      // Validate account step
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

      setSignupStep("explorer");
      setErrorMessage("");
      return;
    }

    if (signupStep === "explorer") {
      if (selectedExplorers.length === 0) {
        setErrorMessage("Please select at least one explorer type");
        return;
      }
      setSignupStep("preferences");
      setErrorMessage("");
      return;
    }

    if (signupStep === "preferences") {
      // Complete signup
      setLoading(true);
      setErrorMessage("");

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
          // Update user profile with preferences
          await supabase.from("users").update({
            interests: selectedExplorers,
            city: homeCity,
            country: country,
            travel_style: travelStyle || "balanced",
          }).eq("id", data.user.id);

          // Create default list
          await supabase.from("lists").insert({
            user_id: data.user.id,
            name: "My Favorites",
            description: "My favorite hidden gems",
            visibility: "private",
            is_default: true,
          });

          // Create user settings
          await supabase.from("user_settings").insert({
            user_id: data.user.id,
            allow_location: false,
            allow_notifications: false,
          });

          // Record activity
          await supabase.from("user_activity").insert({
            user_id: data.user.id,
            action_type: "create_list",
            entity_type: "list",
          });

          setSignupStep("success");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSkipOnboarding = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    setErrorMessage("");

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
        // Create default list
        await supabase.from("lists").insert({
          user_id: data.user.id,
          name: "My Favorites",
          description: "My favorite hidden gems",
          visibility: "private",
          is_default: true,
        });

        // Create user settings
        await supabase.from("user_settings").insert({
          user_id: data.user.id,
          allow_location: false,
          allow_notifications: false,
        });
        
        setSignupStep("success");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExplorer = (id: string) => {
    setSelectedExplorers(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : prev.length < 3 
          ? [...prev, id]
          : prev
    );
  };

  const getProgressWidth = () => {
    switch (signupStep) {
      case "account": return "25%";
      case "explorer": return "50%";
      case "preferences": return "75%";
      case "success": return "100%";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={closeModal}
          />

          {/* Modal */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: "spring", duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div className="relative w-full max-w-md bg-transparent backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              {signupStep === "success" ? (
                <SuccessView onClose={closeModal} />
              ) : activeTab === "login" ? (
                <LoginView
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  rememberMe={rememberMe}
                  setRememberMe={setRememberMe}
                  loading={loading}
                  errorMessage={errorMessage}
                  onLogin={handleLogin}
                  onGoogleLogin={handleGoogleLogin}
                  onSwitchToSignup={() => setActiveTab("signup")}
                />
              ) : (
                <SignupView
                  signupStep={signupStep}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  selectedExplorers={selectedExplorers}
                  toggleExplorer={toggleExplorer}
                  homeCity={homeCity}
                  setHomeCity={setHomeCity}
                  country={country}
                  setCountry={setCountry}
                  travelStyle={travelStyle}
                  setTravelStyle={setTravelStyle}
                  loading={loading}
                  errorMessage={errorMessage}
                  onContinue={handleSignup}
                  onSkip={handleSkipOnboarding}
                  onSwitchToLogin={() => setActiveTab("login")}
                  getProgressWidth={getProgressWidth}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Login View Component
function LoginView({
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  loading,
  errorMessage,
  onLogin,
  onGoogleLogin,
  onSwitchToSignup,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  loading: boolean;
  errorMessage: string;
  onLogin: () => void;
  onGoogleLogin: () => void;
  onSwitchToSignup: () => void;
}) {
  return (
    <div className="p-8 relative bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl">
      {/* Header */}
      <LoginSlideshow />
      <div className="text-center mb-8 relative z-10 pt-4">
        <h2 className="text-3xl font-bold text-white drop-shadow-lg">Welcome back</h2>
        <p className="text-slate-200/90 dark:text-slate-400 mt-1 drop-shadow-md">Continue your exploration</p>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <button
          onClick={() => {}}
          className="flex-1 py-2 px-4 rounded-lg bg-white dark:bg-slate-700 shadow-sm font-medium text-slate-900 dark:text-white transition-all"
        >
          Login
        </button>
        <button
          onClick={onSwitchToSignup}
          className="flex-1 py-2 px-4 rounded-lg text-slate-500 dark:text-slate-400 font-medium transition-all hover:text-slate-700 dark:hover:text-slate-200"
        >
          Sign Up
        </button>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
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
              autoComplete="current-password"
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

        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Continue exploring"}
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-slate-900 text-slate-500">or</span>
        </div>
      </div>

      {/* Social Login */}
      <button
        onClick={onGoogleLogin}
        disabled={loading}
        className="w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
      >
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

// Signup View Component
function SignupView({
  signupStep,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  selectedExplorers,
  toggleExplorer,
  homeCity,
  setHomeCity,
  country,
  setCountry,
  travelStyle,
  setTravelStyle,
  loading,
  errorMessage,
  onContinue,
  onSkip,
  onSwitchToLogin,
  getProgressWidth,
}: {
  signupStep: "account" | "explorer" | "preferences";
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  selectedExplorers: string[];
  toggleExplorer: (id: string) => void;
  homeCity: string;
  setHomeCity: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  travelStyle: string;
  setTravelStyle: (v: string) => void;
  loading: boolean;
  errorMessage: string;
  onContinue: () => void;
  onSkip: () => void;
  onSwitchToLogin: () => void;
  getProgressWidth: () => string;
}) {
  return (
    <div className="p-8 relative bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl">      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: getProgressWidth() }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Account</span>
          <span>Explorer</span>
          <span>Preferences</span>
        </div>
      </div>

      {/* Header */}
      <LoginSlideshow />
      <div className="text-center mb-6 relative z-10 pt-4">
        <h2 className="text-3xl font-bold text-white drop-shadow-lg">
          {signupStep === "account" && "Create your account"}
          {signupStep === "explorer" && "What kind of explorer are you?"}
          {signupStep === "preferences" && "Tell us about yourself"}
        </h2>
        <p className="text-slate-200/90 mt-1 drop-shadow-md">
          {signupStep === "account" && "Start your journey to hidden gems"}
          {signupStep === "explorer" && "Select up to 3 types that match your style"}
          {signupStep === "preferences" && "Help us personalize your discovery"}
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Step Content */}
      {signupStep === "account" && (
        <div className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>
      )}

      {signupStep === "explorer" && (
        <div className="grid grid-cols-1 gap-3">
          {EXPLORER_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => toggleExplorer(type.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedExplorers.includes(type.id)
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"
              }`}
            >
              <span className="text-2xl">{type.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">{type.label}</p>
                <p className="text-sm text-slate-500">{type.description}</p>
              </div>
              {selectedExplorers.includes(type.id) && (
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {signupStep === "preferences" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <MapPin className="w-4 h-4 inline mr-1" />
              Home City
            </label>
            <input
              type="text"
              value={homeCity}
              onChange={(e) => setHomeCity(e.target.value)}
              placeholder="e.g., Brussels, Antwerp"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              <option value="">Select your country</option>
              <option value="be">Belgium</option>
              <option value="nl">Netherlands</option>
              <option value="fr">France</option>
              <option value="de">Germany</option>
              <option value="lu">Luxembourg</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">How do you like to travel?</label>
            <div className="grid grid-cols-2 gap-3">
              {TRAVEL_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setTravelStyle(style.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    travelStyle === style.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                  }`}
                >
                  <span className="text-xl">{style.icon}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <button
          onClick={onContinue}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : signupStep === "preferences" ? "Create Account" : "Continue"}
        </button>

        {signupStep === "preferences" && (
          <button
            onClick={onSkip}
            disabled={loading}
            className="w-full py-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors"
          >
            Skip for now
          </button>
        )}

        {signupStep === "account" && (
          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

// Success View Component
function SuccessView({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const router = useRouter();

  const handleGoToMap = () => {
      onClose();
      onSuccess?.();
    router.push("/hotspots");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-6"
      >
        <Check className="w-12 h-12 text-white" />
      </motion.div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        You're all set!
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Ready to discover hidden gems around the world?
      </p>

      <button
        onClick={handleGoToMap}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
      >
        Start Exploring
      </button>
    </motion.div>
  );
}

