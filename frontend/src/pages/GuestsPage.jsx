import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Upload, Users, Settings, FileDown, Layout, Edit2, Check, X, Link2, CheckCircle2, UtensilsCrossed, Briefcase, Car, FileText, Mail, Phone, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const TYPE_COLORS = { erwachsener: '#7D8F69', kind: '#3B82F6' };
const TYPE_LABELS = { erwachsener: 'Erwachsener', kind: 'Kind' };
const SALUTATIONS = ['Herr', 'Frau', 'Dr.', 'Prof.', ''];

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
      <nav className="flex gap-0.5 md:gap-1">
        <Link to={`/event/${event?.id}/gaeste`}
          className={`px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'gaeste' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Users className="w-3.5 h-3.5" /><span className="hidden sm:inline"> Gäste</span>
        </Link>
        <Link to={`/event/${event?.id}/mitarbeiter`}
          className={`px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'mitarbeiter' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Briefcase className="w-3.5 h-3.5" /><span className="hidden sm:inline"> MA</span>
        </Link>
        <Link to={`/event/${event?.id}/fahrzeug`}
          className={`px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'fahrzeug' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Car className="w-3.5 h-3.5" /><span className="hidden sm:inline"> Fahrzeug</span>
        </Link>
        <Link to={`/event/${event?.id}/tischplan`}
          className={`px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'tischplan' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Settings className="w-3.5 h-3.5" /><span className="hidden sm:inline"> Plan</span>
        </Link>
        <Link to={`/event/${event?.id}/einlass`}
          className={`px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'einlass' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <CheckCircle2 className="w-3.5 h-3.5" /><span className="hidden sm:inline"> Einlass</span>
        </Link>
        <Link to={`/event/${event?.id}/menu`}
          className={`px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'menu' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <UtensilsCrossed className="w-3.5 h-3.5" /><span className="hidden sm:inline"> Menü</span>
        </Link>
        <Link to={`/event/${event?.id}/export`}
          className={`px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'export' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <FileDown className="w-3.5 h-3.5" /><span className="hidden sm:inline"> Export</span>
        </Link>
      </nav>
      <button onClick={() => { logout(); navigate('/'); }} className="text-xs text-muted-foreground hover:text-foreground ml-2">Abmelden</button>
    </header>
  );
}

// Group guests: companions appear right after their main guest
function groupGuests(guests) {
  const companionMap = {};
  guests.filter(g => g.companion_of).forEach(g => {
    if (!companionMap[g.companion_of]) companionMap[g.companion_of] = [];
    companionMap[g.companion_of].push(g);
  });
  const mainGuests = guests
    .filter(g => !g.companion_of)
    .sort((a, b) => a.last_name.localeCompare(b.last_name, 'de'));
  const result = [];
  for (const g of mainGuests) {
    result.push(g);
    (companionMap[g.id] || [])
      .sort((a, b) => a.last_name.localeCompare(b.last_name, 'de'))
      .forEach(c => result.push(c));
  }
  const placedIds = new Set(result.map(g => g.id));
  guests.filter(g => g.companion_of && !placedIds.has(g.id)).forEach(g => result.push(g));
  return result;
}

// Inline edit row for a guest
function GuestRow({ guest, allGuests, onDelete, onUpdate, selected, onSelect }) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(guest.first_name);
  const [lastName, setLastName] = useState(guest.last_name);
  const [guestType, setGuestType] = useState(guest.guest_type || 'erwachsener');
  const [companionOf, setCompanionOf] = useState(guest.companion_of || '');
  const [notes, setNotes] = useState(guest.notes || '');
  const [vehicle, setVehicle] = useState(guest.vehicle || '');
  const [licensePlate, setLicensePlate] = useState(guest.license_plate || '');
  const [email, setEmail] = useState(guest.email || '');
  const [salutation, setSalutation] = useState(guest.salutation || '');
  const [phone, setPhone] = useState(guest.phone || '');

  const companionName = guest.companion_of
    ? allGuests.find(g => g.id === guest.companion_of)
    : null;

  const handleSave = async () => {
    await onUpdate(guest.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      guest_type: guestType,
      companion_of: companionOf || null,
      notes: notes.trim(),
      vehicle: vehicle.trim(),
      license_plate: licensePlate.trim(),
      email: email.trim(),
      salutation: salutation,
      phone: phone.trim(),
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setFirstName(guest.first_name);
    setLastName(guest.last_name);
    setGuestType(guest.guest_type || 'erwachsener');
    setCompanionOf(guest.companion_of || '');
    setNotes(guest.notes || '');
    setVehicle(guest.vehicle || '');
    setLicensePlate(guest.license_plate || '');
    setEmail(guest.email || '');
    setSalutation(guest.salutation || '');
    setPhone(guest.phone || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={`px-4 py-3 bg-primary/5 border-b border-border ${guest.companion_of ? 'pl-10' : ''}`} data-testid={`guest-edit-row-${guest.id}`}>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <select value={salutation} onChange={e => setSalutation(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
            <option value="">– Anrede –</option>
            {SALUTATIONS.filter(s => s).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Vorname"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nachname"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-Mail" type="email"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon"
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
            {allGuests.filter(g => g.id !== guest.id && !g.is_staff).map(g => (
              <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notizen (optional)"
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Fahrzeug"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          <input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} placeholder="Kennzeichen"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
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
      className={`flex items-center justify-between px-4 py-3 hover:bg-background transition-colors border-b border-border/50 ${guest.companion_of ? 'pl-10 bg-background/40' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox for email selection */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelect(guest.id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            disabled={!guest.email}
            title={guest.email ? 'Für E-Mail auswählen' : 'Keine E-Mail vorhanden'}
          />
        )}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
          style={{ background: TYPE_COLORS[guest.guest_type] || '#7D8F69' }}
        >
          {guest.first_name?.[0]?.toUpperCase()}{guest.last_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {guest.salutation && <span className="text-xs text-muted-foreground">{guest.salutation}</span>}
            <span className="text-sm font-medium text-foreground">{guest.first_name} {guest.last_name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
              style={{ background: TYPE_COLORS[guest.guest_type] || '#7D8F69' }}
            >
              {TYPE_LABELS[guest.guest_type] || 'Erwachsener'}
            </span>
          </div>
          {(guest.email || guest.phone) && (
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              {guest.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {guest.email}
                </span>
              )}
              {guest.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {guest.phone}
                </span>
              )}
            </div>
          )}
          {companionName && (
            <div className="flex items-center gap-1 mt-0.5">
              <Link2 className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Begleitperson von: {companionName.first_name} {companionName.last_name}
              </span>
            </div>
          )}
          {(guest.notes || guest.vehicle || guest.license_plate) && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              {guest.notes && (
                <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                  <FileText className="w-3 h-3" /> {guest.notes}
                </span>
              )}
              {guest.vehicle && (
                <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                  <Car className="w-3 h-3" /> {guest.vehicle}
                </span>
              )}
              {guest.license_plate && (
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{guest.license_plate}</span>
              )}
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
  const [notes, setNotes] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [email, setEmail] = useState('');
  const [salutation, setSalutation] = useState('');
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingEvent, setEditingEvent] = useState(false);
  const [eventName, setEventName] = useState('');
  const [tableCount, setTableCount] = useState('');
  const [seatsPerTable, setSeatsPerTable] = useState('');
  const csvRef = useRef(null);
  
  // Email selection state
  const [selectedGuestIds, setSelectedGuestIds] = useState(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

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

  // Filter to show only non-staff guests
  const guestList = guests.filter(g => !g.is_staff);

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
        is_staff: false,
        notes: notes.trim(),
        vehicle: vehicle.trim(),
        license_plate: licensePlate.trim(),
        email: email.trim(),
        salutation: salutation,
        phone: phone.trim(),
      });
      setGuests(prev => [...prev, res.data].sort((a, b) => a.last_name.localeCompare(b.last_name)));
      setFirstName(''); setLastName(''); setGuestType('erwachsener'); setCompanionOf('');
      setNotes(''); setVehicle(''); setLicensePlate(''); setEmail(''); setSalutation(''); setPhone('');
      toast.success('Gast hinzugefügt');
    } catch { toast.error('Fehler beim Hinzufügen'); }
    finally { setAdding(false); }
  };

  const handleGuestSelect = (guestId, selected) => {
    setSelectedGuestIds(prev => {
      const newSet = new Set(prev);
      if (selected) newSet.add(guestId);
      else newSet.delete(guestId);
      return newSet;
    });
  };

  const handleSelectAllWithEmail = () => {
    const guestsWithEmail = guestList.filter(g => g.email);
    if (selectedGuestIds.size === guestsWithEmail.length) {
      setSelectedGuestIds(new Set());
    } else {
      setSelectedGuestIds(new Set(guestsWithEmail.map(g => g.id)));
    }
  };

  const handleSendEmail = async () => {
    if (selectedGuestIds.size === 0) { toast.error('Bitte Gäste auswählen'); return; }
    if (!emailSubject.trim()) { toast.error('Bitte Betreff eingeben'); return; }
    if (!emailBody.trim()) { toast.error('Bitte Nachricht eingeben'); return; }
    
    setSendingEmail(true);
    try {
      const res = await api.emailSettings.sendEmail(eventId, {
        guest_ids: Array.from(selectedGuestIds),
        subject: emailSubject,
        body: emailBody,
      });
      toast.success(`E-Mail an ${res.data.sent} Gäste gesendet`);
      if (res.data.failed?.length > 0) {
        toast.error(`${res.data.failed.length} E-Mails fehlgeschlagen`);
      }
      setShowEmailModal(false);
      setSelectedGuestIds(new Set());
      setEmailSubject('');
      setEmailBody('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler beim Senden');
    } finally {
      setSendingEmail(false);
    }
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
  const adultsCount = guestList.filter(g => g.guest_type !== 'kind').length;
  const kidsCount = guestList.filter(g => g.guest_type === 'kind').length;
  const companionsCount = guestList.filter(g => g.companion_of).length;
  const staffCount = guests.filter(g => g.is_staff).length;

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
                <div className="grid grid-cols-3 gap-2">
                  <select data-testid="salutation-select" value={salutation} onChange={e => setSalutation(e.target.value)}
                    className="px-3 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="">Anrede</option>
                    {SALUTATIONS.filter(s => s).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input data-testid="first-name-input" type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Vorname" className="px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input data-testid="last-name-input" type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Nachname" className="px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <input data-testid="email-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="E-Mail" className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input data-testid="phone-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Telefon" className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Alter</label>
                    <select data-testid="guest-type-select" value={guestType} onChange={e => setGuestType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                      <option value="erwachsener">Erwachsener</option>
                      <option value="kind">Kind</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Begleitperson</label>
                    <select data-testid="companion-select" value={companionOf} onChange={e => setCompanionOf(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                      <option value="">– Keine –</option>
                      {guestList.map(g => (
                        <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <input data-testid="notes-input" type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Notizen (optional)" className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <div className="grid grid-cols-2 gap-2">
                  <input data-testid="vehicle-input" type="text" value={vehicle} onChange={e => setVehicle(e.target.value)}
                    placeholder="Fahrzeug" className="px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input data-testid="license-input" type="text" value={licensePlate} onChange={e => setLicensePlate(e.target.value)}
                    placeholder="Kennzeichen" className="px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
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
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Gäste', value: guestList.length, color: '#7D8F69' },
                { label: 'Erwachsene', value: adultsCount, color: '#7D8F69' },
                { label: 'Kinder', value: kidsCount, color: '#3B82F6' },
                { label: 'Mitarbeiter', value: staffCount, color: '#D97706' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-border rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-serif font-semibold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-lg">
                    Gästeliste
                    <span className="ml-2 text-sm font-sans font-normal text-muted-foreground">({guestList.length})</span>
                  </h2>
                  {guestList.filter(g => g.email).length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAllWithEmail}
                        className="text-xs text-primary hover:underline"
                      >
                        {selectedGuestIds.size === guestList.filter(g => g.email).length ? 'Keine auswählen' : 'Alle mit E-Mail'}
                      </button>
                      {selectedGuestIds.size > 0 && (
                        <button
                          onClick={() => setShowEmailModal(true)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-all"
                        >
                          <Send className="w-3 h-3" />
                          E-Mail ({selectedGuestIds.size})
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {totalCapacity - guests.length > 0 ? `${totalCapacity - guests.length} freie Plätze` :
                    guests.length > totalCapacity ? `${guests.length - totalCapacity} über Kapazität` : 'Voll belegt'}
                </div>
              </div>

              {guestList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Noch keine Gäste vorhanden.</p>
                </div>
              ) : (
                groupGuests(guestList).map(guest => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    allGuests={guestList}
                    onDelete={handleDeleteGuest}
                    onUpdate={handleUpdateGuest}
                    selected={selectedGuestIds.has(guest.id)}
                    onSelect={handleGuestSelect}
                  />
                ))
              )}
            </div>

            {guestList.length > 0 && (
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4" data-testid="email-modal">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">E-Mail senden</h2>
              <button onClick={() => setShowEmailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              An {selectedGuestIds.size} Gäste mit E-Mail-Adresse
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Betreff</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Einladung zum Event..."
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Nachricht</label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  placeholder="Guten Tag {anrede} {nachname},&#10;&#10;wir freuen uns Sie bei unserem Event begrüssen zu dürfen..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Verfügbare Platzhalter: {'{anrede}'}, {'{vorname}'}, {'{nachname}'}, {'{name}'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 py-3 border border-border text-muted-foreground rounded-xl text-sm font-medium hover:bg-secondary transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sendingEmail ? 'Wird gesendet...' : 'Senden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
