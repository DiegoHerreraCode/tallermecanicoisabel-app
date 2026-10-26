import { createBrowserRouter, Navigate } from 'react-router';
import { lazy } from 'react';
import { LoginPage } from './auth/pages/login/LoginPage';
import { ForgotPasswordPage } from './auth/pages/forgot-password/ForgotPasswordPage';
import { AdminLayout } from './admin/layouts/AdminLayout';
import { AuthenticatedRoute, NotAuthenticatedRoute } from './components/routes/ProtectedRoutes';
import { DashboardPage } from './admin/pages/dashboard/DashboardPage';
import { VariablesPage } from './admin/pages/variables/VariablesPage';
import { ModulePlaceholder } from './ModulePlaceholder';

// Lazy loading de layouts
const AuthLayout = lazy(() => import('./auth/layouts/AuthLayout'));
// const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));

export const appRouter = createBrowserRouter([
  // Redirección de raíz hacia el panel de administración
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },

  // Rutas públicas de autenticación (solo para usuarios no autenticados)
  {
    path: '/auth',
    element: (
      <NotAuthenticatedRoute>
        <AuthLayout />
      </NotAuthenticatedRoute>
    ),
    children: [
      {
        index: true, // ruta: auth
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login', // ruta: auth/login
        element: <LoginPage />,
      },
      {
        path: 'forgot-password', // ruta: auth/forgot-password
        element: <ForgotPasswordPage />,
      },
    ],
  },

  // Rutas privadas de administración (requieren autenticación)
  {
    path: '/admin',
    element: (
      <AuthenticatedRoute>
        <AdminLayout />
      </AuthenticatedRoute>
    ),
    children: [
      {
        index: true, // ruta: admin
        element: <DashboardPage />
      },
      {
        path: 'taller', // ruta: admin/taller
        element: <ModulePlaceholder title="Taller" description="Módulo de taller" />
      },
      {
        path: 'clientes', // ruta: admin/clientes
        element: <ModulePlaceholder title="Clientes" description="Módulo de clientes" />
      },
      {
        path: 'inventario-servicios', // ruta: admin/inventario-servicios
        element: <ModulePlaceholder title="Inventario y Servicios" description="Módulo de inventario y servicios" />
      },
      {
        path: 'vehiculos', // ruta: admin/vehiculos
        element: <ModulePlaceholder title="Vehículos" description="Módulo de vehículos" />
      },
      {
        path: 'personal', // ruta: admin/personal
        element: <ModulePlaceholder title="Personal" description="Módulo de personal" />
      },
      {
        path: 'variables', // ruta: admin/variables
        element: <VariablesPage />
      },
    ],
  },

  // Comodín / 404
  {
    path: '*',
    element: <Navigate to="/admin" replace />,
  },
]);
