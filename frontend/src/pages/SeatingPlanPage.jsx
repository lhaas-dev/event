import { useState, useEffect, useCallback, Fragment } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  DndContext, DragOverlay, useDroppable, useDraggable,
  PointerSensor, TouchSensor, useSensors, useSensor
} from '@dnd-kit/core';
import api from '@/api';
import { toast } from 'sonner';
import { Save, FileDown, ArrowLeft, Users, Layout, Settings, PanelLeftClose, PanelLeftOpen, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─── Type colors ───────────────────────────────────────────────────
const seatBg = (guest) => {
  if (guest?.is_staff) return '#D97706'; // Amber for staff
  return guest?.guest_type === 'kind' ? '#3B82F6' : '#7D8F69';
};
const seatBorder = (guest) => {
  if (guest?.is_staff) return '#B45309'; // Darker amber for staff
  return guest?.guest_type === 'kind' ? '#2563EB' : '#5F7050';
};

// ─── Draggable Guest Chip ───────────────────────────────────────────
function DraggableGuest({ guest, compact = false, guestMap }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: guest.id });
  const initials = `${guest.first_name?.[0] || ''}${guest.last_name?.[0] || ''}`.toUpperCase();
  const typeLabel = guest.is_staff ? 'MA' : (guest.guest_type === 'kind' ? 'Kind' : 'Erw.');
  const companionName = guest.companion_of && guestMap?.[guest.companion_of]
    ? `${guestMap[guest.companion_of].first_name} ${guestMap[guest.companion_of].last_name}`
    : null;

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        title={`${guest.first_name} ${guest.last_name}${guest.is_staff ? ' (Mitarbeiter)' : ''}${companionName ? ' (Begl. v. ' + companionName + ')' : ''}`}
        style={{ opacity: isDragging ? 0.1 : 1, background: seatBg(guest) }}
        className="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold cursor-grab select-none transition-opacity"
        data-testid={`draggable-guest-${guest.id}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.1 : 1 }}
      className={`flex items-center gap-2.5 px-3 py-2.5 bg-white border rounded-xl hover:border-primary/40 hover:bg-primary/5 cursor-grab select-none transition-all ${guest.is_staff ? 'border-amber-300' : 'border-border'}`}
      data-testid={`draggable-guest-${guest.id}`}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: seatBg(guest) }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-foreground truncate">{guest.first_name} {guest.last_name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
            style={{ background: seatBg(guest) }}
          >
            {typeLabel}
          </span>
          {companionName && (
            <span className="text-[10px] text-muted-foreground truncate">Begl. v. {companionName}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drag Overlay ──────────────────────────────────────────────────
function GuestOverlay({ guest }) {
  const initials = `${guest.first_name?.[0] || ''}${guest.last_name?.[0] || ''}`.toUpperCase();
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white border border-primary shadow-xl rounded-xl opacity-95 cursor-grabbing">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ background: seatBg(guest) }}
      >
        {initials}
      </div>
      <span className="text-sm text-foreground">{guest.first_name} {guest.last_name}</span>
      {guest.is_staff && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">MA</span>}
    </div>
  );
}

// ─── Droppable Seat ────────────────────────────────────────────────
function DroppableSeat({ id, guest, size, guestMap }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const hasGuest = !!guest;

  return (
    <div
      ref={setNodeRef}
      data-testid={`seat-${id}`}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        border: isOver ? '2px solid #C5A059' : hasGuest ? `2px solid ${seatBorder(guest)}` : '2px dashed #C0C0BB',
        background: isOver ? 'rgba(197,160,89,0.12)' : hasGuest ? `${seatBg(guest)}18` : '#F7F7F5',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {guest && <DraggableGuest guest={guest} compact={true} guestMap={guestMap} />}
    </div>
  );
}

// ─── Round Table with full names ──────────────────────────────────
const CONTAINER = 300;

function RoundTable({ tableIndex, seats, guestMap }) {
  const cx = CONTAINER / 2;
  const cy = CONTAINER / 2;
  const tableR = 62;
  const seatCount = seats.length;
  const seatSize = Math.max(28, Math.min(36, Math.floor(140 / seatCount)));
  const seatHalf = seatSize / 2;
  const seatDist = tableR + seatHalf + 8;
  const labelDist = seatDist + seatHalf + 16;

  return (
    <div style={{ position: 'relative', width: CONTAINER, height: CONTAINER, flexShrink: 0 }}>
      {/* Table circle */}
      <div style={{
        position: 'absolute',
        left: cx - tableR, top: cy - tableR,
        width: tableR * 2, height: tableR * 2,
        borderRadius: '50%', background: '#FDF6E3', border: '2px solid #C5A059',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8B6914', fontFamily: 'Manrope,sans-serif' }}>
          Tisch {tableIndex + 1}
        </span>
      </div>

      {seats.map((guestId, seatIdx) => {
        const angle = (2 * Math.PI / seatCount) * seatIdx - Math.PI / 2;
        const sx = cx + seatDist * Math.cos(angle);
        const sy = cy + seatDist * Math.sin(angle);
        const lx = cx + labelDist * Math.cos(angle);
        const ly = cy + labelDist * Math.sin(angle);
        const guest = guestId ? guestMap[guestId] : null;

        return (
          <Fragment key={seatIdx}>
            {/* Seat */}
            <div style={{ position: 'absolute', left: sx - seatHalf, top: sy - seatHalf, zIndex: 3 }}>
              <DroppableSeat
                id={`seat-${tableIndex}-${seatIdx}`}
                guest={guest}
                size={seatSize}
                guestMap={guestMap}
              />
            </div>

            {/* Name label – radially outward */}
            {guest && (
              <div
                style={{
                  position: 'absolute',
                  left: lx - 46,
                  top: ly - 13,
                  width: 92,
                  pointerEvents: 'none',
                  zIndex: 2,
                  textAlign: 'center',
                  lineHeight: 1.25,
                }}
              >
                <span style={{ fontSize: 8, color: '#1A1A1A', fontFamily: 'Manrope,sans-serif', fontWeight: 500 }}>
                  {guest.first_name} {guest.last_name}
                </span>
              <div style={{ fontSize: 7, color: guest.is_staff ? '#D97706' : '#3B82F6', marginTop: 1, fontWeight: 600 }}>
                                  {guest.is_staff ? 'Mitarbeiter' : (guest.guest_type === 'kind' ? 'Kind' : '')}
                                </div>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ─── Droppable Unassigned Zone ─────────────────────────────────────
function UnassignedZone({ guests, guestMap }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' });
  return (
    <div
      ref={setNodeRef}
      style={{ flex: 1, overflowY: 'auto', transition: 'background 0.15s', background: isOver ? 'rgba(125,143,105,0.04)' : 'transparent', borderRadius: 12, padding: 4 }}
      data-testid="unassigned-zone"
    >
      {guests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center px-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">Alle Gäste platziert!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {guests.map(g => <DraggableGuest key={g.id} guest={g} guestMap={guestMap} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function SeatingPlanPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  useEffect(() => {
    Promise.all([api.events.get(eventId), api.guests.list(eventId), api.seating.get(eventId)])
      .then(([evRes, gRes, sRes]) => {
        const ev = evRes.data;
        const gs = gRes.data;
        const saved = sRes.data.tables || [];
        setEvent(ev);
        setGuests(gs);
        const merged = Array.from({ length: ev.table_count }, (_, i) => {
          const row = saved[i] || [];
          return Array.from({ length: ev.seats_per_table }, (_, s) => row[s] || null);
        });
        setTables(merged);
      })
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const guestMap = guests.reduce((acc, g) => ({ ...acc, [g.id]: g }), {});
  const assignedIds = new Set(tables.flat().filter(Boolean));
  const unassigned = guests.filter(g => !assignedIds.has(g.id));
  const activeGuest = activeId ? guestMap[activeId] : null;

  const handleDragStart = (e) => setActiveId(e.active.id);

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const guestId = active.id;
    const dest = over.id;
    const newTables = tables.map(row => [...row]);
    let srcT = -1, srcS = -1;
    outer: for (let t = 0; t < newTables.length; t++) {
      for (let s = 0; s < newTables[t].length; s++) {
        if (newTables[t][s] === guestId) { srcT = t; srcS = s; break outer; }
      }
    }
    if (dest === 'unassigned') {
      if (srcT >= 0) newTables[srcT][srcS] = null;
    } else if (dest.startsWith('seat-')) {
      const parts = dest.split('-');
      const dT = parseInt(parts[1]);
      const dS = parseInt(parts[2]);
      if (isNaN(dT) || isNaN(dS)) return;
      const swap = newTables[dT][dS];
      newTables[dT][dS] = guestId;
      if (srcT >= 0) newTables[srcT][srcS] = swap || null;
    } else return;
    setTables(newTables);
    setHasChanges(true);
  }, [tables]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.seating.save(eventId, { tables });
      setHasChanges(false);
      toast.success('Tischplan gespeichert!');
    } catch {
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-serif animate-pulse">Laden...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="seating-plan-page">
      <header className="bg-white border-b border-border px-3 md:px-6 py-3 flex items-center gap-2 md:gap-4 sticky top-0 z-50">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline text-sm">Dashboard</span>
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><Layout className="w-3 h-3 text-white" /></div>
          <span className="font-serif text-base md:text-lg truncate max-w-[140px] md:max-w-[220px]">{event?.name}</span>
        </div>
        <nav className="flex gap-0.5 md:gap-1">
          <Link to={`/event/${eventId}/gaeste`} className="px-2 md:px-3 py-2 rounded-xl text-xs md:text-sm font-medium text-muted-foreground hover:bg-secondary flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /><span className="hidden lg:inline"> Gäste</span>
          </Link>
          <Link to={`/event/${eventId}/tischplan`} className="px-2 md:px-3 py-2 rounded-xl text-xs md:text-sm font-medium bg-primary text-white flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" /><span className="hidden lg:inline"> Tischplan</span>
          </Link>
          <Link to={`/event/${eventId}/einlass`} className="px-2 md:px-3 py-2 rounded-xl text-xs md:text-sm font-medium text-muted-foreground hover:bg-secondary flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /><span className="hidden lg:inline"> Einlass</span>
          </Link>
          <Link to={`/event/${eventId}/export`} className="px-2 md:px-3 py-2 rounded-xl text-xs md:text-sm font-medium text-muted-foreground hover:bg-secondary flex items-center gap-1">
            <FileDown className="w-3.5 h-3.5" /><span className="hidden lg:inline"> Export</span>
          </Link>
        </nav>
        <div className="flex items-center gap-1 md:gap-2 ml-1">
          {hasChanges && <span className="text-[10px] md:text-xs text-accent font-medium animate-pulse hidden sm:inline">Ungespeichert</span>}
          <button
            data-testid="save-seating-btn"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-primary text-white rounded-xl text-xs md:text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{saving ? 'Speichern...' : 'Speichern'}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Sidebar with toggle */}
          <div
            className={`flex-shrink-0 bg-white border-r border-border flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64 md:w-72' : 'w-12'}`}
            data-testid="unassigned-panel"
          >
            {/* Sidebar header with toggle */}
            <div className={`border-b border-border flex items-center ${sidebarOpen ? 'px-4 py-4 justify-between' : 'px-2 py-4 justify-center'}`}>
              {sidebarOpen && (
                <div>
                  <h2 className="font-serif text-sm">Nicht platziert</h2>
                  <p className="text-[10px] text-muted-foreground">{unassigned.length}/{guests.length}</p>
                </div>
              )}
              <button
                data-testid="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title={sidebarOpen ? 'Sidebar schließen' : 'Sidebar öffnen'}
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
            </div>

            {sidebarOpen && (
              <>
                <div className="flex gap-3 px-4 py-2 border-b border-border/50">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#7D8F69' }} /> Erw.
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#3B82F6' }} /> Kind
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#D97706' }} /> MA
                  </span>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col px-3 py-3">
                  <UnassignedZone guests={unassigned} guestMap={guestMap} />
                </div>
                <div className="px-4 py-2 border-t border-border bg-background">
                  <div className="text-[10px] text-muted-foreground">
                    {assignedIds.size} platziert · {unassigned.length} offen
                  </div>
                </div>
              </>
            )}

            {!sidebarOpen && (
              <div className="flex-1 flex flex-col items-center py-3 gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{unassigned.length}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tables Grid */}
          <div className="flex-1 overflow-auto p-3 md:p-6" data-testid="tables-grid">
            {tables.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">Keine Tische konfiguriert</div>
            ) : (
              <div className="grid gap-2 md:gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${CONTAINER}px, 1fr))` }}>
                {tables.map((seats, tIdx) => (
                  <div key={tIdx} className="flex flex-col items-center" data-testid={`table-${tIdx}`}>
                    <RoundTable tableIndex={tIdx} seats={seats} guestMap={guestMap} />
                    <div className="text-xs text-muted-foreground -mt-2">
                      {seats.filter(Boolean).length}/{seats.length} Plätze
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DragOverlay dropAnimation={{ duration: 150 }}>
            {activeGuest && <GuestOverlay guest={activeGuest} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
