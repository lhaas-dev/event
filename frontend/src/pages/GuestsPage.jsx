import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Upload, Users, Settings, FileDown, Layout } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function NavBar({ event, activeTab }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="bg-white border-b border-border px-6 py-3 flex items-center gap-4 sticky top-0 z-50">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-2">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </button>
      <div className="flex items-center gap-2 flex-1">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Layout className="w-3 h-3 text-white" />
        </div>
        <span className="font-serif text-lg truncate max-w-[200px]">{event?.name || '...'}</span>
      </div>
      <nav className="flex gap-1" data-testid="event-nav">
        <Link to={`/event/${event?.id}/gaeste`}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'gaeste' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Users className="w-3.5 h-3.5" /> Gäste
        </Link>
        <Link to={`/event/${event?.id}/tischplan`}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'tischplan' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Settings className="w-3.5 h-3.5" /> Tischplan
        </Link>
        <Link to={`/event/${event?.id}/export`}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'export' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <FileDown className="w-3.5 h-3.5" /> Export
        </Link>
      </nav>
      <button onClick={() => { logout(); navigate('/'); }} className="text-xs text-muted-foreground hover:text-foreground ml-2">Abmelden</button>
    </header>
  );
}

export default function GuestsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingEvent, setEditingEvent] = useState(false);
  const [eventName, setEventName] = useState('');
  const [tableCount, setTableCount] = useState('');
  const [seatsPerTable, setSeatsPerTable] = useState('');
  const csvRef = useRef(null);

  useEffect(() => {
    Promise.all([api.events.get(eventId), api.guests.list(eventId)])
      .then(([evRes, gRes]) => {
        setEvent(evRes.data);
        setEventName(evRes.data.name);
        setTableCount(evRes.data.table_count);
        setSeatsPerTable(evRes.data.seats_per_table);
        setGuests(gRes.data);
      })
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim()) { toast.error('Bitte Name eingeben'); return; }
    setAdding(true);
    try {
      const res = await api.guests.add(eventId, { first_name: firstName.trim(), last_name: lastName.trim() });
      setGuests(prev => [...prev, res.data].sort((a, b) => a.last_name.localeCompare(b.last_name)));
      setFirstName(''); setLastName('');
      toast.success('Gast hinzugefügt');
    } catch {
      toast.error('Fehler beim Hinzufügen');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteGuest = async (guestId) => {
    if (!window.confirm('Gast wirklich löschen?')) return;
    try {
      await api.guests.delete(eventId, guestId);
      setGuests(prev => prev.filter(g => g.id !== guestId));
      toast.success('Gast gelöscht');
    } catch {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleCsvImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await api.guests.importCsv(eventId, file);
      toast.success(`${res.data.imported} Gäste importiert`);
      const gRes = await api.guests.list(eventId);
      setGuests(gRes.data);
    } catch {
      toast.error('CSV Import fehlgeschlagen');
    }
    e.target.value = '';
  };

  const handleSaveEventSettings = async () => {
    try {
      const res = await api.events.update(eventId, {
        name: eventName,
        table_count: parseInt(tableCount),
        seats_per_table: parseInt(seatsPerTable),
      });
      setEvent(res.data);
      setEditingEvent(false);
      toast.success('Einstellungen gespeichert');
    } catch {
      toast.error('Fehler beim Speichern');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-serif animate-pulse">Laden...</div>;

  const totalCapacity = event ? event.table_count * event.seats_per_table : 0;

  return (
    <div className="min-h-screen bg-background" data-testid="guests-page">
      <NavBar event={event} activeTab="gaeste" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Event Settings + Add Guest */}
          <div className="space-y-6">
            {/* Event Settings Card */}
            <div className="bg-white border border-border rounded-2xl p-6" data-testid="event-settings-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg">Event-Einstellungen</h2>
                <button
                  data-testid="edit-settings-btn"
                  onClick={() => setEditingEvent(!editingEvent)}
                  className="text-xs text-primary hover:underline"
                >
                  {editingEvent ? 'Abbrechen' : 'Bearbeiten'}
                </button>
              </div>
              {editingEvent ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Name</label>
                    <input
                      data-testid="edit-event-name"
                      value={eventName}
                      onChange={e => setEventName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Tische</label>
                      <input
                        data-testid="edit-table-count"
                        type="number" min="1" max="100"
                        value={tableCount}
                        onChange={e => setTableCount(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Plätze</label>
                      <input
                        data-testid="edit-seats-per-table"
                        type="number" min="1" max="20"
                        value={seatsPerTable}
                        onChange={e => setSeatsPerTable(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <button
                    data-testid="save-settings-btn"
                    onClick={handleSaveEventSettings}
                    className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
                  >
                    Speichern
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium truncate max-w-[150px]">{event?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Tische</span>
                    <span className="text-sm font-medium">{event?.table_count}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Plätze/Tisch</span>
                    <span className="text-sm font-medium">{event?.seats_per_table}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Kapazität</span>
                    <span className="text-sm font-medium">{totalCapacity} Plätze</span>
                  </div>
                </div>
              )}
            </div>

            {/* Add Guest Form */}
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-serif text-lg mb-4">Gast hinzufügen</h2>
              <form onSubmit={handleAddGuest} className="space-y-3">
                <input
                  data-testid="first-name-input"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Vorname"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  data-testid="last-name-input"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Nachname"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  data-testid="add-guest-btn"
                  type="submit"
                  disabled={adding}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {adding ? 'Hinzufügen...' : 'Gast hinzufügen'}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">CSV-Format: Vorname,Nachname</p>
                <button
                  data-testid="csv-import-btn"
                  onClick={() => csvRef.current?.click()}
                  className="w-full py-2.5 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  CSV importieren
                </button>
                <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} data-testid="csv-file-input" />
              </div>
            </div>
          </div>

          {/* Right: Guest List */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-serif text-lg">
                  Gästeliste
                  <span className="ml-2 text-sm font-sans font-normal text-muted-foreground">({guests.length} Gäste)</span>
                </h2>
                {guests.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {totalCapacity - guests.length > 0 ? `${totalCapacity - guests.length} freie Plätze` : `${guests.length - totalCapacity} Gäste über Kapazität`}
                  </div>
                )}
              </div>

              {guests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Noch keine Gäste. Fügen Sie Gäste einzeln oder per CSV hinzu.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {guests.map((guest, idx) => (
                    <div
                      key={guest.id}
                      data-testid={`guest-row-${guest.id}`}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-background transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                          {guest.first_name?.[0]?.toUpperCase()}{guest.last_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">{guest.first_name} {guest.last_name}</span>
                        </div>
                      </div>
                      <button
                        data-testid={`delete-guest-${guest.id}`}
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {guests.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  data-testid="go-to-seating-btn"
                  onClick={() => navigate(`/event/${eventId}/tischplan`)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Zum Tischplan →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
