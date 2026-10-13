"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage({ type: "error", text: error.message });
      else setMessage({ type: "success", text: "Check your email to confirm your account!" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: "error", text: error.message });
      else window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StockLedger</h1>
          <p className="text-gray-500 mt-1">Invoices. Payments. Stronger Business.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isSignUp ? "Create your account" : "Welcome back! 👋"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isSignUp ? "Start managing your business for free." : "Sign in to your StockLedger account."}
          </p>

          {message && (
            <div className={`p-3 rounded-xl text-sm mb-4 ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors duration-200"
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium block w-full"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up free"}
            </button>

            <div className="pt-3 border-t border-gray-100">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full text-xs font-semibold text-gray-700 hover:text-blue-700 bg-gray-50 hover:bg-blue-50 py-2.5 px-4 rounded-xl border border-gray-200 transition-all"
              >
                👀 Instant Preview: Explore Demo Dashboard →
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Built for wholesalers & growing businesses worldwide 🌍
        </p>
      </div>
    </div>
  );
}
