import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Edit2, FileStack, Check, X, Mail, Layout } from 'lucide-react';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="bg-white border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/settings')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Einstellungen
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Layout className="w-4 h-4 text-white" />
        </div>
        <span className="font-serif text-xl text-foreground">E-Mail-Vorlagen</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.username}</span>
        <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-muted-foreground hover:text-foreground">
          Abmelden
        </button>
      </div>
    </header>
  );
}

function TemplateRow({ template, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-border/50 hover:bg-background transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <FileStack className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm text-foreground truncate">{template.name}</div>
          <div className="text-xs text-muted-foreground truncate">{template.subject}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(template)}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TemplateForm({ template, onSave, onCancel }) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Bitte Namen eingeben'); return; }
    if (!subject.trim()) { toast.error('Bitte Betreff eingeben'); return; }
    if (!body.trim()) { toast.error('Bitte Nachricht eingeben'); return; }
    
    setSaving(true);
    await onSave({ name: name.trim(), subject: subject.trim(), body });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Vorlagenname</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="z.B. Einladung Standard"
          className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Betreff</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Einladung zu unserem Event"
          className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Nachricht</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="{persoenliche_anrede},&#10;&#10;wir laden Sie herzlich zu unserem Event ein...&#10;&#10;Mit freundlichen Grüßen"
          rows={8}
          className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Verfügbare Platzhalter: {'{anrede}'}, {'{vorname}'}, {'{nachname}'}, {'{name}'}, {'{persoenliche_anrede}'}
        </p>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-border text-muted-foreground rounded-xl text-sm font-medium hover:bg-secondary transition-all flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" /> Abbrechen
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" /> {saving ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchTemplates = async () => {
    try {
      const res = await api.emailTemplates.list();
      setTemplates(res.data);
    } catch {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = async (data) => {
    try {
      const res = await api.emailTemplates.create(data);
      setTemplates(prev => [...prev, res.data]);
      setShowForm(false);
      toast.success('Vorlage erstellt');
    } catch {
      toast.error('Fehler beim Erstellen');
    }
  };

  const handleUpdate = async (data) => {
    try {
      const res = await api.emailTemplates.update(editingTemplate.id, data);
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? res.data : t));
      setEditingTemplate(null);
      toast.success('Vorlage aktualisiert');
    } catch {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Vorlage wirklich löschen?')) return;
    try {
      await api.emailTemplates.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Vorlage gelöscht');
    } catch {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="email-templates-page">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-foreground">E-Mail-Vorlagen</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Erstellen und verwalten Sie Vorlagen für Ihre E-Mails
            </p>
          </div>
          {!showForm && !editingTemplate && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" /> Neue Vorlage
            </button>
          )}
        </div>

        {(showForm || editingTemplate) && (
          <div className="bg-white border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-serif text-lg mb-4">
              {editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}
            </h2>
            <TemplateForm
              template={editingTemplate}
              onSave={editingTemplate ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingTemplate(null); }}
            />
          </div>
        )}

        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-4 border-b border-border flex items-center gap-2">
            <FileStack className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-serif text-lg">Vorlagen ({templates.length})</h2>
          </div>

          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm mb-4">Noch keine Vorlagen vorhanden.</p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
                >
                  <Plus className="w-4 h-4" /> Erste Vorlage erstellen
                </button>
              )}
            </div>
          ) : (
            templates.map(template => (
              <TemplateRow
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
