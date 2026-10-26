import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Auth, User } from "firebase/auth";
import { getRoleForEmail, type AppRole } from "@/lib/authorized-users";
import { Icon } from "@/components/erp/icon";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configError: string | null;
  accessDenied: boolean;
  role: AppRole | null;
  clearAccessDenied: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void import("@/lib/firebase")
      .then(async (firebase) => {
        if (!active) return;
        if (firebase.firebaseConfigError || !firebase.auth) {
          setConfigError(firebase.firebaseConfigError ?? "Firebase Authentication is unavailable.");
          setLoading(false);
          return;
        }

        const authSdk = await import("firebase/auth");
        if (!active) return;
        setAuth(firebase.auth);
        unsubscribe = authSdk.onAuthStateChanged(firebase.auth, (nextUser) => {
          if (nextUser && !getRoleForEmail(nextUser.email)) {
            setUser(null);
            setAccessDenied(true);
            void authSdk.signOut(firebase.auth);
          } else {
            setUser(nextUser);
            if (nextUser) setAccessDenied(false);
          }
          setLoading(false);
        });
      })
      .catch(() => {
        if (!active) return;
        setConfigError("Firebase could not initialize. Check project configuration and network access.");
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    configError,
    accessDenied,
    role: getRoleForEmail(user?.email),
    clearAccessDenied: () => setAccessDenied(false),
    signIn: async (email, password) => {
      if (!auth) throw new Error("Firebase Authentication is not ready.");
      if (!getRoleForEmail(email)) throw new Error("This email is not authorized to access the app.");
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, email, password);
    },
    sendPasswordReset: async (email) => {
      if (!auth) throw new Error("Firebase Authentication is not ready.");
      if (!getRoleForEmail(email)) throw new Error("This email is not authorized to access the app.");
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth, email);
    },
    signOut: async () => {
      if (!auth) return;
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <AuthStatus /> : user ? children : accessDenied ? <AccessDenied /> : <SignIn />}
    </AuthContext.Provider>
  );
}

function AuthStatus() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-on-surface">
      <p role="status" className="text-sm text-on-surface-variant">Connecting securely...</p>
    </main>
  );
}

function AccessDenied() {
  const { clearAccessDenied } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-on-surface">
      <section className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-primary">Access not authorized</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          This account is not on the approved staff access list. Contact an administrator if you need access.
        </p>
        <button
          className="mt-6 rounded-lg bg-primary px-4 py-2.5 font-semibold text-on-primary hover:bg-primary-container"
          onClick={clearAccessDenied}
          type="button"
        >
          Return to sign in
        </button>
      </section>
    </main>
  );
}

function SignIn() {
  const { clearAccessDenied, configError, sendPasswordReset, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearAccessDenied();
    setError(null);
    setResetMessage(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      setError("Sign-in failed. Check your email and password, then try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setError(null);
    setResetMessage(null);
    const accountEmail = email.trim();
    if (!accountEmail) {
      setError("Enter your account email address first, then select Forgot password.");
      return;
    }
    if (!getRoleForEmail(accountEmail)) {
      setError("Password reset is available only for approved staff accounts.");
      return;
    }

    setSendingReset(true);
    try {
      await sendPasswordReset(accountEmail);
      setResetMessage(
        "If an account exists for that address, Firebase has sent a password reset link. Check your inbox and spam folder.",
      );
    } catch {
      setError("We couldn't send a reset email. Check the address and try again.");
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-on-surface">
      <section className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">My Grandma's Kitchen</p>
          <h1 className="mt-2 text-2xl font-bold text-primary">Sign in</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Use one of the four approved staff accounts to continue.
          </p>
        </div>

        {configError ? (
          <p role="alert" className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">
            {configError}
          </p>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Email address
              <input
                autoComplete="username"
                className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-primary"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setResetMessage(null);
                }}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Password
              <span className="relative block">
                <input
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 pr-12 pl-3 text-base outline-none focus:ring-2 focus:ring-primary"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => setShowPassword((visible) => !visible)}
                  title={showPassword ? "Hide password" : "Show password"}
                  type="button"
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px]" />
                </button>
              </span>
            </label>
            <div className="-mt-2 flex justify-end">
              <button
                className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60"
                disabled={submitting || sendingReset}
                onClick={() => void handlePasswordReset()}
                type="button"
              >
                {sendingReset ? "Sending reset link..." : "Forgot password?"}
              </button>
            </div>
            {resetMessage && (
              <p role="status" className="rounded-lg bg-muted p-3 text-sm text-on-surface-variant">
                {resetMessage}
              </p>
            )}
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <button
              className="mt-1 rounded-lg bg-primary px-4 py-3 font-semibold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}