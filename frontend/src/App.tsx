import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLoader from './components/AppLoader';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages — loaded eagerly (small, needed immediately)
import Login from './pages/Login/Login';
import LandingPage from './pages/LandingPage/LandingPage';

// App pages — lazy loaded (heavy, only needed after auth)
const Layout       = lazy(() => import('./components/Layout/Layout'));
const Dashboard    = lazy(() => import('./pages/Dashboard/Dashboard'));
const Patients     = lazy(() => import('./pages/Patients/Patients'));
const PatientDetail = lazy(() => import('./pages/PatientDetail/PatientDetail'));
const NewPatient   = lazy(() => import('./pages/NewPatient/NewPatient'));
const Settings     = lazy(() => import('./pages/Settings/Settings'));
const Notifications = lazy(() => import('./pages/Notifications/Notifications'));
const NewBooking   = lazy(() => import('./pages/NewBooking/NewBooking'));
const Addresses    = lazy(() => import('./pages/Addresses/Addresses'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AppLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected app */}
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<Layout />}>
              <Route index element={<Navigate to="/app/bookings" replace />} />
              <Route path="bookings" element={<Dashboard />} />
              <Route path="bookings/new" element={<NewBooking />} />
              <Route path="patients" element={<Patients />} />
              <Route path="patients/new" element={<NewPatient />} />
              <Route path="patients/:id" element={<PatientDetail />} />
              <Route path="addresses" element={<Addresses />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
