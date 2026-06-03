import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import AdminLogin from '@/pages/AdminLogin';
import AttractionCatalog from '@/pages/AttractionCatalog';
import AttractionMap from '@/pages/AttractionMap';
import GuestPortal from '@/pages/GuestPortal';
import RoutePlanner from '@/pages/RoutePlanner';
import ZoneManagement from '@/pages/ZoneManagement';

const AppRoutes = () => (
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
);

export default AppRoutes;
