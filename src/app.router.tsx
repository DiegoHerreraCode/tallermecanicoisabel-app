import { createBrowserRouter, Navigate } from 'react-router';
import { lazy } from 'react';
import { LoginPage } from './auth/pages/login/LoginPage';
import { ForgotPasswordPage } from './auth/pages/forgot-password/ForgotPasswordPage';
import { AuthenticatedRoute, NotAuthenticatedRoute } from './components/routes/ProtectedRoutes';
import { DashboardPage } from './admin/pages/dashboard/DashboardPage';
import { VariablesPage } from './admin/pages/variables/VariablesPage';
import { PersonalMenuPage } from './admin/pages/personal/PersonalMenuPage';
import { PersonalTallerPage } from './admin/pages/personal/PersonalTallerPage';
import { PersonalTallerFormPage } from './admin/pages/personal/PersonalTallerFormPage';
import { AdministradoresPage } from './admin/pages/personal/AdministradoresPage';
import { AdministradoresFormPage } from './admin/pages/personal/AdministradoresFormPage';
import { ClienteMenuPage } from './admin/pages/clientes/ClienteMenuPage';
import { ClientePage } from './admin/pages/clientes/ClientePage';
import { ClienteFormPage } from './admin/pages/clientes/ClienteFormPage';
import { PagoClientePage } from './admin/pages/clientes/PagoClientePage';
import { PagoClienteFormPage } from './admin/pages/clientes/PagoClienteFormPage';
import { InventarioServiciosMenuPage } from './admin/pages/inventario-servicios/InventarioServiciosMenuPage';
import { RepuestoPage } from './admin/pages/inventario-servicios/RepuestoPage';
import { RepuestoFormPage } from './admin/pages/inventario-servicios/RepuestoFormPage';
import { MarcaRepuestoPage } from './admin/pages/inventario-servicios/MarcaRepuestoPage';
import { MarcaRepuestoFormPage } from './admin/pages/inventario-servicios/MarcaRepuestoFormPage';
import { ServicioTallerPage } from './admin/pages/inventario-servicios/ServicioTallerPage';
import { ServicioTallerFormPage } from './admin/pages/inventario-servicios/ServicioTallerFormPage';
import { TipoServicioTallerPage } from './admin/pages/inventario-servicios/TipoServicioTallerPage';
import { TipoServicioTallerFormPage } from './admin/pages/inventario-servicios/TipoServicioTallerFormPage';
import { VehiculoMenuPage } from './admin/pages/vehiculos/VehiculoMenuPage';
import { TipoVehiculoPage } from './admin/pages/vehiculos/TipoVehiculoPage';
import { TipoVehiculoFormPage } from './admin/pages/vehiculos/TipoVehiculoFormPage';
import { MarcaVehiculoPage } from './admin/pages/vehiculos/MarcaVehiculoPage';
import { MarcaVehiculoFormPage } from './admin/pages/vehiculos/MarcaVehiculoFormPage';
import { ModulePlaceholder } from './ModulePlaceholder';

// Lazy loading de layouts
const AuthLayout = lazy(() => import('./auth/layouts/AuthLayout'));
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));

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
        path: 'clientes',
        children: [
          {
            index: true, // ruta: admin/clientes (Menú de selección con los 2 cards: Clientes y Pagos)
            element: <ClienteMenuPage />,
          },
          {
            path: 'listado', // ruta: admin/clientes/listado (Listado de clientes)
            element: <ClientePage />,
          },
          {
            path: 'listado/:id', // ruta: admin/clientes/listado/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <ClienteFormPage />,
          },
          {
            path: 'pagos-clientes', // ruta: admin/clientes/pagos-clientes (Listado con tabla)
            element: <PagoClientePage />,
          },
          {
            path: 'pagos-clientes/:id', // ruta: admin/clientes/pagos-clientes/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <PagoClienteFormPage />,
          },
        ],
      },
      {
        path: 'inventario-servicios', // ruta: admin/inventario-servicios
        children: [
          {
            index: true, // ruta: admin/inventario-servicios (Menú de selección con los 4 cards)
            element: <InventarioServiciosMenuPage />
          },
          {
            path: 'repuestos', // ruta: admin/inventario-servicios/repuestos
            element: <RepuestoPage />
          },
          {
            path: 'repuestos/:id', // ruta: admin/inventario-servicios/repuestos/:id
            element: <RepuestoFormPage />
          },
          {
            path: 'marcas', // ruta: admin/inventario-servicios/marcas
            element: <MarcaRepuestoPage />
          },
          {
            path: 'marcas/:id', // ruta: admin/inventario-servicios/marcas/:id
            element: <MarcaRepuestoFormPage />
          },
          {
            path: 'servicios', // ruta: admin/inventario-servicios/servicios
            element: <ServicioTallerPage />
          },
          {
            path: 'servicios/:id', // ruta: admin/inventario-servicios/servicios/:id
            element: <ServicioTallerFormPage />
          },
          {
            path: 'tipos-servicios', // ruta: admin/inventario-servicios/tipos-servicios
            element: <TipoServicioTallerPage />
          },
          {
            path: 'tipos-servicios/:id', // ruta: admin/inventario-servicios/tipos-servicios/:id
            element: <TipoServicioTallerFormPage />
          },
        ]
      },
      {
        path: 'vehiculos', // ruta: admin/vehiculos
        children: [
          {
            index: true, // ruta: admin/vehiculos (Menú de selección con los 4 cards)
            element: <VehiculoMenuPage />
          },
          {
            path: 'listado', // ruta: admin/vehiculos/listado
            //  element: <VehiculoPage />
          },
          {
            path: 'listado/:id', // ruta: admin/vehiculos/listado/:id
            //  element: <VehiculoFormPage />
          },
          {
            path: 'marcas', // ruta: admin/vehiculos/marcas
            element: <MarcaVehiculoPage />
          },
          {
            path: 'marcas/:id', // ruta: admin/vehiculos/marcas/:id
            element: <MarcaVehiculoFormPage />
          },
          {
            path: 'modelos', // ruta: admin/vehiculos/modelos
            //  element: <ModeloVehiculoPage />
          },
          {
            path: 'modelos/:id', // ruta: admin/vehiculos/modelos/:id
            //  element: <ModeloVehiculoFormPage />
          },
          {
            path: 'tipos-vehiculos', // ruta: admin/vehiculos/tipos-vehiculos
            element: <TipoVehiculoPage />
          },
          {
            path: 'tipos-vehiculos/:id', // ruta: admin/vehiculos/tipos-vehiculos/:id
            element: <TipoVehiculoFormPage />
          },
        ]
      },
      {
        path: 'personal',
        children: [
          {
            index: true, // ruta: admin/personal (Menú de selección con los 2 cards)
            element: <PersonalMenuPage />,
          },
          {
            path: 'taller', // ruta: admin/personal/taller (Listado con tarjetas)
            element: <PersonalTallerPage />,
          },
          {
            path: 'taller/:id', // ruta: admin/personal/taller/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <PersonalTallerFormPage />,
          },
          {
            path: 'administradores', // ruta: admin/personal/administradores (Listado con tarjetas)
            element: <AdministradoresPage />,
          },
          {
            path: 'administradores/:id', // ruta: admin/personal/administradores/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <AdministradoresFormPage />,
          },
        ],
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
