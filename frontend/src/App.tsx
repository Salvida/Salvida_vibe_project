import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Patients from './pages/Patients/Patients';
import PatientDetail from './pages/PatientDetail/PatientDetail';
import Settings from './pages/Settings/Settings';
import Notifications from './pages/Notifications/Notifications';
import NewBooking from './pages/NewBooking/NewBooking';
import LandingPage from './pages/LandingPage/LandingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin app */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Dashboard />} />
          <Route path="bookings/new" element={<NewBooking />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
