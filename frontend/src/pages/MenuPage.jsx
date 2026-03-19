import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Trash2, Edit2, Check, X,
  Users, Settings, FileDown, Layout, CheckCircle2, UtensilsCrossed, Wine
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const CATEGORY_CONFIG = {
  essen: { label: 'Essen', icon: UtensilsCrossed, color: '#7D8F69' },
  getraenke: { label: 'Getränke', icon: Wine, color: '#3B82F6' },
};

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

function MenuItemRow({ item, onDelete, onEdit }) {
  const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.essen;
  const Icon = config.icon;

  return (
    <div
      data-testid={`menu-item-${item.id}`}
      className="flex items-start gap-4 px-4 py-4 bg-white border-b border-border/50 hover:bg-background/50 transition-colors"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `${config.color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{item.name}</span>
          {item.price !== null && item.price !== undefined && (
            <span className="text-sm text-primary font-medium">{item.price.toFixed(2)} €</span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
        )}
        {item.allergens && (
          <p className="text-xs text-orange-600 mt-1">Allergene: {item.allergens}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          data-testid={`edit-menu-item-${item.id}`}
          onClick={() => onEdit(item)}
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          data-testid={`delete-menu-item-${item.id}`}
          onClick={() => onDelete(item.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('essen');
  const [price, setPrice] = useState('');
  const [allergens, setAllergens] = useState('');
  const [adding, setAdding] = useState(false);
  
  // Edit state
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    Promise.all([api.events.get(eventId), api.menu.list(eventId)])
      .then(([evRes, menuRes]) => {
        setEvent(evRes.data);
        setMenuItems(menuRes.data);
      })
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Bitte Name eingeben'); return; }
    setAdding(true);
    try {
      const res = await api.menu.add(eventId, {
        name: name.trim(),
        description: description.trim(),
        category,
        price: price ? parseFloat(price) : null,
        allergens: allergens.trim(),
      });
      setMenuItems(prev => [...prev, res.data]);
      setName(''); setDescription(''); setCategory('essen'); setPrice(''); setAllergens('');
      toast.success('Menüeintrag hinzugefügt');
    } catch { toast.error('Fehler beim Hinzufügen'); }
    finally { setAdding(false); }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Menüeintrag wirklich löschen?')) return;
    try {
      await api.menu.delete(eventId, itemId);
      setMenuItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Menüeintrag gelöscht');
    } catch { toast.error('Fehler beim Löschen'); }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setCategory(item.category);
    setPrice(item.price !== null && item.price !== undefined ? item.price.toString() : '');
    setAllergens(item.allergens || '');
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await api.menu.update(eventId, editingItem.id, {
        name: name.trim(),
        description: description.trim(),
        category,
        price: price ? parseFloat(price) : null,
        allergens: allergens.trim(),
      });
      setMenuItems(prev => prev.map(i => i.id === editingItem.id ? res.data : i));
      setEditingItem(null);
      setName(''); setDescription(''); setCategory('essen'); setPrice(''); setAllergens('');
      toast.success('Menüeintrag aktualisiert');
    } catch { toast.error('Fehler beim Speichern'); }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setName(''); setDescription(''); setCategory('essen'); setPrice(''); setAllergens('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-serif animate-pulse">Laden...</div>;

  const essenItems = menuItems.filter(i => i.category === 'essen');
  const getraenkeItems = menuItems.filter(i => i.category === 'getraenke');

  return (
    <div className="min-h-screen bg-background" data-testid="menu-page">
      <NavBar event={event} activeTab="menu" />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Add/Edit Form */}
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-serif text-lg mb-4">
                {editingItem ? 'Menüeintrag bearbeiten' : 'Menüeintrag hinzufügen'}
              </h2>
              <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-3">
                <input
                  data-testid="menu-name-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Name (z.B. Rinderfilet)"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <textarea
                  data-testid="menu-description-input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Beschreibung (optional)"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Kategorie</label>
                    <select
                      data-testid="menu-category-select"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    >
                      <option value="essen">Essen</option>
                      <option value="getraenke">Getränke</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Preis (€)</label>
                    <input
                      data-testid="menu-price-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <input
                  data-testid="menu-allergens-input"
                  type="text"
                  value={allergens}
                  onChange={e => setAllergens(e.target.value)}
                  placeholder="Allergene (z.B. Gluten, Laktose)"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-2">
                  {editingItem && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 py-3 border border-border text-muted-foreground rounded-xl text-sm font-medium hover:bg-secondary transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Abbrechen
                    </button>
                  )}
                  <button
                    data-testid="add-menu-item-btn"
                    type="submit"
                    disabled={adding}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {editingItem ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingItem ? 'Speichern' : (adding ? 'Hinzufügen...' : 'Hinzufügen')}
                  </button>
                </div>
              </form>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Essen', value: essenItems.length, color: CATEGORY_CONFIG.essen.color },
                { label: 'Getränke', value: getraenkeItems.length, color: CATEGORY_CONFIG.getraenke.color },
              ].map(s => (
                <div key={s.label} className="bg-white border border-border rounded-xl px-4 py-3 text-center">
                  <div className="text-2xl font-serif font-semibold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Menu Lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* Essen */}
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-4 border-b border-border bg-gradient-to-r from-[#7D8F69]/10 to-transparent">
                <UtensilsCrossed className="w-5 h-5 text-[#7D8F69]" />
                <h2 className="font-serif text-lg">Essen</h2>
                <span className="text-sm font-sans text-muted-foreground">({essenItems.length})</span>
              </div>
              {essenItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">Noch keine Speisen vorhanden</p>
                </div>
              ) : (
                essenItems.map(item => (
                  <MenuItemRow key={item.id} item={item} onDelete={handleDeleteItem} onEdit={handleEditItem} />
                ))
              )}
            </div>

            {/* Getränke */}
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-4 border-b border-border bg-gradient-to-r from-[#3B82F6]/10 to-transparent">
                <Wine className="w-5 h-5 text-[#3B82F6]" />
                <h2 className="font-serif text-lg">Getränke</h2>
                <span className="text-sm font-sans text-muted-foreground">({getraenkeItems.length})</span>
              </div>
              {getraenkeItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <Wine className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">Noch keine Getränke vorhanden</p>
                </div>
              ) : (
                getraenkeItems.map(item => (
                  <MenuItemRow key={item.id} item={item} onDelete={handleDeleteItem} onEdit={handleEditItem} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
