import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import { MapPin, UtensilsCrossed, Wine, Layout, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const CATEGORY_CONFIG = {
  essen: { label: 'Essen', icon: UtensilsCrossed, color: '#7D8F69' },
  getraenke: { label: 'Getränke', icon: Wine, color: '#3B82F6' },
};

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

function MenuItemCard({ item }) {
  const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.essen;
  const Icon = config.icon;

  return (
    <div className="bg-white border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${config.color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground">{item.name}</span>
            {item.price !== null && item.price !== undefined && (
              <span className="text-sm font-semibold text-primary whitespace-nowrap">
                {item.price.toFixed(2)} €
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          )}
          {item.allergens && (
            <p className="text-xs text-orange-600 mt-2">Allergene: {item.allergens}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VisitorMenuPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.visitor.events.get(eventId),
      api.visitor.menu.get(eventId),
    ])
      .then(([evRes, menuRes]) => {
        setEvent(evRes.data);
        setMenuItems(menuRes.data);
      })
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground font-serif text-lg animate-pulse">Laden...</div>
      </div>
    );
  }

  const essenItems = menuItems.filter(i => i.category === 'essen');
  const getraenkeItems = menuItems.filter(i => i.category === 'getraenke');

  return (
    <div className="min-h-screen bg-background" data-testid="visitor-menu-page">
      <VisitorHeader event={event} activeTab="menu" eventId={eventId} />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-2">Menü</h1>
          <p className="text-muted-foreground">
            {event?.name}
          </p>
        </div>

        {menuItems.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-12 text-center">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Noch kein Menü verfügbar</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Essen Section */}
            {essenItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <UtensilsCrossed className="w-5 h-5 text-[#7D8F69]" />
                  <h2 className="font-serif text-xl text-foreground">Essen</h2>
                  <span className="text-sm text-muted-foreground">({essenItems.length})</span>
                </div>
                <div className="space-y-3">
                  {essenItems.map(item => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Getränke Section */}
            {getraenkeItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Wine className="w-5 h-5 text-[#3B82F6]" />
                  <h2 className="font-serif text-xl text-foreground">Getränke</h2>
                  <span className="text-sm text-muted-foreground">({getraenkeItems.length})</span>
                </div>
                <div className="space-y-3">
                  {getraenkeItems.map(item => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
