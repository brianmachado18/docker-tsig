# Skill: Autenticacion en React SPA

## Problema Resuelto
Implementar autenticación mock (desarrollo) y token-based real (producción) en SPA React con manejo de sesiones limpio, sin duplicación de lógica.

---

## Patrón de Arquitectura

### 1. Store Central (Zustand)

**Archivo**: `src/store/authStore.js`

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado
      isAuthenticated: false,
      user: null,
      token: null,
      role: 'guest', // 'guest', 'admin'
      
      // Acciones
      login: async (username, password) => {
        try {
          // Mock: simular delay, después real: HTTP call
          await new Promise(resolve => setTimeout(resolve, 400));
          
          // Mock validation
          if (username === 'admin' && password === 'password') {
            set({
              isAuthenticated: true,
              user: { id: 1, username, role: 'admin' },
              token: 'mock-token-' + Date.now(),
              role: 'admin'
            });
            return { success: true };
          }
          return { success: false, error: 'Invalid credentials' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          role: 'guest'
        });
      },
      
      setToken: (token) => set({ token }),
      
      // Utilidades
      getAuthHeader: () => {
        const { token } = get();
        return token ? { Authorization: `Bearer ${token}` } : {};
      }
    }),
    {
      name: 'geotravel-auth', // localStorage key
      partialize: (state) => ({
        // Persisten solo lo seguro
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        role: state.role
        // token NO se persiste (riesgo seguridad)
      })
    }
  )
);

export default useAuthStore;
```

---

### 2. ProtectedRoute Wrapper

**Archivo**: `src/components/auth/ProtectedRoute.jsx`

```javascript
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children, requiredRole = 'admin' }) {
  const { isAuthenticated, role } = useAuthStore();
  
  if (!isAuthenticated) {
    // Redirige a login si no está autenticado
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && role !== requiredRole) {
    // Redirige a guest si no tiene el rol correcto
    return <Navigate to="/guest" replace />;
  }
  
  return children;
}
```

---

### 3. Rutas Configuradas

**Archivo**: `src/App.jsx`

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestPortal from './pages/GuestPortal';
import AdminLoginForm from './components/auth/AdminLoginForm';
import ZoneManagement from './pages/ZoneManagement';
import RoutePlanner from './pages/RoutePlanner';
import AttractionCatalog from './pages/AttractionCatalog';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/guest" element={<GuestPortal />} />
        <Route path="/login" element={<AdminLoginForm />} />
        
        {/* Rutas protegidas (admin) */}
        <Route
          path="/zones"
          element={
            <ProtectedRoute requiredRole="admin">
              <ZoneManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/routes"
          element={
            <ProtectedRoute requiredRole="admin">
              <RoutePlanner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attractions"
          element={
            <ProtectedRoute requiredRole="admin">
              <AttractionCatalog />
            </ProtectedRoute>
          }
        />
        
        {/* Default: ir a guest */}
        <Route path="/" element={<Navigate to="/guest" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### 4. Mock Login (Desarrollo Temprano)

**Archivo**: `src/components/auth/AdminLoginForm.jsx`

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useLangStore from '../../store/langStore';

export default function AdminLoginForm() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { t } = useLangStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Mock login: admin/password
    const result = await login(username, password);
    
    if (result.success) {
      navigate('/zones');
    } else {
      setError(result.error || t('auth.signInFailed'));
    }
    
    setLoading(false);
  };
  
  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto p-6">
      <h1>{t('auth.adminLogin')}</h1>
      
      {error && <div className="text-red-600">{error}</div>}
      
      <input
        type="text"
        placeholder={t('auth.username')}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      
      <input
        type="password"
        placeholder={t('auth.password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? t('common.loading') : t('auth.signIn')}
      </button>
    </form>
  );
}
```

---

### 5. Transición Mock → Real

**Paso 1: Crear adaptador HTTP**

```javascript
// src/services/authService.js
import useAuthStore from '../store/authStore';

const API_BASE = 'http://localhost:8080/api';

export const authService = {
  login: async (username, password) => {
    // Real backend call
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const { token, user } = await response.json();
    
    // Guardar token en store
    useAuthStore.getState().setToken(token);
    
    return { success: true, token, user };
  },
  
  logout: () => {
    useAuthStore.getState().logout();
  },
  
  refreshToken: async () => {
    // Implementar refresh token logic
  }
};
```

**Paso 2: Reemplazar en AdminLoginForm**

```javascript
// En handleLogin, cambiar:
// const result = await login(username, password);
// A:
// const result = await authService.login(username, password);
```

---

## Checklist: Implementación Segura

- [ ] `isAuthenticated` en Zustand con persistencia
- [ ] `token` NO persistido (sesión = RAM)
- [ ] ProtectedRoute wrappea todas las rutas admin
- [ ] Logout limpia store y navega a /guest
- [ ] Mock auth con credenciales públicas (admin/password)
- [ ] Tests para ProtectedRoute redirect
- [ ] API intercepción para agregar Authorization header
- [ ] Refresh token logic (si aplica)

---

## Casos de Uso

### ✅ Desarrollo Temprano
- Mock login: admin/password
- Sin backend
- Navega libremente por ProtectedRoutes

### ✅ Testing
- Test ProtectedRoute redirige sin isAuthenticated
- Test login falido muestra error
- Test logout limpia state

### ✅ Producción
- Reemplazar mock.login() con authService.login()
- Agregar refresh token
- Implementar token expiry
- Validar en backend antes de procesar requests

---

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Ruta protegida accesible sin login | ProtectedRoute no wrappea | Asegurar `<ProtectedRoute>` en app.jsx |
| Logout no limpia estado | logout() incompleto | Limpiar user, token, isAuthenticated |
| Token expira sin refresh | Sin refresh logic | Implementar refresh token interceptor |
| Token visible en localStorage | Persistencia insegura | No persista token, solo isAuthenticated |
