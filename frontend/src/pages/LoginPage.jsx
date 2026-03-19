import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
        toast.success('Willkommen zurück!');
      } else {
        if (password.length < 4) {
          toast.error('Passwort muss mindestens 4 Zeichen haben');
          return;
        }
        await register(username, password);
        toast.success('Konto erstellt!');
      }
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
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16M14 4v16" />
              </svg>
            </div>
            <h1 className="text-4xl font-serif text-foreground">Tischplanung</h1>
            <p className="text-muted-foreground text-sm mt-1">Ihr Event. Perfekt geplant.</p>
          </div>

          {/* Toggle */}
          <div className="flex gap-1 mb-8 p-1 bg-secondary rounded-xl">
            <button
              data-testid="login-tab"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'login' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}
            >
              Anmelden
            </button>
            <button
              data-testid="register-tab"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'register' ? 'bg-white shadow text-foreground' : 'text-muted-foreground'}`}
            >
              Registrieren
            </button>
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
                placeholder="z.B. maria.schmidt"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                autoComplete="username"
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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            <button
              data-testid="submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Bitte warten...' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Image */}
      <div className="hidden md:flex md:w-3/5 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1692953687795-eaadf75091c1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwyfHx3ZWRkaW5nJTIwdGFibGUlMjBmbG93ZXJzJTIwYnJpZ2h0fGVufDB8fHx8MTc3MzkzNTQ3OXww&ixlib=rb-4.1.0&q=85"
          alt="Elegante Tischdekoration"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/10" />
        <div className="relative z-10 flex items-end p-14">
          <div>
            <h2 className="text-5xl font-serif text-white leading-tight mb-3">
              Ihr Event.<br />
              <span className="italic font-normal">Perfekt geplant.</span>
            </h2>
            <p className="text-white/70 text-base">
              Gäste verwalten, Tische planen, PDF exportieren.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
