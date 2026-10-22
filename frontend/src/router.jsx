import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './layouts/AppShell.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { RequireOnboarding } from './components/layout/RequireOnboarding.jsx';
import { RoleRoute } from './components/layout/RoleRoute.jsx';
import { page } from './components/layout/PageFallback.jsx';

// Cada página se descarga al visitarla (R9): el bundle inicial solo trae el shell, Auth y la API
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const RegistroPage = lazy(() => import('./pages/auth/RegistroPage.jsx'));
const RecuperarPage = lazy(() => import('./pages/auth/RecuperarPage.jsx'));
const VerificarPage = lazy(() => import('./pages/auth/VerificarPage.jsx'));
const AuthCallbackPage = lazy(() => import('./pages/auth/AuthCallbackPage.jsx'));
const BienvenidaPage = lazy(() => import('./pages/onboarding/BienvenidaPage.jsx'));
const DescubrePage = lazy(() => import('./pages/descubre/DescubrePage.jsx'));
const NuevoEventoPage = lazy(() => import('./pages/eventos/NuevoEventoPage.jsx'));
const DetalleEventoPage = lazy(() => import('./pages/eventos/DetalleEventoPage.jsx'));
const EditarEventoPage = lazy(() => import('./pages/eventos/EditarEventoPage.jsx'));
const MapaEnVivoPage = lazy(() => import('./pages/MapaEnVivoPage.jsx'));
const AsistentesPage = lazy(() => import('./pages/eventos/AsistentesPage.jsx'));
const CalificarEventoPage = lazy(() => import('./pages/eventos/CalificarEventoPage.jsx'));
const PanelPage = lazy(() => import('./pages/PanelPage.jsx'));
const CitasPage = lazy(() => import('./pages/CitasPage.jsx'));
const NuevaCitaPage = lazy(() => import('./pages/NuevaCitaPage.jsx'));
const DisponibilidadPage = lazy(() => import('./pages/DisponibilidadPage.jsx'));
const PerfilPage = lazy(() => import('./pages/PerfilPage.jsx'));
const MisEventosPage = lazy(() => import('./pages/MisEventosPage.jsx'));
const AvisosPage = lazy(() => import('./pages/AvisosPage.jsx'));
const CompartirPage = lazy(() => import('./pages/CompartirPage.jsx'));
const PrivacidadPage = lazy(() => import('./pages/PrivacidadPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

const organizerOnly = (element) => <RoleRoute role="organizer">{element}</RoleRoute>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/descubre" replace />,
  },
  // Auth (auth-onboarding §4 y §5). /ingresar queda como alias para enlaces viejos.
  { path: '/login', element: page(LoginPage, 'screen') },
  { path: '/ingresar', element: <Navigate to="/login" replace /> },
  { path: '/registro', element: page(RegistroPage, 'screen') },
  { path: '/recuperar', element: page(RecuperarPage, 'screen') },
  // Pública a propósito: se lee antes de crear la cuenta
  { path: '/privacidad', element: page(PrivacidadPage, 'screen') },
  // Públicas a propósito: la sesión llega en la URL (Google, confirmación de correo, recuperación)
  { path: '/auth/callback', element: page(AuthCallbackPage, 'screen') },
  // Código de 6 dígitos para confirmar la cuenta (P5)
  { path: '/verificar', element: page(VerificarPage, 'screen') },
  // Alias de enlaces viejos: la recuperación ahora es un solo flujo con código en /recuperar
  { path: '/nueva-contrasena', element: <Navigate to="/recuperar" replace /> },
  {
    path: '/bienvenida',
    element: (
      <ProtectedRoute>
        <RequireOnboarding>{page(BienvenidaPage, 'screen')}</RequireOnboarding>
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
      { path: '/descubre', element: page(DescubrePage) },
      // Ruta vieja del listado (ui.md §2): se conserva como alias
      { path: '/eventos', element: <Navigate to="/descubre" replace /> },
      { path: '/eventos/nuevo', element: organizerOnly(page(NuevoEventoPage)) },
      { path: '/eventos/:id', element: page(DetalleEventoPage), handle: { immersive: true } },
      { path: '/eventos/:id/calificar', element: page(CalificarEventoPage) },
      { path: '/eventos/:id/editar', element: organizerOnly(page(EditarEventoPage)) },
      { path: '/eventos/:id/asistentes', element: organizerOnly(page(AsistentesPage)) },
      { path: '/panel', element: page(PanelPage) },
      { path: '/citas', element: page(CitasPage) },
      { path: '/citas/nueva', element: organizerOnly(page(NuevaCitaPage)) },
      { path: '/disponibilidad', element: organizerOnly(page(DisponibilidadPage)) },
      { path: '/perfil', element: page(PerfilPage) },
      { path: '/mis-eventos', element: page(MisEventosPage) },
      { path: '/mapa', element: organizerOnly(page(MapaEnVivoPage)) },
      { path: '/avisos', element: page(AvisosPage) },
      // M1: QR con la dirección de la app para que los participantes entren escaneando
      { path: '/compartir', element: organizerOnly(page(CompartirPage)) },
    ],
  },
  // Verificación del sistema de diseño: solo en desarrollo y fuera del bundle de producción
  ...(import.meta.env.DEV
    ? [{ path: '/dev/ui', lazy: () => import('./pages/dev/DevUiPage.jsx').then((m) => ({ Component: m.default })) }]
    : []),
  {
    path: '*',
    element: page(NotFoundPage, 'screen'),
  },
]);
