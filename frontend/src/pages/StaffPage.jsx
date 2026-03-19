import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Upload, Users, Settings, FileDown, Layout, Edit2, Check, X, Link2, CheckCircle2, UtensilsCrossed, Briefcase } from 'lucide-react';
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
      <nav className="flex gap-0.5 md:gap-1">
        <Link to={`/event/${event?.id}/gaeste`}
          className={`px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'gaeste' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Users className="w-3.5 h-3.5" /><span className="hidden sm:inline"> Gäste</span>
        </Link>
        <Link to={`/event/${event?.id}/mitarbeiter`}
          className={`px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'mitarbeiter' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Briefcase className="w-3.5 h-3.5" /><span className="hidden sm:inline"> Mitarbeiter</span>
        </Link>
        <Link to={`/event/${event?.id}/tischplan`}
          className={`px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'tischplan' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Settings className="w-3.5 h-3.5" /><span className="hidden sm:inline"> Tischplan</span>
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

// Group staff: companions appear right after their main person
function groupStaff(staffList) {
  const companionMap = {};
  staffList.filter(g => g.companion_of).forEach(g => {
    if (!companionMap[g.companion_of]) companionMap[g.companion_of] = [];
    companionMap[g.companion_of].push(g);
  });
  const mainStaff = staffList
    .filter(g => !g.companion_of)
    .sort((a, b) => a.last_name.localeCompare(b.last_name, 'de'));
  const result = [];
  for (const g of mainStaff) {
    result.push(g);
    (companionMap[g.id] || [])
      .sort((a, b) => a.last_name.localeCompare(b.last_name, 'de'))
      .forEach(c => result.push(c));
  }
  const placedIds = new Set(result.map(g => g.id));
  staffList.filter(g => g.companion_of && !placedIds.has(g.id)).forEach(g => result.push(g));
  return result;
}

function StaffRow({ staff, allGuests, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(staff.first_name);
  const [lastName, setLastName] = useState(staff.last_name);
  const [guestType, setGuestType] = useState(staff.guest_type || 'erwachsener');
  const [companionOf, setCompanionOf] = useState(staff.companion_of || '');
  const [notes, setNotes] = useState(staff.notes || '');
  const [vehicle, setVehicle] = useState(staff.vehicle || '');
  const [licensePlate, setLicensePlate] = useState(staff.license_plate || '');

  const companionName = staff.companion_of
    ? allGuests.find(g => g.id === staff.companion_of)
    : null;

  const handleSave = async () => {
    await onUpdate(staff.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      guest_type: guestType,
      companion_of: companionOf || null,
      notes: notes.trim(),
      vehicle: vehicle.trim(),
      license_plate: licensePlate.trim(),
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setFirstName(staff.first_name);
    setLastName(staff.last_name);
    setGuestType(staff.guest_type || 'erwachsener');
    setCompanionOf(staff.companion_of || '');
    setNotes(staff.notes || '');
    setVehicle(staff.vehicle || '');
    setLicensePlate(staff.license_plate || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={`px-4 py-3 bg-amber-50/50 border-b border-border ${staff.companion_of ? 'pl-10' : ''}`} data-testid={`staff-edit-row-${staff.id}`}>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Vorname"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
          <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nachname"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select value={guestType} onChange={e => setGuestType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white">
            <option value="erwachsener">Erwachsener</option>
            <option value="kind">Kind</option>
          </select>
          <select value={companionOf} onChange={e => setCompanionOf(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white">
            <option value="">– Keine Begleitperson –</option>
            {allGuests.filter(g => g.id !== staff.id && g.is_staff).map(g => (
              <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notizen"
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Fahrzeug"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
          <input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} placeholder="Kennzeichen"
            className="px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary border border-border">
            <X className="w-3 h-3" /> Abbrechen
          </button>
          <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-amber-600 text-white hover:bg-amber-700">
            <Check className="w-3 h-3" /> Speichern
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={`staff-row-${staff.id}`}
      className={`flex items-center justify-between px-4 py-3 hover:bg-background transition-colors border-b border-border/50 ${staff.companion_of ? 'pl-10 bg-background/40' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 bg-amber-600"
        >
          {staff.first_name?.[0]?.toUpperCase()}{staff.last_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{staff.first_name} {staff.last_name}</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
              style={{ background: TYPE_COLORS[staff.guest_type] || '#7D8F69' }}
            >
              {TYPE_LABELS[staff.guest_type] || 'Erwachsener'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Mitarbeiter
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
          {(staff.notes || staff.vehicle || staff.license_plate) && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              {staff.notes && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{staff.notes}</span>}
              {staff.vehicle && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{staff.vehicle}</span>}
              {staff.license_plate && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{staff.license_plate}</span>}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          data-testid={`edit-staff-${staff.id}`}
          onClick={() => setEditing(true)}
          className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          data-testid={`delete-staff-${staff.id}`}
          onClick={() => onDelete(staff.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function StaffPage() {
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
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([api.events.get(eventId), api.guests.list(eventId)])
      .then(([evRes, gRes]) => {
        setEvent(evRes.data);
        setGuests(gRes.data);
      })
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const staffList = guests.filter(g => g.is_staff);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim()) { toast.error('Bitte Name eingeben'); return; }
    setAdding(true);
    try {
      const res = await api.guests.add(eventId, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        guest_type: guestType,
        companion_of: companionOf || null,
        is_staff: true,
        notes: notes.trim(),
        vehicle: vehicle.trim(),
        license_plate: licensePlate.trim(),
      });
      setGuests(prev => [...prev, res.data]);
      setFirstName(''); setLastName(''); setGuestType('erwachsener'); setCompanionOf('');
      setNotes(''); setVehicle(''); setLicensePlate('');
      toast.success('Mitarbeiter hinzugefügt');
    } catch { toast.error('Fehler beim Hinzufügen'); }
    finally { setAdding(false); }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Mitarbeiter wirklich löschen?')) return;
    try {
      await api.guests.delete(eventId, staffId);
      setGuests(prev => prev.filter(g => g.id !== staffId));
      toast.success('Mitarbeiter gelöscht');
    } catch { toast.error('Fehler beim Löschen'); }
  };

  const handleUpdateStaff = async (staffId, data) => {
    try {
      const res = await api.guests.update(eventId, staffId, data);
      setGuests(prev => prev.map(g => g.id === staffId ? res.data : g));
      toast.success('Mitarbeiter aktualisiert');
    } catch { toast.error('Fehler beim Speichern'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-serif animate-pulse">Laden...</div>;

  return (
    <div className="min-h-screen bg-background" data-testid="staff-page">
      <NavBar event={event} activeTab="mitarbeiter" />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Add Form */}
          <div className="space-y-6">
            <div className="bg-white border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-amber-600" />
                <h2 className="font-serif text-lg">Mitarbeiter hinzufügen</h2>
              </div>
              <form onSubmit={handleAddStaff} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input data-testid="staff-first-name-input" type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Vorname" className="px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  <input data-testid="staff-last-name-input" type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Nachname" className="px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select data-testid="staff-type-select" value={guestType} onChange={e => setGuestType(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                    <option value="erwachsener">Erwachsener</option>
                    <option value="kind">Kind</option>
                  </select>
                  <select data-testid="staff-companion-select" value={companionOf} onChange={e => setCompanionOf(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                    <option value="">– Keine –</option>
                    {staffList.map(g => (
                      <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                    ))}
                  </select>
                </div>
                <input data-testid="staff-notes-input" type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Notizen (optional)" className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <div className="grid grid-cols-2 gap-2">
                  <input data-testid="staff-vehicle-input" type="text" value={vehicle} onChange={e => setVehicle(e.target.value)}
                    placeholder="Fahrzeug" className="px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  <input data-testid="staff-license-input" type="text" value={licensePlate} onChange={e => setLicensePlate(e.target.value)}
                    placeholder="Kennzeichen" className="px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <button data-testid="add-staff-btn" type="submit" disabled={adding}
                  className="w-full py-3 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  {adding ? 'Hinzufügen...' : 'Mitarbeiter hinzufügen'}
                </button>
              </form>
            </div>

            {/* Stats */}
            <div className="bg-white border border-border rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-serif font-semibold text-amber-600">{staffList.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Mitarbeiter gesamt</div>
            </div>
          </div>

          {/* Right: Staff List */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-4 border-b border-border bg-gradient-to-r from-amber-50 to-transparent">
                <Briefcase className="w-5 h-5 text-amber-600" />
                <h2 className="font-serif text-lg">Mitarbeiterliste</h2>
                <span className="text-sm font-sans text-muted-foreground">({staffList.length})</span>
              </div>

              {staffList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Briefcase className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Noch keine Mitarbeiter vorhanden.</p>
                </div>
              ) : (
                groupStaff(staffList).map(staff => (
                  <StaffRow
                    key={staff.id}
                    staff={staff}
                    allGuests={guests}
                    onDelete={handleDeleteStaff}
                    onUpdate={handleUpdateStaff}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
