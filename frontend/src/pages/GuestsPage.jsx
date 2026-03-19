import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Upload, Users, Settings, FileDown, Layout, Edit2, Check, X, Link2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const TYPE_COLORS = { erwachsener: '#7D8F69', kind: '#3B82F6' };
const TYPE_LABELS = { erwachsener: 'Erwachsener', kind: 'Kind' };

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
      <nav className="flex gap-1">
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

// Inline edit row for a guest
function GuestRow({ guest, allGuests, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(guest.first_name);
  const [lastName, setLastName] = useState(guest.last_name);
  const [guestType, setGuestType] = useState(guest.guest_type || 'erwachsener');
  const [companionOf, setCompanionOf] = useState(guest.companion_of || '');

  const companionName = guest.companion_of
    ? allGuests.find(g => g.id === guest.companion_of)
    : null;

  const handleSave = async () => {
    await onUpdate(guest.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      guest_type: guestType,
      companion_of: companionOf || null,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setFirstName(guest.first_name);
    setLastName(guest.last_name);
    setGuestType(guest.guest_type || 'erwachsener');
    setCompanionOf(guest.companion_of || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="px-4 py-3 bg-primary/5 border-b border-border" data-testid={`guest-edit-row-${guest.id}`}>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Vorname"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nachname"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select value={guestType} onChange={e => setGuestType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
            <option value="erwachsener">Erwachsener</option>
            <option value="kind">Kind</option>
          </select>
          <select value={companionOf} onChange={e => setCompanionOf(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
            <option value="">– Keine Begleitperson –</option>
            {allGuests.filter(g => g.id !== guest.id).map(g => (
              <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary border border-border">
            <X className="w-3 h-3" /> Abbrechen
          </button>
          <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-primary text-white hover:bg-primary/90">
            <Check className="w-3 h-3" /> Speichern
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={`guest-row-${guest.id}`}
      className="flex items-center justify-between px-4 py-3 hover:bg-background transition-colors border-b border-border/50"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
          style={{ background: TYPE_COLORS[guest.guest_type] || '#7D8F69' }}
        >
          {guest.first_name?.[0]?.toUpperCase()}{guest.last_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{guest.first_name} {guest.last_name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
              style={{ background: TYPE_COLORS[guest.guest_type] || '#7D8F69' }}
            >
              {TYPE_LABELS[guest.guest_type] || 'Erwachsener'}
            </span>
          </div>
          {companionName && (
            <div className="flex items-center gap-1 mt-0.5">
              <Link2 className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Begleitperson von: {companionName.first_name} {companionName.last_name}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          data-testid={`edit-guest-${guest.id}`}
          onClick={() => setEditing(true)}
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          data-testid={`delete-guest-${guest.id}`}
          onClick={() => onDelete(guest.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
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
  const [guestType, setGuestType] = useState('erwachsener');
  const [companionOf, setCompanionOf] = useState('');
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
      const res = await api.guests.add(eventId, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        guest_type: guestType,
        companion_of: companionOf || null,
      });
      setGuests(prev => [...prev, res.data].sort((a, b) => a.last_name.localeCompare(b.last_name)));
      setFirstName(''); setLastName(''); setGuestType('erwachsener'); setCompanionOf('');
      toast.success('Gast hinzugefügt');
    } catch { toast.error('Fehler beim Hinzufügen'); }
    finally { setAdding(false); }
  };

  const handleDeleteGuest = async (guestId) => {
    if (!window.confirm('Gast wirklich löschen?')) return;
    try {
      await api.guests.delete(eventId, guestId);
      setGuests(prev => prev.filter(g => g.id !== guestId));
      toast.success('Gast gelöscht');
    } catch { toast.error('Fehler beim Löschen'); }
  };

  const handleUpdateGuest = async (guestId, data) => {
    try {
      const res = await api.guests.update(eventId, guestId, data);
      setGuests(prev => prev.map(g => g.id === guestId ? res.data : g).sort((a, b) => a.last_name.localeCompare(b.last_name)));
      toast.success('Gast aktualisiert');
    } catch { toast.error('Fehler beim Speichern'); }
  };

  const handleCsvImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await api.guests.importCsv(eventId, file);
      toast.success(`${res.data.imported} Gäste importiert`);
      const gRes = await api.guests.list(eventId);
      setGuests(gRes.data);
    } catch { toast.error('CSV Import fehlgeschlagen'); }
    e.target.value = '';
  };

  const handleSaveEventSettings = async () => {
    try {
      const res = await api.events.update(eventId, { name: eventName, table_count: parseInt(tableCount), seats_per_table: parseInt(seatsPerTable) });
      setEvent(res.data);
      setEditingEvent(false);
      toast.success('Einstellungen gespeichert');
    } catch { toast.error('Fehler beim Speichern'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-serif animate-pulse">Laden...</div>;

  const totalCapacity = event ? event.table_count * event.seats_per_table : 0;
  const adultsCount = guests.filter(g => g.guest_type !== 'kind').length;
  const kidsCount = guests.filter(g => g.guest_type === 'kind').length;
  const companionsCount = guests.filter(g => g.companion_of).length;

  return (
    <div className="min-h-screen bg-background" data-testid="guests-page">
      <NavBar event={event} activeTab="gaeste" />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Settings + Add Form */}
          <div className="space-y-6">
            {/* Event Settings */}
            <div className="bg-white border border-border rounded-2xl p-6" data-testid="event-settings-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg">Einstellungen</h2>
                <button data-testid="edit-settings-btn" onClick={() => setEditingEvent(!editingEvent)} className="text-xs text-primary hover:underline">
                  {editingEvent ? 'Abbrechen' : 'Bearbeiten'}
                </button>
              </div>
              {editingEvent ? (
                <div className="space-y-3">
                  <input data-testid="edit-event-name" value={eventName} onChange={e => setEventName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Tische</label>
                      <input data-testid="edit-table-count" type="number" min="1" max="100" value={tableCount} onChange={e => setTableCount(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Plätze</label>
                      <input data-testid="edit-seats-per-table" type="number" min="1" max="20" value={seatsPerTable} onChange={e => setSeatsPerTable(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <button data-testid="save-settings-btn" onClick={handleSaveEventSettings}
                    className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all">
                    Speichern
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {[['Name', event?.name], ['Tische', event?.table_count], ['Plätze/Tisch', event?.seats_per_table], ['Kapazität', totalCapacity + ' Plätze']].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium truncate max-w-[140px]">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Guest Form */}
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-serif text-lg mb-4">Gast hinzufügen</h2>
              <form onSubmit={handleAddGuest} className="space-y-3">
                <input data-testid="first-name-input" type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="Vorname" className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input data-testid="last-name-input" type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Nachname" className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Alter</label>
                  <select data-testid="guest-type-select" value={guestType} onChange={e => setGuestType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="erwachsener">Erwachsener</option>
                    <option value="kind">Kind</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Begleitperson von</label>
                  <select data-testid="companion-select" value={companionOf} onChange={e => setCompanionOf(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="">– Keine –</option>
                    {guests.map(g => (
                      <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                    ))}
                  </select>
                </div>
                <button data-testid="add-guest-btn" type="submit" disabled={adding}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  {adding ? 'Hinzufügen...' : 'Gast hinzufügen'}
                </button>
              </form>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">CSV: Vorname,Nachname[,Typ]</p>
                <button data-testid="csv-import-btn" onClick={() => csvRef.current?.click()}
                  className="w-full py-2.5 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> CSV importieren
                </button>
                <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} data-testid="csv-file-input" />
              </div>
            </div>
          </div>

          {/* Right: Guest List */}
          <div className="lg:col-span-2">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Gesamt', value: guests.length, color: '#7D8F69' },
                { label: 'Erwachsene', value: adultsCount, color: '#7D8F69' },
                { label: 'Kinder', value: kidsCount, color: '#3B82F6' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-border rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-serif font-semibold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <h2 className="font-serif text-lg">
                  Gästeliste
                  <span className="ml-2 text-sm font-sans font-normal text-muted-foreground">({guests.length})</span>
                </h2>
                <div className="text-xs text-muted-foreground">
                  {totalCapacity - guests.length > 0 ? `${totalCapacity - guests.length} freie Plätze` :
                    guests.length > totalCapacity ? `${guests.length - totalCapacity} über Kapazität` : 'Voll belegt'}
                </div>
              </div>

              {guests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Noch keine Gäste vorhanden.</p>
                </div>
              ) : (
                guests.map(guest => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    allGuests={guests}
                    onDelete={handleDeleteGuest}
                    onUpdate={handleUpdateGuest}
                  />
                ))
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
