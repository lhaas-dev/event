import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const GARAGE_IMAGE = "https://customer-assets.emergentagent.com/job_guest-placer/artifacts/zak3shqd_GARAGE%202025klein.jpg";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Willkommen!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Anmeldung fehlgeschlagen';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left: Form */}
      <div className="w-full md:w-2/5 flex items-center justify-center bg-white p-8 md:p-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Logo */}
          <div className="mb-10">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16M14 4v16" />
              </svg>
            </div>
            <h1 className="text-4xl font-serif text-foreground">Tischplanung</h1>
            <p className="text-muted-foreground text-sm mt-1">Bitte melden Sie sich an</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                Benutzername
              </label>
              <input
                data-testid="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Benutzername eingeben"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                Passwort
              </label>
              <input
                data-testid="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                autoComplete="current-password"
              />
            </div>
            <button
              data-testid="submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-8">
            Kein Zugang? Bitte wenden Sie sich an Ihren Administrator.
          </p>
        </div>
      </div>

      {/* Right: Company Image */}
      <div className="hidden md:flex md:w-3/5 relative overflow-hidden">
        <img
          src={GARAGE_IMAGE}
          alt="Künzler & Sauber AG"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/10" />
        <div className="relative z-10 flex items-end p-14">
          <div>
            <h2 className="text-5xl font-serif text-white leading-tight mb-3">
              Ihr Event.<br />
              <span className="italic font-normal">Perfekt geplant.</span>
            </h2>
            <p className="text-white/75 text-base">
              Gäste verwalten · Tische planen · PDF exportieren
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
