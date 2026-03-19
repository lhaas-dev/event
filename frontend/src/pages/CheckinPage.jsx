import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, CheckCircle2, Circle, Users,
  Settings, FileDown, Layout, Link2, RotateCcw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
    const comps = (companionMap[g.id] || []).sort((a, b) => a.last_name.localeCompare(b.last_name, 'de'));
    comps.forEach(c => result.push(c));
  }
  // Orphaned companions (main guest deleted/missing)
  const placedIds = new Set(result.map(g => g.id));
  guests.filter(g => g.companion_of && !placedIds.has(g.id)).forEach(g => result.push(g));
  return result;
}

const TYPE_COLORS = { erwachsener: '#7D8F69', kind: '#3B82F6' };

function CheckinRow({ guest, guestMap, onToggle, isCompanion }) {
  const [loading, setLoading] = useState(false);
  const initials = `${guest.first_name?.[0] || ''}${guest.last_name?.[0] || ''}`.toUpperCase();
  const companionOf = guest.companion_of ? guestMap[guest.companion_of] : null;

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(guest.id);
    setLoading(false);
  };

  return (
    <div
      data-testid={`checkin-row-${guest.id}`}
      onClick={handleToggle}
      className={`flex items-center gap-4 px-4 md:px-6 py-4 border-b border-border cursor-pointer select-none transition-colors
        ${isCompanion ? 'pl-10 md:pl-16 bg-background/60' : 'bg-white'}
        ${guest.checked_in ? 'bg-green-50/80' : 'hover:bg-gray-50'}
        active:bg-gray-100`}
    >
      {/* Indentation line for companions */}
      {isCompanion && (
        <div className="absolute left-6 md:left-8 w-px h-full bg-border opacity-60" style={{ position: 'relative', left: -8, top: 0, marginRight: -8 }}>
          <div className="w-4 h-px bg-border absolute top-1/2 left-0" />
        </div>
      )}

      {/* Avatar */}
      <div
        className="w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ background: guest.checked_in ? '#22c55e' : TYPE_COLORS[guest.guest_type] || '#7D8F69' }}
      >
        {guest.checked_in ? '✓' : initials}
      </div>

      {/* Name + info */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-base md:text-lg leading-tight ${guest.checked_in ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {guest.first_name} {guest.last_name}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className="text-[11px] px-2 py-0.5 rounded-full text-white"
            style={{ background: TYPE_COLORS[guest.guest_type] || '#7D8F69' }}
          >
            {guest.guest_type === 'kind' ? 'Kind' : 'Erwachsener'}
          </span>
          {companionOf && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Link2 className="w-3 h-3" />
              Begl. v. {companionOf.first_name} {companionOf.last_name}
            </span>
          )}
          {isCompanion && !companionOf && (
            <span className="text-[11px] text-muted-foreground italic">Begleitperson</span>
          )}
        </div>
      </div>

      {/* Check button */}
      <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
        ${guest.checked_in
          ? 'bg-green-500 border-green-500'
          : 'border-gray-300 bg-white hover:border-green-400'
        } ${loading ? 'opacity-50' : ''}`}
      >
        {guest.checked_in
          ? <CheckCircle2 className="w-6 h-6 text-white" />
          : <Circle className="w-6 h-6 text-gray-300" />
        }
      </div>
    </div>
  );
}

export default function CheckinPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    Promise.all([api.events.get(eventId), api.guests.list(eventId)])
      .then(([evRes, gRes]) => {
        setEvent(evRes.data);
        setGuests(gRes.data);
      })
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const guestMap = guests.reduce((acc, g) => ({ ...acc, [g.id]: g }), {});
  const checkedInCount = guests.filter(g => g.checked_in).length;
  const totalCount = guests.length;
  const progress = totalCount > 0 ? (checkedInCount / totalCount) * 100 : 0;

  const handleToggle = useCallback(async (guestId) => {
    try {
      const res = await api.checkin.toggle(eventId, guestId);
      setGuests(prev => prev.map(g => g.id === guestId ? { ...g, checked_in: res.data.checked_in } : g));
    } catch {
      toast.error('Fehler beim Aktualisieren');
    }
  }, [eventId]);

  const handleResetAll = async () => {
    if (!window.confirm('Alle Check-ins zurücksetzen?')) return;
    setResetting(true);
    try {
      await Promise.all(
        guests.filter(g => g.checked_in).map(g => api.checkin.toggle(eventId, g.id))
      );
      setGuests(prev => prev.map(g => ({ ...g, checked_in: false })));
      toast.success('Alle Check-ins zurückgesetzt');
    } catch {
      toast.error('Fehler beim Zurücksetzen');
    } finally {
      setResetting(false);
    }
  };

  // Group and filter
  const grouped = groupGuests(guests);
  const companionIds = new Set(guests.filter(g => g.companion_of).map(g => g.id));

  const filtered = search.trim()
    ? grouped.filter(g =>
        `${g.first_name} ${g.last_name}`.toLowerCase().includes(search.toLowerCase())
      )
    : grouped;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground font-serif animate-pulse">Laden...</div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="checkin-page">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 md:px-6 py-3 flex items-center gap-2 md:gap-4 sticky top-0 z-50">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Layout className="w-3 h-3 text-white" />
          </div>
          <span className="font-serif text-base md:text-lg truncate">{event?.name}</span>
        </div>
        {/* Nav */}
        <nav className="flex gap-0.5 md:gap-1" data-testid="event-nav-checkin">
          <Link to={`/event/${eventId}/gaeste`} className="px-2 md:px-3 py-2 rounded-xl text-xs md:text-sm font-medium text-muted-foreground hover:bg-secondary flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /><span className="hidden md:inline"> Gäste</span>
          </Link>
          <Link to={`/event/${eventId}/tischplan`} className="px-2 md:px-3 py-2 rounded-xl text-xs md:text-sm font-medium text-muted-foreground hover:bg-secondary flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" /><span className="hidden md:inline"> Tischplan</span>
          </Link>
          <Link to={`/event/${eventId}/einlass`} className="px-2 md:px-3 py-2 rounded-xl text-xs md:text-sm font-medium bg-primary text-white flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /><span className="hidden md:inline"> Einlass</span>
          </Link>
          <Link to={`/event/${eventId}/export`} className="px-2 md:px-3 py-2 rounded-xl text-xs md:text-sm font-medium text-muted-foreground hover:bg-secondary flex items-center gap-1">
            <FileDown className="w-3.5 h-3.5" /><span className="hidden md:inline"> Export</span>
          </Link>
        </nav>
      </header>

      {/* Stats bar */}
      <div className="bg-white border-b border-border px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl md:text-4xl font-serif font-semibold text-green-600">{checkedInCount}</div>
                <div className="text-xs text-muted-foreground">Eingetroffen</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-3xl md:text-4xl font-serif font-semibold text-foreground">{totalCount - checkedInCount}</div>
                <div className="text-xs text-muted-foreground">Ausstehend</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-3xl md:text-4xl font-serif font-semibold text-foreground">{totalCount}</div>
                <div className="text-xs text-muted-foreground">Gesamt</div>
              </div>
            </div>
            {checkedInCount > 0 && (
              <button
                data-testid="reset-checkins-btn"
                onClick={handleResetAll}
                disabled={resetting}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-2 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Zurücksetzen</span>
              </button>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
              data-testid="checkin-progress"
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1.5 text-right">{Math.round(progress)}%</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-border px-4 md:px-8 py-3 sticky top-[61px] z-40">
        <div className="max-w-4xl mx-auto relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            data-testid="checkin-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Gast suchen..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Guest List */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? `Kein Gast gefunden für "${search}"` : 'Keine Gäste vorhanden'}
            </p>
          </div>
        ) : (
          filtered.map(guest => (
            <CheckinRow
              key={guest.id}
              guest={guest}
              guestMap={guestMap}
              onToggle={handleToggle}
              isCompanion={!!guest.companion_of}
            />
          ))
        )}
      </div>
    </div>
  );
}
