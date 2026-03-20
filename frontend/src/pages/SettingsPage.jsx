import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Server, Check, Eye, EyeOff, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Email settings
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [useTls, setUseTls] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api.emailSettings.get()
      .then(res => {
        if (res.data) {
          setSmtpHost(res.data.smtp_host || '');
          setSmtpPort(res.data.smtp_port?.toString() || '587');
          setSmtpUser(res.data.smtp_user || '');
          setSmtpPassword(res.data.smtp_password || '');
          setSmtpFromEmail(res.data.smtp_from_email || '');
          setSmtpFromName(res.data.smtp_from_name || '');
          setUseTls(res.data.use_tls !== false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!smtpHost.trim()) { toast.error('Bitte SMTP-Server eingeben'); return; }
    if (!smtpUser.trim()) { toast.error('Bitte Benutzername eingeben'); return; }
    if (!smtpFromEmail.trim()) { toast.error('Bitte Absender-E-Mail eingeben'); return; }
    
    setSaving(true);
    try {
      await api.emailSettings.save({
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(smtpPort) || 587,
        smtp_user: smtpUser.trim(),
        smtp_password: smtpPassword,
        smtp_from_email: smtpFromEmail.trim(),
        smtp_from_name: smtpFromName.trim(),
        use_tls: useTls,
      });
      toast.success('E-Mail-Einstellungen gespeichert');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground font-serif text-lg animate-pulse">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="settings-page">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-xl">Einstellungen</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/admin" className="text-sm text-primary hover:underline">Admin-Panel</Link>
          )}
          <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-muted-foreground hover:text-foreground">Abmelden</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Email Settings */}
        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl">E-Mail-Server</h2>
              <p className="text-sm text-muted-foreground">SMTP-Einstellungen für den E-Mail-Versand</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* SMTP Host & Port */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground block mb-1.5">SMTP-Server *</label>
                <div className="relative">
                  <Server className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    data-testid="smtp-host-input"
                    type="text"
                    value={smtpHost}
                    onChange={e => setSmtpHost(e.target.value)}
                    placeholder="smtp.example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Port</label>
                <input
                  data-testid="smtp-port-input"
                  type="number"
                  value={smtpPort}
                  onChange={e => setSmtpPort(e.target.value)}
                  placeholder="587"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Benutzername *</label>
                <input
                  data-testid="smtp-user-input"
                  type="text"
                  value={smtpUser}
                  onChange={e => setSmtpUser(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Passwort</label>
                <div className="relative">
                  <input
                    data-testid="smtp-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={smtpPassword}
                    onChange={e => setSmtpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 pr-11 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* From Email & Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Absender-E-Mail *</label>
                <input
                  data-testid="smtp-from-email-input"
                  type="email"
                  value={smtpFromEmail}
                  onChange={e => setSmtpFromEmail(e.target.value)}
                  placeholder="noreply@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Absender-Name</label>
                <input
                  data-testid="smtp-from-name-input"
                  type="text"
                  value={smtpFromName}
                  onChange={e => setSmtpFromName(e.target.value)}
                  placeholder="Mein Event"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* TLS */}
            <div className="flex items-center gap-3 py-2">
              <input
                data-testid="smtp-tls-checkbox"
                type="checkbox"
                id="use-tls"
                checked={useTls}
                onChange={e => setUseTls(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="use-tls" className="text-sm text-foreground cursor-pointer">
                TLS/STARTTLS verwenden (empfohlen)
              </label>
            </div>

            {/* Save Button */}
            <button
              data-testid="save-email-settings-btn"
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-2">Hilfe</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Gmail:</strong> smtp.gmail.com, Port 587, TLS aktiviert. App-Passwort erforderlich.</p>
              <p><strong>Office 365:</strong> smtp.office365.com, Port 587, TLS aktiviert.</p>
              <p><strong>Standard SMTP:</strong> Fragen Sie Ihren E-Mail-Anbieter nach den Einstellungen.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
