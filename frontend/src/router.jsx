import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './layouts/AppShell.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { RequireOnboarding } from './components/layout/RequireOnboarding.jsx';
import { RoleRoute } from './components/layout/RoleRoute.jsx';

import LoginPage from './pages/auth/LoginPage.jsx';
import RegistroPage from './pages/auth/RegistroPage.jsx';
import RecuperarPage from './pages/auth/RecuperarPage.jsx';
import NuevaContrasenaPage from './pages/auth/NuevaContrasenaPage.jsx';
import AuthCallbackPage from './pages/auth/AuthCallbackPage.jsx';
import BienvenidaPage from './pages/BienvenidaPage.jsx';
import EventosPage from './pages/EventosPage.jsx';
import NuevoEventoPage from './pages/eventos/NuevoEventoPage.jsx';
import DetalleEventoPage from './pages/eventos/DetalleEventoPage.jsx';
import EditarEventoPage from './pages/eventos/EditarEventoPage.jsx';
import AsistentesPage from './pages/eventos/AsistentesPage.jsx';
import PanelPage from './pages/PanelPage.jsx';
import CitasPage from './pages/CitasPage.jsx';
import NuevaCitaPage from './pages/NuevaCitaPage.jsx';
import DisponibilidadPage from './pages/DisponibilidadPage.jsx';
import PerfilPage from './pages/PerfilPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProximamentePage from './pages/ProximamentePage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/eventos" replace />,
  },
  // Auth (auth-onboarding §4 y §5). /ingresar queda como alias para enlaces viejos.
  { path: '/login', element: <LoginPage /> },
  { path: '/ingresar', element: <Navigate to="/login" replace /> },
  { path: '/registro', element: <RegistroPage /> },
  { path: '/recuperar', element: <RecuperarPage /> },
  // Públicas a propósito: la sesión llega en la URL (Google, confirmación de correo, recuperación)
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/nueva-contrasena', element: <NuevaContrasenaPage /> },
  {
    path: '/bienvenida',
    element: (
      <ProtectedRoute>
        <RequireOnboarding>
          <BienvenidaPage />
        </RequireOnboarding>
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <RequireOnboarding>
          <AppShell />
        </RequireOnboarding>
      </ProtectedRoute>
    ),
    children: [
      { path: '/eventos', element: <EventosPage /> },
      {
        path: '/eventos/nuevo',
        element: (
          <RoleRoute role="organizer">
            <NuevoEventoPage />
          </RoleRoute>
        ),
      },
      { path: '/eventos/:id', element: <DetalleEventoPage /> },
      { path: '/eventos/:id/editar', element: <RoleRoute role="organizer"><EditarEventoPage /></RoleRoute> },
      { path: '/eventos/:id/asistentes', element: <RoleRoute role="organizer"><AsistentesPage /></RoleRoute> },
      { path: '/panel', element: <PanelPage /> },
      { path: '/citas', element: <CitasPage /> },
      {
        path: '/citas/nueva',
        element: (
          <RoleRoute role="organizer">
            <NuevaCitaPage />
          </RoleRoute>
        ),
      },
      { path: '/disponibilidad', element: <RoleRoute role="organizer"><DisponibilidadPage /></RoleRoute> },
      { path: '/perfil', element: <PerfilPage /> },
      // Destinos de la navegación nueva que se construyen en R7
      { path: '/mis-eventos', element: <ProximamentePage title="Mis eventos" /> },
      { path: '/avisos', element: <ProximamentePage title="Avisos" /> },
    ],
  },
  // Verificación del sistema de diseño: solo en desarrollo y fuera del bundle de producción
  ...(import.meta.env.DEV
    ? [{ path: '/dev/ui', lazy: () => import('./pages/dev/DevUiPage.jsx').then((m) => ({ Component: m.default })) }]
    : []),
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
