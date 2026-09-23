"use client";

import { FormEvent, useState } from "react";
import { Mail, Lock, Eye, EyeOff, TrendingUp, ShieldCheck, RefreshCw, BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const FEATURES = [
  { icon: RefreshCw, titleKey: "login.feature1.title", descKey: "login.feature1.desc" },
  { icon: BarChart3, titleKey: "login.feature2.title", descKey: "login.feature2.desc" },
  { icon: ShieldCheck, titleKey: "login.feature3.title", descKey: "login.feature3.desc" },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

// Google sign-in is parked for now -- flip back to true to show the button again (the
// backend /auth/google endpoint and Firebase wiring are still in place).
const SHOW_GOOGLE_LOGIN = false;

// Firebase error codes that just mean "the user closed/abandoned the popup" -- not worth
// showing as an error.
const GOOGLE_CANCEL_CODES = ["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"];

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
  const { login, loginWithGoogle } = useAuth();
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

  async function handleGoogle() {
    setSubmitting(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (!code || !GOOGLE_CANCEL_CODES.includes(code)) {
        setError(err instanceof Error ? err.message : t("login.errorGeneric"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-5">
      {/* Brand panel -- hidden on mobile, gives the page somewhere to breathe instead of
          a lone card floating on flat gray. */}
      <div className="on-brand relative hidden overflow-hidden bg-emerald-700 lg:col-span-2 lg:flex lg:flex-col lg:justify-between lg:p-10">
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
          <div className="flex items-center gap-2">
            <ThemeToggle variant="onBrand" />
            <LanguageSwitch />
          </div>
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
          <div className="mb-4 flex justify-end gap-2 lg:hidden">
            <ThemeToggle />
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

            {SHOW_GOOGLE_LOGIN && (
              <>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="h-px flex-1 bg-zinc-200" />
                  {t("login.or")}
                  <span className="h-px flex-1 bg-zinc-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60"
                >
                  <GoogleIcon />
                  {t("login.google")}
                </button>
              </>
            )}

            <p className="pt-1 text-center text-xs text-zinc-400">{t("login.noAccount")}</p>
          </form>
        </div>
      </div>
    </div>
  );
}
