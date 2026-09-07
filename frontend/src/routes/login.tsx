import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Building2,
  ArrowRight,
  Shield,
  HelpCircle,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, DEMO_ACCOUNTS, DemoAccount } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Secure Login — MPLADS Sentinel Portal | Govt of India" }],
  }),
  component: LoginPage,
});

function generateCaptcha(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function LoginPage() {
  const navigate = useNavigate();
  const { login, quickDemoLogin, isAuthenticated, isLoading } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState("K7X9P");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedDemo, setSelectedDemo] = useState<DemoAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCaptchaCode(generateCaptcha());
  }, []);

  // If already logged in, navigate to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
  };

  const handleSelectDemo = (acc: DemoAccount) => {
    setSelectedDemo(acc);
    setUsernameOrEmail(acc.email);
    setPassword(acc.password);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!usernameOrEmail.trim()) {
      setErrorMsg("Please enter your Government Email or Username.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }
    // Verify captcha only if entered or ensure it matches
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMsg("Invalid security captcha code. Please try again.");
      handleRefreshCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await login(usernameOrEmail.trim(), password);
      setSuccessMsg(`Welcome, ${loggedUser.name}! Initializing secure session...`);
      setTimeout(() => {
        navigate({ to: "/" });
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your details.");
      handleRefreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoSubmit = async (acc: DemoAccount) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const loggedUser = await quickDemoLogin(acc);
      setSuccessMsg(`Access Granted as ${acc.role_title} (${loggedUser.name})`);
      setTimeout(() => {
        navigate({ to: "/" });
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to switch demo account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-white">
      {/* Tricolour Header Band */}
      <div className="tricolour-rule h-1.5 w-full shadow-xs" />

      {/* Top Govt Bar */}
      <header className="border-b border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur shadow-xs lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-600 font-bold shadow-xs">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest text-amber-700 uppercase">भारत सरकार</span>
                <span className="text-xs text-slate-300">|</span>
                <span className="text-xs font-semibold tracking-wide text-slate-600">Government of India</span>
              </div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                Ministry of Statistics and Programme Implementation (MoSPI)
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-4 text-xs sm:flex">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-800 font-semibold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>NIC Gateway Secured (TLS 1.3)</span>
            </div>
            <div className="text-slate-600">
              Helpline: <span className="font-bold text-slate-900">1800-11-2026</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
            
            {/* Left Column: Portal Overview & Quick Demo Roles */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-panel lg:col-span-6 lg:p-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                  <Shield className="size-3.5 text-amber-600" />
                  <span>SANKALP • MPLADS Sentinel AI</span>
                </div>

                <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Intelligent Expenditure & Project Governance
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Comprehensive anti-fraud auditing, geospatial validation, and AI compliance sentinel for the Member of Parliament Local Area Development Scheme.
                </p>

                {/* Quick Role Access for Demo & Evaluation */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                      Quick Demo Role Switcher
                    </span>
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] text-amber-900 font-mono font-bold">
                      1-Click Access
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Select an official persona below to inspect role-tailored dashboards and permissions:
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isSelected = selectedDemo?.username === acc.username;
                      return (
                        <div
                          key={acc.username}
                          onClick={() => handleSelectDemo(acc)}
                          className={`group relative cursor-pointer rounded-xl border p-3 transition-all duration-200 ${
                            isSelected
                              ? "border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-500/40"
                              : "border-slate-200 bg-slate-50/70 hover:border-amber-400 hover:bg-amber-50/40 hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 font-mono text-xs font-bold text-amber-700 shadow-2xs">
                              {acc.avatar_initials}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="truncate text-xs font-bold text-slate-900">
                                  {acc.role_title}
                                </p>
                              </div>
                              <div className="mt-0.5 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                <span>→ {acc.assigned_scope}</span>
                              </div>
                              <p className="mt-1 truncate text-[11px] text-slate-700 font-medium">{acc.name}</p>
                              <p className="mt-0.5 truncate text-[10px] text-slate-500">{acc.jurisdiction}</p>
                            </div>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/70 pt-1.5 text-[11px]">
                            <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                              {acc.email}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickDemoSubmit(acc);
                              }}
                              disabled={submitting || isLoading}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline"
                            >
                              <span>Enter</span>
                              <ArrowRight className="size-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-amber-200/70 bg-amber-50/50 p-3.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>NIC Information Security Directive</span>
                </div>
                <p className="mt-1 leading-relaxed">
                  Access is monitored and audited. Authorized for official government and designated evaluation personnel only under the Information Technology Act, 2000.
                </p>
              </div>
            </div>

            {/* Right Column: Sign In Form */}
            <div className="flex flex-col justify-center rounded-2xl border border-slate-200/90 bg-white p-6 shadow-panel lg:col-span-6 lg:p-8">
              <div className="border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/15 text-amber-700 font-bold">
                    <Lock className="size-4" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Officer Authentication</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Sign in with your MoSPI / NIC SSO or nodal administrative credentials.
                </p>
              </div>

              {/* Status Notifications */}
              {errorMsg && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 font-medium">
                  <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Government Email or User ID
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder="e.g. district.authority@mplads.gov.in"
                      className="border-slate-300 bg-white pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameOrEmail("district.authority@mplads.gov.in");
                        setPassword("district123");
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline"
                    >
                      Autofill District Authority?
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="border-slate-300 bg-white pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Security Captcha (Govt Portal Requirement) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Security Verification (Captcha)
                  </label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="flex h-10 select-none items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 font-mono text-lg font-black tracking-widest text-slate-800 shadow-inner">
                      <span className="rotate-[-2deg] tracking-[0.25em] line-through decoration-amber-500/70">
                        {captchaCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshCaptcha}
                      className="flex size-10 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                      title="Refresh Captcha"
                    >
                      <RefreshCw className="size-4" />
                    </button>
                    <Input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 border-slate-300 bg-white text-xs uppercase tracking-wider text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium">Remember this terminal</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    NIC SSO Enabled
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="size-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <UserCheck className="size-4" />
                      <span>Secure Officer Sign In</span>
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
                <span>Direct portal inquiries to </span>
                <span className="text-slate-800 font-mono font-semibold">support-mplads@gov.in</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p>© 2026 Ministry of Statistics & Programme Implementation, Government of India. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="hover:text-slate-900 cursor-pointer">Security Policy</span>
            <span>•</span>
            <span className="hover:text-slate-900 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-900 cursor-pointer">Helpdesk</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

