import '@/App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import GuestsPage from '@/pages/GuestsPage';
import StaffPage from '@/pages/StaffPage';
import SeatingPlanPage from '@/pages/SeatingPlanPage';
import ExportPage from '@/pages/ExportPage';
import AdminPage from '@/pages/AdminPage';
import CheckinPage from '@/pages/CheckinPage';
import MenuPage from '@/pages/MenuPage';
import VehiclePage from '@/pages/VehiclePage';
import VisitorViewPage from '@/pages/VisitorViewPage';
import VisitorMenuPage from '@/pages/VisitorMenuPage';
import SettingsPage from '@/pages/SettingsPage';
import api from '@/api';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground font-serif text-lg animate-pulse">Laden...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function VisitorRoute({ children }) {
  const { user, loading, isVisitor } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  // Visitors can only access visitor routes
  return children;
}

function AppRoutes() {
  const { user, isVisitor } = useAuth();
  
  // Redirect visitors to their special view
  if (user && isVisitor) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/besucher-events" replace />} />
        <Route path="/besucher-events" element={<VisitorRoute><VisitorEventList /></VisitorRoute>} />
        <Route path="/besucher/:eventId" element={<VisitorRoute><VisitorViewPage /></VisitorRoute>} />
        <Route path="/besucher/:eventId/menu" element={<VisitorRoute><VisitorMenuPage /></VisitorRoute>} />
        <Route path="*" element={<Navigate to="/besucher-events" replace />} />
      </Routes>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/event/:eventId/gaeste" element={<ProtectedRoute><GuestsPage /></ProtectedRoute>} />
      <Route path="/event/:eventId/mitarbeiter" element={<ProtectedRoute><StaffPage /></ProtectedRoute>} />
      <Route path="/event/:eventId/fahrzeug" element={<ProtectedRoute><VehiclePage /></ProtectedRoute>} />
      <Route path="/event/:eventId/tischplan" element={<ProtectedRoute><SeatingPlanPage /></ProtectedRoute>} />
      <Route path="/event/:eventId/einlass" element={<ProtectedRoute><CheckinPage /></ProtectedRoute>} />
      <Route path="/event/:eventId/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
      <Route path="/event/:eventId/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
      {/* Admin can preview visitor view */}
      <Route path="/besucher/:eventId" element={<ProtectedRoute><VisitorViewPage /></ProtectedRoute>} />
      <Route path="/besucher/:eventId/menu" element={<ProtectedRoute><VisitorMenuPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Simple event list for visitors
function VisitorEventList() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    api.visitor.events.list()
      .then(res => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground font-serif text-lg animate-pulse">Laden...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="font-serif text-xl">Veranstaltungen</h1>
        <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-muted-foreground hover:text-foreground">Abmelden</button>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">Keine Veranstaltungen verfügbar</div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <a
                key={event.id}
                href={`/besucher/${event.id}`}
                className="block bg-white border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="font-serif text-lg">{event.name}</div>
                <div className="text-sm text-muted-foreground mt-1">{event.guest_count} Gäste</div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
