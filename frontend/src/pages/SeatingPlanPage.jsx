import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  DndContext, DragOverlay, useDroppable, useDraggable,
  PointerSensor, TouchSensor, useSensors, useSensor
} from '@dnd-kit/core';
import api from '@/api';
import { toast } from 'sonner';
import { Save, FileDown, ArrowLeft, Users, Layout, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─── Draggable Guest Chip ───────────────────────────────────────────
function DraggableGuest({ guest, compact = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: guest.id });
  const initials = `${guest.first_name?.[0] || ''}${guest.last_name?.[0] || ''}`.toUpperCase();

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        title={`${guest.first_name} ${guest.last_name}`}
        style={{ opacity: isDragging ? 0.15 : 1 }}
        className="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold cursor-grab select-none bg-primary hover:bg-primary/90 transition-opacity"
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
      style={{ opacity: isDragging ? 0.15 : 1 }}
      className="flex items-center gap-2.5 px-3 py-2.5 bg-white border border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 cursor-grab select-none transition-all"
      data-testid={`draggable-guest-${guest.id}`}
    >
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <span className="text-sm text-foreground truncate">{guest.first_name} {guest.last_name}</span>
    </div>
  );
}

// ─── Drag Overlay (visual while dragging) ──────────────────────────
function GuestOverlay({ guest }) {
  const initials = `${guest.first_name?.[0] || ''}${guest.last_name?.[0] || ''}`.toUpperCase();
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white border border-primary shadow-xl rounded-xl opacity-95 cursor-grabbing">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
        {initials}
      </div>
      <span className="text-sm text-foreground">{guest.first_name} {guest.last_name}</span>
    </div>
  );
}

// ─── Droppable Seat ────────────────────────────────────────────────
function DroppableSeat({ id, guest, size, style }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const half = size / 2;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: style.x - half,
        top: style.y - half,
        width: size,
        height: size,
        borderRadius: '50%',
        border: isOver ? '2px solid #C5A059' : guest ? '2px solid #7D8F69' : '2px dashed #C0C0BB',
        background: isOver ? 'rgba(197,160,89,0.12)' : guest ? 'rgba(125,143,105,0.12)' : '#F7F7F5',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      data-testid={`seat-${id}`}
    >
      {guest && <DraggableGuest guest={guest} compact={true} />}
    </div>
  );
}

// ─── Round Table ──────────────────────────────────────────────────
function RoundTable({ tableIndex, seats, guestMap, containerSize }) {
  const cx = containerSize / 2;
  const cy = containerSize / 2;
  const tableR = Math.min(58, containerSize * 0.22);
  const seatCount = seats.length;
  const seatSize = Math.max(28, Math.min(38, Math.floor(160 / seatCount)));
  const seatDist = tableR + seatSize / 2 + 6;

  const seatPositions = seats.map((_, i) => {
    const angle = (2 * Math.PI / seatCount) * i - Math.PI / 2;
    return { x: cx + seatDist * Math.cos(angle), y: cy + seatDist * Math.sin(angle) };
  });

  return (
    <div style={{ position: 'relative', width: containerSize, height: containerSize, flexShrink: 0 }}>
      {/* Table circle */}
      <div style={{
        position: 'absolute',
        left: cx - tableR, top: cy - tableR,
        width: tableR * 2, height: tableR * 2,
        borderRadius: '50%',
        background: '#FDF6E3',
        border: '2px solid #C5A059',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8B6914', fontFamily: 'Manrope, sans-serif' }}>
          Tisch {tableIndex + 1}
        </span>
      </div>

      {/* Seats */}
      {seats.map((guestId, seatIdx) => (
        <DroppableSeat
          key={`seat-${tableIndex}-${seatIdx}`}
          id={`seat-${tableIndex}-${seatIdx}`}
          guest={guestId ? guestMap[guestId] : null}
          size={seatSize}
          style={seatPositions[seatIdx]}
        />
      ))}
    </div>
  );
}

// ─── Droppable Unassigned Zone ────────────────────────────────────
function UnassignedZone({ guests }) {
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
          {guests.map(g => <DraggableGuest key={g.id} guest={g} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function SeatingPlanPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeId, setActiveId] = useState(null);

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
          const adjusted = Array.from({ length: ev.seats_per_table }, (_, s) => row[s] || null);
          return adjusted;
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

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const guestId = active.id;
    const dest = over.id;

    const newTables = tables.map(row => [...row]);

    // Find source seat
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

  const containerSize = 240;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-serif animate-pulse">Laden...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="seating-plan-page">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-3 flex items-center gap-4 sticky top-0 z-50">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-2">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Layout className="w-3 h-3 text-white" />
          </div>
          <span className="font-serif text-lg truncate max-w-[200px]">{event?.name}</span>
        </div>
        <nav className="flex gap-1">
          <Link to={`/event/${eventId}/gaeste`} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Gäste
          </Link>
          <Link to={`/event/${eventId}/tischplan`} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white transition-colors flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> Tischplan
          </Link>
          <Link to={`/event/${eventId}/export`} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5" /> Export
          </Link>
        </nav>
        <div className="flex items-center gap-2 ml-2">
          {hasChanges && <span className="text-xs text-accent font-medium">Ungespeicherte Änderungen</span>}
          <button
            data-testid="save-seating-btn"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
          <button
            data-testid="export-btn"
            onClick={() => navigate(`/event/${eventId}/export`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border text-foreground rounded-xl text-sm hover:bg-secondary transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

          {/* Left Sidebar: Unassigned Guests */}
          <div className="w-72 flex-shrink-0 bg-white border-r border-border flex flex-col" data-testid="unassigned-panel">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-serif text-base">Nicht platziert</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unassigned.length} von {guests.length} Gästen
              </p>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col px-3 py-3">
              <UnassignedZone guests={unassigned} />
            </div>
            <div className="px-4 py-3 border-t border-border bg-background">
              <div className="text-xs text-muted-foreground">
                {assignedIds.size} platziert · {unassigned.length} offen · {tables.flat().filter(s => !s).length} freie Plätze
              </div>
            </div>
          </div>

          {/* Right: Table Grid */}
          <div className="flex-1 overflow-auto p-6" data-testid="tables-grid">
            {tables.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Keine Tische konfiguriert
              </div>
            ) : (
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${containerSize}px, 1fr))` }}>
                {tables.map((seats, tIdx) => (
                  <div key={tIdx} className="flex flex-col items-center animate-fade-in-up" data-testid={`table-${tIdx}`}>
                    <RoundTable
                      tableIndex={tIdx}
                      seats={seats}
                      guestMap={guestMap}
                      containerSize={containerSize}
                    />
                    <div className="mt-1 text-xs text-muted-foreground">
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
