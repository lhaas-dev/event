import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import { ArrowLeft, Printer, Download, Users, Settings, Layout, Link2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const TYPE_COLORS = { erwachsener: '#7D8F69', kind: '#3B82F6' };

function ExportTable({ tableIndex, seats, guestMap }) {
  const seatCount = seats.length;
  const svgSize = 280;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const tableR = 58;
  const seatR = Math.max(16, Math.min(24, Math.floor(150 / seatCount)));
  const seatDist = tableR + seatR + 6;
  const labelDist = seatDist + seatR + 14;

  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ overflow: 'visible' }}>
      {/* Table */}
      <circle cx={cx} cy={cy} r={tableR} fill="#FDF6E3" stroke="#C5A059" strokeWidth={2} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fontFamily="Manrope,sans-serif" fontWeight="600" fill="#8B6914">Tisch</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={16} fontFamily="Playfair Display,serif" fontWeight="600" fill="#8B6914">{tableIndex + 1}</text>

      {seats.map((guestId, seatIdx) => {
        const angle = (2 * Math.PI / seatCount) * seatIdx - Math.PI / 2;
        const sx = cx + seatDist * Math.cos(angle);
        const sy = cy + seatDist * Math.sin(angle);
        const lx = cx + labelDist * Math.cos(angle);
        const ly = cy + labelDist * Math.sin(angle);
        const guest = guestId ? guestMap[guestId] : null;
        const color = guest ? (TYPE_COLORS[guest.guest_type] || '#7D8F69') : '#EAE8E4';
        const stroke = guest ? (guest.guest_type === 'kind' ? '#2563EB' : '#5F7050') : '#C5C5C0';

        return (
          <g key={seatIdx}>
            <circle cx={sx} cy={sy} r={seatR} fill={color} stroke={stroke} strokeWidth={1.5} />
            {guest ? (
              <>
                <text x={sx} y={sy + 1} textAnchor="middle" fontSize={7.5} fontFamily="Manrope,sans-serif" fill="white" fontWeight="700" dominantBaseline="middle">
                  {guest.first_name?.[0]}{guest.last_name?.[0]}
                </text>
                {/* Name label radially outward */}
                <text x={lx} y={ly - 5} textAnchor="middle" fontSize={7.5} fontFamily="Manrope,sans-serif" fill="#1A1A1A" fontWeight="500">
                  {guest.first_name}
                </text>
                <text x={lx} y={ly + 5} textAnchor="middle" fontSize={7.5} fontFamily="Manrope,sans-serif" fill="#1A1A1A" fontWeight="500">
                  {guest.last_name}
                </text>
                {guest.guest_type === 'kind' && (
                  <text x={lx} y={ly + 14} textAnchor="middle" fontSize={6} fontFamily="Manrope,sans-serif" fill="#3B82F6" fontWeight="600">Kind</text>
                )}
              </>
            ) : (
              <text x={sx} y={sx + 1} textAnchor="middle" fontSize={10} fontFamily="Manrope,sans-serif" fill="#aaa" dominantBaseline="middle">—</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function ExportPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const exportRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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
  const assignedCount = tables.flat().filter(Boolean).length;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const element = exportRef.current;
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pW = pdf.internal.pageSize.getWidth();
      const pH = pdf.internal.pageSize.getHeight();
      const aspect = canvas.width / canvas.height;
      let iW = pW - 20, iH = iW / aspect;
      if (iH > pH - 20) { iH = pH - 20; iW = iH * aspect; }
      pdf.addImage(imgData, 'PNG', (pW - iW) / 2, (pH - iH) / 2, iW, iH);

      // Page 2: list
      pdf.addPage();
      pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
      pdf.text(event?.name || 'Tischplan', 14, 18);
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
      pdf.text(`${guests.length} Gäste · ${assignedCount} platziert`, 14, 26);
      let yPos = 36;
      const pH2 = pdf.internal.pageSize.getHeight();
      tables.forEach((seats, tIdx) => {
        const occupied = seats.filter(Boolean);
        if (yPos > pH2 - 20) { pdf.addPage(); yPos = 20; }
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
        pdf.text(`Tisch ${tIdx + 1}`, 14, yPos); yPos += 6;
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
        if (occupied.length === 0) { pdf.text('(Leer)', 20, yPos); yPos += 5; }
        else {
          occupied.forEach(gId => {
            const g = guestMap[gId];
            if (g) {
              const type = g.guest_type === 'kind' ? '[K]' : '[E]';
              const companion = g.companion_of && guestMap[g.companion_of]
                ? ` (Begl. v. ${guestMap[g.companion_of].first_name} ${guestMap[g.companion_of].last_name})`
                : '';
              pdf.text(`• ${g.first_name} ${g.last_name} ${type}${companion}`, 20, yPos);
              yPos += 5;
            }
          });
        }
        yPos += 4;
      });

      pdf.save(`Tischplan-${(event?.name || 'Export').replace(/\s+/g, '-')}.pdf`);
      toast.success('PDF heruntergeladen!');
    } catch (err) {
      console.error(err);
      toast.error('PDF Export fehlgeschlagen');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-serif animate-pulse">Laden...</div>;

  return (
    <div className="min-h-screen bg-background" data-testid="export-page">
      <header className="bg-white border-b border-border px-6 py-3 flex items-center gap-4 sticky top-0 z-50 no-print">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-2">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"><Layout className="w-3 h-3 text-white" /></div>
          <span className="font-serif text-lg truncate max-w-[200px]">{event?.name}</span>
        </div>
        <nav className="flex gap-1">
          <Link to={`/event/${eventId}/gaeste`} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Gäste
          </Link>
          <Link to={`/event/${eventId}/tischplan`} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> Tischplan
          </Link>
        </nav>
        <div className="flex gap-2 ml-2">
          <button data-testid="print-btn" onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm text-foreground hover:bg-secondary transition-all">
            <Printer className="w-3.5 h-3.5" /> Drucken
          </button>
          <button data-testid="download-pdf-btn" onClick={handleDownloadPDF} disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50">
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Erstellen...' : 'PDF herunterladen'}
          </button>
        </div>
      </header>

      <div className="p-6">
        <div ref={exportRef} id="export-content" className="bg-white rounded-2xl p-8 max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8 pb-6 border-b border-border">
            <h1 className="text-4xl font-serif text-foreground">{event?.name}</h1>
            <p className="text-muted-foreground text-sm mt-2">
              {tables.length} Tische · {event?.seats_per_table} Plätze/Tisch · {guests.length} Gäste · {assignedCount} platziert
            </p>
            <div className="flex justify-center gap-6 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#7D8F69' }} />
                {guests.filter(g => g.guest_type !== 'kind').length} Erwachsene
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#3B82F6' }} />
                {guests.filter(g => g.guest_type === 'kind').length} Kinder
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link2 className="w-3 h-3" />
                {guests.filter(g => g.companion_of).length} Begleitpersonen
              </span>
            </div>
          </div>

          {/* Graphical Tables */}
          <div className="grid gap-4 mb-10" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }} data-testid="export-tables-grid">
            {tables.map((seats, tIdx) => (
              <div key={tIdx} className="flex flex-col items-center p-4 bg-background rounded-xl border border-border">
                <ExportTable tableIndex={tIdx} seats={seats} guestMap={guestMap} />
                <div className="mt-1 text-xs text-muted-foreground">
                  {seats.filter(Boolean).length}/{seats.length} Plätze besetzt
                </div>
              </div>
            ))}
          </div>

          {/* Text List */}
          <div className="border-t border-border pt-8">
            <h2 className="font-serif text-2xl mb-6">Sitzliste nach Tisch</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="export-list">
              {tables.map((seats, tIdx) => {
                const occupied = seats.map((gId, sIdx) => ({ gId, sIdx })).filter(s => s.gId);
                return (
                  <div key={tIdx} className="border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-accent">{tIdx + 1}</span>
                      </div>
                      <span className="font-medium text-sm">Tisch {tIdx + 1}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{occupied.length}/{seats.length}</span>
                    </div>
                    {occupied.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Noch keine Gäste</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {occupied.map(({ gId }) => {
                          const g = guestMap[gId];
                          if (!g) return null;
                          const companionOf = g.companion_of && guestMap[g.companion_of];
                          return (
                            <li key={gId} className="flex items-start gap-2 text-sm">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-0.5"
                                style={{ background: TYPE_COLORS[g.guest_type] || '#7D8F69' }}
                              >
                                {g.first_name?.[0]}{g.last_name?.[0]}
                              </div>
                              <div>
                                <div>{g.first_name} {g.last_name}</div>
                                {companionOf && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Link2 className="w-2.5 h-2.5" />
                                    Begl. v. {companionOf.first_name} {companionOf.last_name}
                                  </div>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
