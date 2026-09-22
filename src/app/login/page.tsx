"use client";

import { FormEvent, useState } from "react";
import { Mail, Lock, Eye, EyeOff, TrendingUp, ShieldCheck, RefreshCw, BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";

const FEATURES = [
  { icon: RefreshCw, titleKey: "login.feature1.title", descKey: "login.feature1.desc" },
  { icon: BarChart3, titleKey: "login.feature2.title", descKey: "login.feature2.desc" },
  { icon: ShieldCheck, titleKey: "login.feature3.title", descKey: "login.feature3.desc" },
];

function LanguageSwitch() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center rounded-full border border-white/25 bg-white/10 p-0.5 text-xs font-semibold backdrop-blur-sm">
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            lang === l ? "bg-white text-emerald-700" : "text-white/80 hover:text-white"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function LanguageSwitchLight() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center rounded-full border border-zinc-200 bg-white p-0.5 text-xs font-semibold shadow-sm">
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            lang === l ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-5">
      {/* Brand panel -- hidden on mobile, gives the page somewhere to breathe instead of
          a lone card floating on flat gray. */}
      <div className="relative hidden overflow-hidden bg-emerald-700 lg:col-span-2 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.18) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.14) 0%, transparent 40%)",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-emerald-900/40 blur-3xl" />

        <div className="relative flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark-white.png" alt="RVE" className="h-8 w-auto shrink-0" />
            <div className="leading-tight text-white">
              <p className="text-lg font-bold tracking-tight">Finance</p>
              <p className="text-[10px] font-medium tracking-wide text-emerald-100">{t("common.accountingSystemInternal")}</p>
            </div>
          </div>
          <LanguageSwitch />
        </div>

        <div className="relative">
          <div className="mb-8 flex items-center gap-2 text-emerald-50">
            <TrendingUp className="h-5 w-5" />
            <p className="text-2xl font-semibold leading-snug">{t("login.tagline")}</p>
          </div>
          <div className="space-y-5">
            {FEATURES.map((f) => (
              <div key={f.titleKey} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t(f.titleKey)}</p>
                  <p className="text-xs text-emerald-100/90">{t(f.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-emerald-100/70">{t("login.companyName")}</p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 lg:col-span-3">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex justify-end lg:hidden">
            <LanguageSwitchLight />
          </div>
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="RVE" className="h-10 w-auto" />
            <div className="text-center leading-tight">
              <p className="text-xl font-bold tracking-tight text-zinc-900">Finance</p>
              <p className="text-xs font-medium tracking-wide text-zinc-400">{t("common.accountingSystemInternal")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">{t("login.welcome")}</h1>
              <p className="text-sm text-zinc-500">{t("login.subtitle")}</p>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">{t("login.email")}</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  required
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">{t("login.password")}</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? t("login.submitting") : t("login.submit")}
            </button>

            <p className="pt-1 text-center text-xs text-zinc-400">{t("login.noAccount")}</p>
          </form>
        </div>
      </div>
    </div>
  );
}
