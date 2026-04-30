import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLoader from './components/AppLoader';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt/InstallPrompt';

// Public pages — loaded eagerly (small, needed immediately)
import Login from './pages/Login/Login';
import LandingPage from './pages/LandingPage/LandingPage';

// App pages — lazy loaded (heavy, only needed after auth)
const Layout       = lazy(() => import('./components/Layout/Layout'));
const Dashboard    = lazy(() => import('./pages/Dashboard/Dashboard'));
const Prms         = lazy(() => import('./pages/Prms/Prms'));
const PrmDetail    = lazy(() => import('./pages/PrmDetail/PrmDetail'));
const NewPrm       = lazy(() => import('./pages/NewPrm/NewPrm'));
const Settings     = lazy(() => import('./pages/Settings/Settings'));
const Notifications = lazy(() => import('./pages/Notifications/Notifications'));
const NewBooking   = lazy(() => import('./pages/NewBooking/NewBooking'));
const EditBooking  = lazy(() => import('./pages/EditBooking/EditBooking'));
const Addresses    = lazy(() => import('./pages/Addresses/Addresses'));
const Users        = lazy(() => import('./pages/Users/Users'));
const SuperAdmin   = lazy(() => import('./pages/SuperAdmin/SuperAdmin'));

// Legal pages — lazy loaded
const PrivacyPolicy  = lazy(() => import('./pages/Legal/PrivacyPolicy'));
const Terms          = lazy(() => import('./pages/Legal/Terms'));
const Contact        = lazy(() => import('./pages/Legal/Contact'));
const Accessibility  = lazy(() => import('./pages/Legal/Accessibility'));

export default function App() {
  return (
    <BrowserRouter>
      <InstallPrompt />
      <Suspense fallback={<AppLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacidad"    element={<PrivacyPolicy />} />
          <Route path="/terminos"      element={<Terms />} />
          <Route path="/contacto"      element={<Contact />} />
          <Route path="/accesibilidad" element={<Accessibility />} />

          {/* Protected app — all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<Layout />}>
              <Route index element={<Navigate to="/app/bookings" replace />} />
              <Route path="bookings" element={<Dashboard />} />
              <Route path="bookings/new" element={<NewBooking />} />
              <Route path="bookings/:id/edit" element={<EditBooking />} />
              <Route path="prms" element={<Prms />} />
              <Route path="prms/new" element={<NewPrm />} />
              <Route path="prms/:id" element={<PrmDetail />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Route>

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/app" element={<Layout />}>
              <Route path="addresses" element={<Addresses />} />
              <Route path="users" element={<Users />} />
            </Route>
          </Route>

          {/* Superadmin-only routes */}
          <Route element={<ProtectedRoute requireSuperAdmin />}>
            <Route path="/app" element={<Layout />}>
              <Route path="superadmin" element={<SuperAdmin />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
