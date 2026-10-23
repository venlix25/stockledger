"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Consent checkboxes — separate and unchecked by default
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentPayment, setConsentPayment] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Please enter your email address." });
      return;
    }

    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Password reset link sent! Check your email inbox (and spam folder).",
      });
    }
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isSignUp && (!consentTerms || !consentPrivacy || !consentPayment)) {
      setMessage({
        type: "error",
        text: "Please accept all three required legal agreements to create your account.",
      });
      setLoading(false);
      return;
    }

    const supabase = createClient();

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (data?.session) {
        // Record consent server-side
        try {
          await fetch("/api/auth/policy-acceptance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              termsAccepted: consentTerms,
              privacyAccepted: consentPrivacy,
              paymentAccepted: consentPayment,
              version: "1.0",
            }),
          });
        } catch {
          /* non-blocking */
        }
        window.location.href = "/dashboard";
      } else {
        setMessage({
          type: "success",
          text: "Account created! Check your email to confirm your account, then sign in.",
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        window.location.href = "/dashboard";
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4 shadow-blue-200">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StockLedger</h1>
          <p className="text-gray-500 mt-1">Invoices. Payments. Stronger Business.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {isForgotPassword ? (
            <div>
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 mb-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email address and we will send you a password recovery link.
              </p>

              {message && (
                <div
                  className={`p-3 rounded-xl text-sm mb-4 ${
                    message.type === "error"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field pl-10"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  {loading ? "Sending..." : "Send Password Reset Link"}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isSignUp ? "Create your account" : "Welcome back! 👋"}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {isSignUp
                  ? "Start managing your business invoices and customer balances."
                  : "Sign in to your StockLedger workspace."}
              </p>

              {message && (
                <div
                  className={`p-3 rounded-xl text-sm mb-4 ${
                    message.type === "error"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field pl-10"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setMessage(null);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Consent checkboxes — separate and unchecked for registration */}
                {isSignUp && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentTerms}
                        onChange={(e) => setConsentTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 flex-shrink-0"
                      />
                      <span className="text-xs text-gray-600 leading-relaxed">
                        I agree to the{" "}
                        <Link
                          href="/legal/terms"
                          target="_blank"
                          className="text-blue-600 underline font-semibold"
                        >
                          Terms of Service
                        </Link>
                        .
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentPrivacy}
                        onChange={(e) => setConsentPrivacy(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 flex-shrink-0"
                      />
                      <span className="text-xs text-gray-600 leading-relaxed">
                        I acknowledge that I have read the{" "}
                        <Link
                          href="/legal/privacy"
                          target="_blank"
                          className="text-blue-600 underline font-semibold"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentPayment}
                        onChange={(e) => setConsentPayment(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 flex-shrink-0"
                      />
                      <span className="text-xs text-gray-600 leading-relaxed">
                        I acknowledge the{" "}
                        <Link
                          href="/legal/payment-policy"
                          target="_blank"
                          className="text-blue-600 underline font-semibold"
                        >
                          Subscription and Payment Policy
                        </Link>
                        , including billing, manual renewal, cancellation, and{" "}
                        <Link
                          href="/legal/refund"
                          target="_blank"
                          className="text-blue-600 underline font-semibold"
                        >
                          expiry/refund terms
                        </Link>
                        .
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors duration-200 mt-2"
                >
                  {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage(null);
                    setConsentTerms(false);
                    setConsentPrivacy(false);
                    setConsentPayment(false);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium block w-full"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up free"}
                </button>

                <div className="pt-3 border-t border-gray-100">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 w-full text-xs font-semibold text-gray-700 hover:text-blue-700 bg-gray-50 hover:bg-blue-50 py-2.5 px-4 rounded-xl border border-gray-200 transition-all"
                  >
                    👀 Instant Preview: Explore Demo Dashboard →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-500 font-medium">
            <Link href="/legal/terms" className="hover:text-gray-800">
              Terms
            </Link>
            <span>·</span>
            <Link href="/legal/privacy" className="hover:text-gray-800">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/legal/payment-policy" className="hover:text-gray-800">
              Payment Policy
            </Link>
            <span>·</span>
            <Link href="/legal/refund" className="hover:text-gray-800">
              Refunds
            </Link>
            <span>·</span>
            <Link href="/legal/security" className="hover:text-gray-800">
              Security
            </Link>
            <span>·</span>
            <a
              href="https://t.me/Venlix25"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-bold"
            >
              Contact Support
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            StockLedger — Invoice and payment tracking platform for wholesalers &amp; growing businesses 🌍
          </p>
        </div>
      </div>
    </div>
  );
}
