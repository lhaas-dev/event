import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/api';
import { toast } from 'sonner';
import { Users, Settings, Calendar, Trash2, Plus, LogOut, Layout, Shield, Eye, Mail } from 'lucide-react';

function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="bg-white border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Layout className="w-4 h-4 text-white" />
        </div>
        <span className="font-serif text-xl text-foreground">Tischplanung</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.username}</span>
        <button
          data-testid="settings-link"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          title="E-Mail-Einstellungen"
        >
          <Mail className="w-4 h-4" />
        </button>
        {isAdmin && (
          <button
            data-testid="admin-link"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
        )}
        <button
          data-testid="logout-btn"
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>
    </header>
  );
}

function EventCard({ event, onDelete, onClick }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Event "${event.name}" wirklich löschen?`)) return;
    setDeleting(true);
    await onDelete(event.id);
    setDeleting(false);
  };

  const handleVisitorView = (e) => {
    e.stopPropagation();
    window.open(`/besucher/${event.id}`, '_blank');
  };

  return (
    <div
      data-testid={`event-card-${event.id}`}
      onClick={() => onClick(event.id)}
      className="bg-white border border-border rounded-2xl p-6 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all duration-300 group animate-fade-in-up"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            data-testid={`visitor-view-${event.id}`}
            onClick={handleVisitorView}
            title="Besucher-Ansicht"
            className="p-1.5 text-muted-foreground hover:text-blue-600 transition-all rounded-lg hover:bg-blue-50"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            data-testid={`delete-event-${event.id}`}
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-all rounded-lg hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <h3 className="font-serif text-xl text-foreground mb-1 truncate">{event.name}</h3>
      <div className="flex flex-wrap gap-3 mt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
          <Settings className="w-3 h-3" />
          {event.table_count} Tische
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
          <Users className="w-3 h-3" />
          {event.seats_per_table} Plätze/Tisch
        </span>
        {event.guest_count > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {event.guest_count} Gäste
          </span>
        )}
        {event.staff_count > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
            {event.staff_count} Mitarbeiter
          </span>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <span className="text-xs text-primary font-medium group-hover:underline">
          Event öffnen →
        </span>
      </div>
    </div>
  );
}

function CreateEventModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [tableCount, setTableCount] = useState(10);
  const [seatsPerTable, setSeatsPerTable] = useState(6);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Bitte einen Event-Namen eingeben'); return; }
    if (tableCount < 1 || seatsPerTable < 1) { toast.error('Ungültige Werte'); return; }
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), table_count: parseInt(tableCount), seats_per_table: parseInt(seatsPerTable) });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="create-event-modal">
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl animate-fade-in-up pointer-events-auto" onClick={e => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-6">Neues Event erstellen</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Event-Name</label>
            <input
              data-testid="event-name-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Sommerfest 2025"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Anzahl Tische</label>
              <input
                data-testid="table-count-input"
                type="number"
                min="1" max="100"
                value={tableCount}
                onChange={e => setTableCount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Plätze/Tisch</label>
              <input
                data-testid="seats-per-table-input"
                type="number"
                min="1" max="20"
                value={seatsPerTable}
                onChange={e => setSeatsPerTable(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">
              Abbrechen
            </button>
            <button
              data-testid="create-event-submit"
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Erstellen...' : 'Event erstellen'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await api.events.list();
      setEvents(res.data);
    } catch {
      toast.error('Fehler beim Laden der Events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (data) => {
    try {
      const res = await api.events.create(data);
      setEvents(prev => [res.data, ...prev]);
      toast.success('Event erstellt!');
      navigate(`/event/${res.data.id}/gaeste`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Fehler beim Erstellen');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.events.delete(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success('Event gelöscht');
    } catch {
      toast.error('Fehler beim Löschen');
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <Header />
      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground">Meine Events</h1>
            <p className="text-muted-foreground text-sm mt-2">
              {events.length === 0 ? 'Noch keine Events vorhanden' : `${events.length} Event${events.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            data-testid="create-event-btn"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Neues Event
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Laden...</div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-xl text-foreground mb-2">Kein Event vorhanden</h3>
            <p className="text-muted-foreground text-sm mb-6">Erstellen Sie Ihr erstes Event um zu beginnen.</p>
            <button
              data-testid="create-first-event-btn"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Erstes Event erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={handleDelete}
                onClick={(id) => navigate(`/event/${id}/gaeste`)}
              />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateEventModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
