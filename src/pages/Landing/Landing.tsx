/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  BriefcaseMedical,
  Users,
  MapPin,
  Play,
  ChevronLeft,
  ChevronRight,
  Star,
  Home,
  Calendar,
  User,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Re-mapping icons to match the Material Symbols used in the request if possible,
// or using closest Lucide equivalents.
const Icons = {
  Medical: BriefcaseMedical,
  Groups: Users,
  Location: MapPin,
  Play: Play,
  Left: ChevronLeft,
  Right: ChevronRight,
  Star: Star,
  Home: Home,
  Calendar: Calendar,
  Person: User,
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "glass-effect shadow-sm py-3" : "bg-transparent py-5"}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary tracking-tighter font-headline">
            Salvida
          </div>

          <div className="hidden md:flex space-x-8 items-center">
            <a
              href="#"
              className="text-sm font-semibold text-primary border-b-2 border-primary"
            >
              Home
            </a>
            <a
              href="#"
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              Services
            </a>
            <a
              href="#"
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              About
            </a>
            <a
              href="#"
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              Testimonials
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button className="cta-gradient text-on-primary font-headline text-sm font-semibold px-8 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/10">
              Login
            </button>
            <button
              className="md:hidden text-primary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 md:hidden glass-effect pt-24 px-6"
          >
            <div className="flex flex-col space-y-6 text-center">
              <a
                href="#"
                className="text-xl font-bold text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="#"
                className="text-xl font-medium text-on-surface-variant"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </a>
              <a
                href="#"
                className="text-xl font-medium text-on-surface-variant"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <a
                href="#"
                className="text-xl font-medium text-on-surface-variant"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonials
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="relative px-6 pt-12 pb-20 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-fixed-dim blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-fixed-dim blur-[120px] rounded-full"></div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-primary leading-[1.1] mb-6 max-w-4xl"
          >
            Salvida
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-body text-xl md:text-2xl text-on-surface-variant max-w-2xl mb-10 leading-relaxed"
          >
            Un proyecto dedicado a transformar el transporte médico y la
            asistencia para Personas de Movilidad Reducida (PMR), combinando
            tecnología, cuidado y dignidad.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <button className="cta-gradient text-on-primary font-headline font-semibold px-10 py-4 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              Acceder a Reservas
            </button>
            <button className="bg-surface-container-high text-primary font-headline font-semibold px-10 py-4 rounded-full hover:bg-surface-container-highest transition-colors">
              Conocer más
            </button>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="px-6 py-12 bg-surface-container-low">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard
              icon="medical_services"
              value="280"
              label="Servicios Totales"
            />
            <StatCard
              icon="groups"
              value="47 Usuarios"
              sublabel="20 Hombres / 27 Mujeres"
            />
            <StatCard
              icon="location_on"
              value="15"
              label="Puntos de Asistencia"
            />
          </div>
        </section>

        {/* Video Section */}
        <section className="px-6 py-24 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-2xl shadow-primary/5"
          >
            <div className="aspect-video bg-surface-container-highest flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1920"
                alt="Medical professional"
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
              <div className="relative z-10 w-24 h-24 bg-white/30 backdrop-blur-xl border border-white/40 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                <Icons.Play className="text-white w-12 h-12 fill-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-8 left-8 text-white">
              <h3 className="font-headline text-2xl font-bold">
                Conoce nuestra misión
              </h3>
              <p className="font-body text-white/80">
                3:45 • Salvida en acción
              </p>
            </div>
          </motion.div>
        </section>

        {/* CTA Banner */}
        <section className="px-6 py-24 bg-surface text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-10">
              ¿Listo para transformar tu experiencia de traslado?
            </h2>
            <div className="inline-flex flex-col items-center">
              <button className="cta-gradient text-on-primary font-headline text-xl font-bold px-12 py-6 rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all hover:-translate-y-1 active:translate-y-0">
                Acceder a Reservas
              </button>
              <span className="mt-4 font-label text-xs uppercase tracking-widest font-semibold text-on-surface-variant/70 italic">
                (Requiere inicio de sesión)
              </span>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 py-24 bg-surface-container-low overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="font-label text-xs uppercase tracking-widest font-bold text-primary mb-2 block">
                  Experiencias Reales
                </span>
                <h2 className="font-headline text-4xl font-extrabold text-on-surface">
                  Lo que dicen de nosotros
                </h2>
              </div>
              <div className="hidden md:flex gap-3">
                <button className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:bg-primary-container hover:text-on-primary-container transition-colors">
                  <Icons.Left size={24} />
                </button>
                <button className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:bg-primary-container hover:text-on-primary-container transition-colors">
                  <Icons.Right size={24} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TestimonialCard
                stars={5}
                text="Excelente servicio. Me sentí respetada y segura durante todo el trayecto al hospital. Los conductores son muy amables."
                author="María Elena"
                role="Usuaria desde 2023"
                initials="ME"
                color="bg-primary-fixed"
              />
              <TestimonialCard
                stars={5}
                text="Muy puntuales. Es difícil encontrar servicios que realmente cumplan con los horarios cuando se trata de citas médicas."
                author="Juan Rodríguez"
                role="Familiar de Usuario"
                initials="JR"
                color="bg-secondary-fixed"
              />
              <TestimonialCard
                stars={5}
                text="Trato humano excepcional. No es solo un transporte, es acompañamiento real. Gracias Salvida por dignificar el servicio."
                author="Carmen García"
                role="Usuaria Frecuente"
                initials="CG"
                color="bg-tertiary-fixed-dim"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 border-t border-slate-200 bg-slate-50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto">
          <div className="text-lg font-black text-primary font-headline uppercase tracking-tighter">
            Salvida
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a
              href="#"
              className="font-manrope text-xs uppercase tracking-widest font-semibold text-slate-500 hover:text-primary transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="font-manrope text-xs uppercase tracking-widest font-semibold text-slate-500 hover:text-primary transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="font-manrope text-xs uppercase tracking-widest font-semibold text-slate-500 hover:text-primary transition-colors"
            >
              Contact Us
            </a>
            <a
              href="#"
              className="font-manrope text-xs uppercase tracking-widest font-semibold text-slate-500 hover:text-primary transition-colors"
            >
              Accessibility
            </a>
          </div>
          <div className="font-manrope text-xs uppercase tracking-widest font-semibold text-slate-500">
            © 2024 Salvida. Empowering mobility with care.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full glass-effect z-50 flex justify-around items-center px-4 py-3 pb-8 rounded-t-3xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
        <MobileNavItem icon={<Home size={20} />} label="Home" active />
        <MobileNavItem icon={<Icons.Medical size={20} />} label="Servicios" />
        <MobileNavItem icon={<Icons.Calendar size={20} />} label="Agenda" />
        <MobileNavItem icon={<Icons.Person size={20} />} label="Perfil" />
      </nav>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  sublabel,
}: {
  icon: string;
  value: string;
  label?: string;
  sublabel?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-surface-container-lowest p-10 rounded-3xl signature-accent-purple flex flex-col items-center text-center shadow-sm"
    >
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-primary">
          {icon}
        </span>
      </div>
      <div className="font-headline text-4xl font-extrabold text-on-surface tracking-tighter">
        {value}
      </div>
      {label && (
        <div className="font-label text-sm uppercase tracking-widest font-bold text-on-surface-variant mt-2">
          {label}
        </div>
      )}
      {sublabel && (
        <div className="font-body text-sm text-on-surface-variant mt-2 font-medium">
          {sublabel}
        </div>
      )}
    </motion.div>
  );
}

function TestimonialCard({
  stars,
  text,
  author,
  role,
  initials,
  color,
}: {
  stars: number;
  text: string;
  author: string;
  role: string;
  initials: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-primary/10"
    >
      <div className="flex text-amber-500 mb-6">
        {[...Array(stars)].map((_, i) => (
          <Icons.Star key={i} size={18} fill="currentColor" />
        ))}
      </div>
      <p className="font-body text-lg text-on-surface-variant italic mb-8 leading-relaxed">
        "{text}"
      </p>
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-full ${color} flex items-center justify-center font-bold text-on-primary-fixed`}
        >
          {initials}
        </div>
        <div>
          <div className="font-headline font-bold text-on-surface">
            {author}
          </div>
          <div className="font-label text-xs uppercase text-on-surface-variant">
            {role}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MobileNavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href="#"
      className={`flex flex-col items-center gap-1 transition-all ${active ? "text-primary font-semibold border-b-2 border-primary px-2" : "text-on-surface-variant"}`}
    >
      {icon}
      <span className="text-[10px] font-label uppercase tracking-widest">
        {label}
      </span>
    </a>
  );
}
