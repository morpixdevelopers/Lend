import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Lock,
  User,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
} from "lucide-react";

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const email = `${username.toLowerCase().trim()}@lendtrack.com`;

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username } },
        });
        if (error) throw error;

        await supabase.auth.signOut();

        setMessage({
          type: "success",
          text: "Admin created! Please Sign In with your new credentials.",
        });
        setIsSignUp(false);
        setUsername("");
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: "error", text: "Invalid username or password." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Since we use fake emails, we notify the admin to contact support
    // or you can attempt a reset if you've configured a real SMTP
    const email = `${username.toLowerCase().trim()}@lendtrack.com`;
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: "User not found or system error." });
    } else {
      setMessage({
        type: "success",
        text: "If this admin exists, a reset request has been logged. Please contact the system owner.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight italic">
            LendTrack
          </h1>
          <p className="text-gray-400 mt-2 font-medium">
            {isForgotMode
              ? "Reset Credentials"
              : isSignUp
                ? "Create Admin Username"
                : "Admin Portal Access"}
          </p>
        </div>

        {isForgotMode ? (
          <form onSubmit={handleResetRequest} className="space-y-4">
            {message && (
              <div
                className={`p-4 rounded-xl text-sm font-bold ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/50" : "bg-red-500/10 text-red-400 border border-red-500/50"}`}
              >
                {message.text}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Admin Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:border-blue-500 outline-none transition-all"
                  placeholder="Your admin username"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Request Reset"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setMessage(null);
              }}
              className="w-full text-gray-500 text-xs font-bold hover:text-white transition-colors"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            {message && (
              <div
                className={`p-4 rounded-xl text-sm font-bold ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/50" : "bg-red-500/10 text-red-400 border border-red-500/50"}`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter admin username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setMessage(null);
                    }}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-tighter"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl py-3 pl-12 pr-12 text-white focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Register Admin" : "Sign In"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {!isForgotMode && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
              }}
              className="text-gray-500 text-xs font-bold hover:text-white uppercase tracking-tighter transition-colors"
            >
              {isSignUp
                ? "Already an admin? Sign In"
                : "Register new admin account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
