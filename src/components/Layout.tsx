import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { motion } from 'motion/react';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
