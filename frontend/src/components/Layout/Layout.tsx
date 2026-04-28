import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import DemoModeBanner from '../DemoModeBanner/DemoModeBanner';
import { motion } from 'motion/react';
import { useUIStore } from '../../store/useUIStore';
import WhatsAppFAB from '../WhatsAppFAB/WhatsAppFAB';
import './Layout.css';

export default function Layout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <div className="layout">
      <DemoModeBanner />
      <div
        className={`layout__backdrop${sidebarOpen ? ' layout__backdrop--visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <Sidebar />
      <main className="layout__main">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="layout__content"
        >
          <Outlet />
        </motion.div>
      </main>
      <WhatsAppFAB variant="app" />
    </div>
  );
}
