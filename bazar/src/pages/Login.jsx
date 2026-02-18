import { useState } from "react";
import { supabase } from "../lib/supabase";
import az from "../i18n/az";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) setMsg("Giriş zamanı xəta baş verdi");
    else setMsg("Uğurla daxil oldunuz ✅");

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {az.app.name}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Məhsulları və gündəlik alış–satışı idarə etmək üçün daxil olun
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  E-poçt
                </label>
                <input
                  className="mt-2 w-full rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="siz@email.com"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Şifrə
                </label>
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold py-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Daxil olunur..." : "Daxil ol"}
              </button>

              {/* Message */}
              {msg && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm border ${
                    msg.includes("Uğurla")
                      ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-200 border-rose-500/20"
                  }`}
                >
                  {msg}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-slate-400">
            Məsləhət: Hazırda tək istifadəçi üçündür. Sonradan rollar əlavə
            edilə bilər.
          </div>
        </div>
      </div>
    </div>
  );
}
