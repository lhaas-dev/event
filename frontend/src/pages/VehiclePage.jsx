import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Trash2, Users, Settings, FileDown, Layout,
  CheckCircle2, UtensilsCrossed, Briefcase, Car, Calendar, Clock, Phone, User, Check, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

function TestDriveCard({ drive, onDelete }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  const statusLabels = {
    pending: 'Ausstehend',
    confirmed: 'Bestätigt',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="bg-white border border-border rounded-xl p-4 hover:shadow-md transition-shadow" data-testid={`test-drive-${drive.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-foreground">
              {drive.guest?.first_name} {drive.guest?.last_name}
            </div>
            <div className="text-sm text-muted-foreground">
              {drive.vehicle_model?.name || 'Unbekanntes Modell'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[drive.status] || statusColors.pending}`}>
            {statusLabels[drive.status] || 'Ausstehend'}
          </span>
          <button
            onClick={() => onDelete(drive.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(drive.preferred_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{drive.preferred_time}</span>
        </div>
        {drive.phone && (
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <Phone className="w-4 h-4" />
            <span>{drive.phone}</span>
          </div>
        )}
      </div>
      {drive.notes && (
        <div className="mt-2 pt-2 border-t border-border text-sm text-muted-foreground">
          {drive.notes}
        </div>
      )}
    </div>
  );
}

export default function VehiclePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedGuest, setSelectedGuest] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Model management
  const [newModelName, setNewModelName] = useState('');
  const [addingModel, setAddingModel] = useState(false);
  const [showModelSettings, setShowModelSettings] = useState(false);

  useEffect(() => {
    Promise.all([
      api.events.get(eventId),
      api.guests.list(eventId),
      api.vehicleModels.list(eventId),
      api.testDrives.list(eventId),
    ])
      .then(([evRes, gRes, mRes, tRes]) => {
        setEvent(evRes.data);
        setGuests(gRes.data);
        setVehicleModels(mRes.data);
        setTestDrives(tRes.data);
      })
      .catch(() => toast.error('Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Auto-fill phone when guest is selected
  useEffect(() => {
    if (selectedGuest) {
      const guest = guests.find(g => g.id === selectedGuest);
      if (guest?.phone) setPhone(guest.phone);
    }
  }, [selectedGuest, guests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGuest) { toast.error('Bitte Gast auswählen'); return; }
    if (!selectedModel) { toast.error('Bitte Fahrzeugmodell auswählen'); return; }
    if (!preferredDate || preferredDate.length !== 10) { toast.error('Bitte Datum im Format TT/MM/JJJJ eingeben'); return; }
    if (!preferredTime) { toast.error('Bitte Uhrzeit auswählen'); return; }
    
    // Validate and convert date from DD/MM/YYYY to YYYY-MM-DD for storage
    const dateParts = preferredDate.split('/');
    if (dateParts.length !== 3) { toast.error('Ungültiges Datumsformat'); return; }
    const [day, month, year] = dateParts;
    if (parseInt(day) > 31 || parseInt(month) > 12) { toast.error('Ungültiges Datum'); return; }
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    setSubmitting(true);
    try {
      const res = await api.testDrives.add(eventId, {
        guest_id: selectedGuest,
        vehicle_model_id: selectedModel,
        phone: phone.trim(),
        preferred_date: isoDate,
        preferred_time: preferredTime,
        notes: notes.trim(),
      });
      setTestDrives(prev => [res.data, ...prev]);
      // Reset form
      setSelectedGuest('');
      setSelectedModel('');
      setPhone('');
      setPreferredDate('');
      setPreferredTime('');
      setNotes('');
      toast.success('Probefahrt-Anfrage gespeichert!');
    } catch { toast.error('Fehler beim Speichern'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteDrive = async (driveId) => {
    if (!window.confirm('Probefahrt-Anfrage wirklich löschen?')) return;
    try {
      await api.testDrives.delete(eventId, driveId);
      setTestDrives(prev => prev.filter(d => d.id !== driveId));
      toast.success('Probefahrt-Anfrage gelöscht');
    } catch { toast.error('Fehler beim Löschen'); }
  };

  const handleAddModel = async (e) => {
    e.preventDefault();
    if (!newModelName.trim()) { toast.error('Bitte Modellname eingeben'); return; }
    setAddingModel(true);
    try {
      const res = await api.vehicleModels.add(eventId, { name: newModelName.trim() });
      setVehicleModels(prev => [...prev, res.data]);
      setNewModelName('');
      toast.success('Modell hinzugefügt');
    } catch { toast.error('Fehler beim Hinzufügen'); }
    finally { setAddingModel(false); }
  };

  const handleDeleteModel = async (modelId) => {
    if (!window.confirm('Modell wirklich löschen?')) return;
    try {
      await api.vehicleModels.delete(eventId, modelId);
      setVehicleModels(prev => prev.filter(m => m.id !== modelId));
      toast.success('Modell gelöscht');
    } catch { toast.error('Fehler beim Löschen'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-serif animate-pulse">Laden...</div>;

  const selectedGuestData = guests.find(g => g.id === selectedGuest);

  return (
    <div className="min-h-screen bg-background" data-testid="vehicle-page">
      <NavBar event={event} activeTab="fahrzeug" />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Lead Form */}
          <div className="space-y-6">
            <div className="bg-white border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-serif text-xl">Probefahrt anfragen</h2>
                  <p className="text-sm text-muted-foreground">Lead-Formular für Interessenten</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Guest Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Gast auswählen *</label>
                  <select
                    data-testid="guest-select"
                    value={selectedGuest}
                    onChange={e => setSelectedGuest(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">– Gast wählen –</option>
                    {guests.filter(g => !g.is_staff).map(g => (
                      <option key={g.id} value={g.id}>
                        {g.salutation ? `${g.salutation} ` : ''}{g.first_name} {g.last_name}
                        {g.email ? ` (${g.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Guest Info */}
                {selectedGuestData && (
                  <div className="bg-blue-50 rounded-xl p-3 text-sm">
                    <div className="flex items-center gap-2 text-blue-700">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{selectedGuestData.salutation} {selectedGuestData.first_name} {selectedGuestData.last_name}</span>
                    </div>
                    {selectedGuestData.email && (
                      <div className="text-blue-600 mt-1 ml-6">{selectedGuestData.email}</div>
                    )}
                  </div>
                )}

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Telefonnummer</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      data-testid="phone-input"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+41 79 123 45 67"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Vehicle Model */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-foreground">Fahrzeugmodell *</label>
                    <button
                      type="button"
                      onClick={() => setShowModelSettings(!showModelSettings)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {showModelSettings ? 'Schliessen' : 'Modelle verwalten'}
                    </button>
                  </div>
                  <select
                    data-testid="model-select"
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">– Modell wählen –</option>
                    {vehicleModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Model Settings */}
                {showModelSettings && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="text-sm font-medium text-foreground">Fahrzeugmodelle</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newModelName}
                        onChange={e => setNewModelName(e.target.value)}
                        placeholder="Neues Modell..."
                        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddModel}
                        disabled={addingModel}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {vehicleModels.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-2">Noch keine Modelle</div>
                    ) : (
                      <div className="space-y-1">
                        {vehicleModels.map(m => (
                          <div key={m.id} className="flex items-center justify-between px-2 py-1.5 bg-white rounded-lg">
                            <span className="text-sm">{m.name}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteModel(m.id)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Gewünschtes Datum * (TT/MM/JJJJ)</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        data-testid="date-input"
                        type="text"
                        value={preferredDate}
                        onChange={e => {
                          let val = e.target.value.replace(/[^\d/]/g, '');
                          // Auto-add slashes
                          if (val.length === 2 && !val.includes('/')) val += '/';
                          if (val.length === 5 && val.split('/').length === 2) val += '/';
                          if (val.length <= 10) setPreferredDate(val);
                        }}
                        placeholder="TT/MM/JJJJ"
                        maxLength={10}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Gewünschte Zeit *</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        data-testid="time-input"
                        type="time"
                        value={preferredTime}
                        onChange={e => setPreferredTime(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Notizen</label>
                  <textarea
                    data-testid="notes-input"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Zusätzliche Informationen..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  data-testid="submit-test-drive-btn"
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {submitting ? 'Wird gespeichert...' : 'Probefahrt bestätigen'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Test Drive Requests List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg">Probefahrt-Anfragen</h2>
              <span className="text-sm text-muted-foreground">{testDrives.length} Anfragen</span>
            </div>

            {testDrives.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center">
                <Car className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Noch keine Probefahrt-Anfragen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testDrives.map(drive => (
                  <TestDriveCard key={drive.id} drive={drive} onDelete={handleDeleteDrive} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
