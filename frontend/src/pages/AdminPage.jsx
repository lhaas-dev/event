import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/api';
import { toast } from 'sonner';
import { Users, Trash2, Plus, LogOut, Layout, KeyRound, Shield, ArrowLeft } from 'lucide-react';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creating, setCreating] = useState(false);

  // Reset password
  const [resetUserId, setResetUserId] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.admin.users.list();
      setUsers(res.data);
    } catch {
      toast.error('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) { toast.error('Benutzername und Passwort erforderlich'); return; }
    setCreating(true);
    try {
      const res = await api.admin.users.create({ username: newUsername.trim(), password: newPassword, role: newRole });
      setUsers(prev => [...prev, res.data]);
      setNewUsername(''); setNewPassword(''); setNewRole('user');
      toast.success(`Benutzer "${newUsername}" erstellt`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Fehler beim Erstellen');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Benutzer "${username}" wirklich löschen?`)) return;
    try {
      await api.admin.users.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Benutzer gelöscht');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Fehler beim Löschen');
    }
  };

  const handleResetPassword = async (userId) => {
    if (!resetPw.trim() || resetPw.length < 4) { toast.error('Passwort muss mindestens 4 Zeichen haben'); return; }
    setResetting(true);
    try {
      await api.admin.users.updatePassword(userId, { password: resetPw });
      setResetUserId(null); setResetPw('');
      toast.success('Passwort geändert');
    } catch {
      toast.error('Fehler beim Ändern');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="admin-page">
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Layout className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif text-xl">Tischplanung</span>
          <span className="bg-accent/20 text-accent text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3" /> Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="text-sm text-muted-foreground">{user?.username}</span>
          <button onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-serif text-foreground">Benutzerverwaltung</h1>
          <p className="text-muted-foreground text-sm mt-1">Benutzer erstellen, löschen und Passwörter verwalten</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-5">Neuen Benutzer erstellen</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Benutzername</label>
                <input
                  data-testid="new-username-input"
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="z.B. maria.m"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Passwort</label>
                <input
                  data-testid="new-password-input"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mindestens 4 Zeichen"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1.5">Rolle</label>
                <select
                  data-testid="new-role-select"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="user">Benutzer (Vollzugriff)</option>
                  <option value="visitor">Besucher (Nur Ansicht)</option>
                  <option value="admin">Administrator</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Besucher können nur ihren Tisch finden und das Menü sehen.
                </p>
              </div>
              <button
                data-testid="create-user-btn"
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {creating ? 'Erstellen...' : 'Benutzer erstellen'}
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-serif text-lg">
                  Benutzer
                  <span className="ml-2 text-sm font-sans font-normal text-muted-foreground">({users.length})</span>
                </h2>
              </div>

              {loading ? (
                <div className="p-10 text-center text-muted-foreground">Laden...</div>
              ) : users.length === 0 ? (
                <div className="p-10 text-center"><Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Keine Benutzer gefunden</p></div>
              ) : (
                <div className="divide-y divide-border">
                  {users.map(u => (
                    <div key={u.id} data-testid={`user-row-${u.id}`} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${u.role === 'admin' ? 'bg-accent' : 'bg-primary'}`}>
                            {u.username[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{u.username}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                u.role === 'admin' ? 'bg-accent/15 text-accent' : 
                                u.role === 'visitor' ? 'bg-blue-100 text-blue-700' : 
                                'bg-secondary text-muted-foreground'
                              }`}>
                                {u.role === 'admin' ? 'Admin' : u.role === 'visitor' ? 'Besucher' : 'Benutzer'}
                              </span>
                              {u.username === user?.username && (
                                <span className="text-[10px] text-muted-foreground">(Sie)</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Erstellt: {u.created_at ? new Date(u.created_at).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            data-testid={`reset-pw-btn-${u.id}`}
                            onClick={() => { setResetUserId(resetUserId === u.id ? null : u.id); setResetPw(''); }}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Passwort ändern"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          {u.username !== user?.username && (
                            <button
                              data-testid={`delete-user-btn-${u.id}`}
                              onClick={() => handleDelete(u.id, u.username)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Inline password reset */}
                      {resetUserId === u.id && (
                        <div className="mt-3 flex gap-2" data-testid={`reset-pw-form-${u.id}`}>
                          <input
                            type="password"
                            value={resetPw}
                            onChange={e => setResetPw(e.target.value)}
                            placeholder="Neues Passwort"
                            className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            onClick={() => handleResetPassword(u.id)}
                            disabled={resetting}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                          >
                            {resetting ? '...' : 'Speichern'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
