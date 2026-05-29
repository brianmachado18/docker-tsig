import React from 'react';
import { Link } from 'react-router-dom';
import AdminLoginForm from '../components/auth/AdminLoginForm';

const AdminLogin = () => {
  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,32,69,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTM5IDM5VjFoLTM4djM4aDM4eiIgZmlsbD0iIzAwMjA0NSIgZmlsbC1vcGFjaXR5PSIwLjA3IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] opacity-40" />

      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-[0.2em]">GeoTravel GIS</p>
          <h2 className="font-headline-xl text-headline-xl text-primary mt-3">Administration Portal</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">Guests browse freely. Admins sign in to manage routes, zones, and attractions.</p>
        </div>

        <AdminLoginForm />

      </div>
    </div>
  );
};

export default AdminLogin;
