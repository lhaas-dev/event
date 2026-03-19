import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import { Search, MapPin, Users, UtensilsCrossed, Wine, Layout, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const TYPE_COLORS = { erwachsener: '#7D8F69', kind: '#3B82F6' };

function VisitorHeader({ event, activeTab, eventId }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  return (
    <header className="bg-white border-b border-border px-4 md:px-6 py-3 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Layout className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif text-lg truncate">{event?.name || 'Event'}</span>
        </div>
        <nav className="flex gap-1">
          <Link 
            to={`/besucher/${eventId}`}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'sitzplan' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Sitzplan</span>
          </Link>
          <Link 
            to={`/besucher/${eventId}/menu`}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'menu' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span className="hidden sm:inline">Menü</span>
          </Link>
        </nav>
        <button 
          onClick={() => { logout(); navigate('/'); }} 
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          title="Abmelden"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default function VisitorViewPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [seating, setSeating] = useState({ tables: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [foundResult, setFoundResult] = useState(null);

  useEffect(() => {
    Promise.all([
      api.visitor.events.get(eventId),
      api.visitor.guests.list(eventId),
      api.visitor.seating.get(eventId),
    ])
      .then(([evRes, gRes, sRes]) => {
        setEvent(evRes.data);
        setGuests(gRes.data);
        setSeating(sRes.data);
      })
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Create guest map for quick lookup
  const guestMap = useMemo(() => {
    return guests.reduce((acc, g) => ({ ...acc, [g.id]: g }), {});
  }, [guests]);

  // Find table number for a guest
  const findGuestTable = (guestId) => {
    const tables = seating.tables || [];
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      if (table && table.includes(guestId)) {
        return i + 1; // Table numbers are 1-indexed
      }
    }
    return null;
  };

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) {
      setFoundResult(null);
      return;
    }
    
    const searchLower = search.toLowerCase().trim();
    const found = guests.find(g => {
      const fullName = `${g.first_name} ${g.last_name}`.toLowerCase();
      return fullName.includes(searchLower) || 
             g.first_name.toLowerCase().includes(searchLower) ||
             g.last_name.toLowerCase().includes(searchLower);
    });

    if (found) {
      const tableNum = findGuestTable(found.id);
      setFoundResult({ guest: found, tableNumber: tableNum });
    } else {
      setFoundResult({ guest: null, tableNumber: null });
      toast.error('Gast nicht gefunden');
    }
  };

  // Get companions of a guest
  const getCompanions = (guestId) => {
    return guests.filter(g => g.companion_of === guestId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground font-serif text-lg animate-pulse">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="visitor-view-page">
      <VisitorHeader event={event} activeTab="sitzplan" eventId={eventId} />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
            Willkommen bei {event?.name}
          </h1>
          <p className="text-muted-foreground">
            Suchen Sie Ihren Namen, um Ihren Tisch zu finden
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              data-testid="visitor-search-input"
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setFoundResult(null); }}
              placeholder="Ihren Namen eingeben..."
              className="w-full pl-12 pr-24 py-4 rounded-2xl border-2 border-border bg-white text-base focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              data-testid="visitor-search-btn"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Suchen
            </button>
          </div>
        </form>

        {/* Result */}
        {foundResult && foundResult.guest && (
          <div 
            data-testid="visitor-search-result"
            className="bg-white border-2 border-primary rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ background: TYPE_COLORS[foundResult.guest.guest_type] || '#7D8F69' }}
              >
                {foundResult.guest.first_name?.[0]?.toUpperCase()}{foundResult.guest.last_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-xl font-serif font-semibold text-foreground">
                  {foundResult.guest.first_name} {foundResult.guest.last_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {foundResult.guest.guest_type === 'kind' ? 'Kind' : 'Erwachsener'}
                </div>
              </div>
            </div>

            {foundResult.tableNumber ? (
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">Ihr Tisch</div>
                <div className="text-4xl font-serif font-bold text-primary">
                  Tisch {foundResult.tableNumber}
                </div>
              </div>
            ) : (
              <div className="bg-orange-100 rounded-xl p-4 text-center">
                <div className="text-orange-700 text-sm">
                  Noch kein Tisch zugewiesen
                </div>
              </div>
            )}

            {/* Companions */}
            {getCompanions(foundResult.guest.id).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-2">Ihre Begleiter:</div>
                <div className="space-y-2">
                  {getCompanions(foundResult.guest.id).map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ background: TYPE_COLORS[c.guest_type] || '#7D8F69' }}
                      >
                        {c.first_name?.[0]?.toUpperCase()}
                      </div>
                      <span>{c.first_name} {c.last_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {foundResult && !foundResult.guest && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center mb-8">
            <p className="text-orange-700">
              Kein Gast mit diesem Namen gefunden.
            </p>
            <p className="text-sm text-orange-600 mt-1">
              Bitte überprüfen Sie die Schreibweise.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-serif font-semibold text-foreground">{guests.length}</div>
            <div className="text-xs text-muted-foreground">Gäste</div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center">
            <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-serif font-semibold text-foreground">{event?.table_count || 0}</div>
            <div className="text-xs text-muted-foreground">Tische</div>
          </div>
        </div>
      </main>
    </div>
  );
}
