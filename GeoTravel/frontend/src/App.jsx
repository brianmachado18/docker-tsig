import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import ZoneManagement from './pages/ZoneManagement';
import AttractionCatalog from './pages/AttractionCatalog';
import AttractionMap from './pages/AttractionMap';
import RoutePlanner from './pages/RoutePlanner';
import GuestPortal from './pages/GuestPortal';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/guest" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route
          path="/zones"
          element={
            <ProtectedRoute>
              <ZoneManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attractions"
          element={
            <ProtectedRoute>
              <AttractionCatalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attractions/map"
          element={
            <ProtectedRoute>
              <AttractionMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/routes"
          element={
            <ProtectedRoute>
              <RoutePlanner />
            </ProtectedRoute>
          }
        />
        <Route path="/guest" element={<GuestPortal />} />
        <Route path="*" element={<GuestPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
