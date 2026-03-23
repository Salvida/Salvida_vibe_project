import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { motion } from 'motion/react';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
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
    </div>
  );
}
