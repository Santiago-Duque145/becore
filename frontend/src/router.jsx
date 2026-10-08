import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './components/layout/AppShell.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { RoleRoute } from './components/layout/RoleRoute.jsx';

import IngresarPage from './pages/IngresarPage.jsx';
import RegistroPage from './pages/RegistroPage.jsx';
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/eventos" replace />,
  },
  {
    path: '/ingresar',
    element: <IngresarPage />,
  },
  {
    path: '/registro',
    element: <RegistroPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
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
      { path: '/eventos/:id/editar', element: <EditarEventoPage /> },
      { path: '/eventos/:id/asistentes', element: <AsistentesPage /> },
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
      { path: '/disponibilidad', element: <DisponibilidadPage /> },
      { path: '/perfil', element: <PerfilPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
