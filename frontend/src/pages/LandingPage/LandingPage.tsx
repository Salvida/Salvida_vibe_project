import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

// ---------------------------------------------------------------------------
// Social media config – update hrefs when accounts are live
// ---------------------------------------------------------------------------
const SOCIAL_LINKS = [
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/salvida',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/salvida',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://www.tiktok.com/@salvida',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.23 8.23 0 0 0 4.83 1.56V6.8a4.85 4.85 0 0 1-1.06-.11z" />
      </svg>
    ),
  },
  {
    id: 'google',
    label: 'Google',
    href: 'https://g.page/salvida',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
] as const;

// ---------------------------------------------------------------------------
// Static testimonials – sourced from client feedback emails
// ---------------------------------------------------------------------------
const testimonials = [
  {
    quote:
      'Gracias a Salvida puedo salir de casa sin depender de nadie. Antes las escaleras eran una barrera, ahora son solo un trámite.',
    initials: 'ME',
    name: 'María Elena',
    role: 'Usuaria desde 2023',
    avatarMod: 'purple',
  },
  {
    quote:
      'Muy puntuales y atentos. Mi madre puede bajar y subir a su casa con total seguridad. El equipo trata a las personas con mucho respeto.',
    initials: 'JR',
    name: 'Juan Rodríguez',
    role: 'Familiar de Usuaria',
    avatarMod: 'mauve',
  },
  {
    quote:
      'Un servicio que devuelve la independencia. No es solo asistencia, es recuperar la libertad de entrar y salir de tu propio hogar.',
    initials: 'CG',
    name: 'Carmen García',
    role: 'Usuaria Frecuente',
    avatarMod: 'lime',
  },
] as const;

// ---------------------------------------------------------------------------
// KPI types
// ---------------------------------------------------------------------------
interface GlobalKpis {
  totalServices: number;
  totalUsers: number;
  assistancePoints: number;
}

const DEFAULT_KPIS: GlobalKpis = { totalServices: 0, totalUsers: 0, assistancePoints: 0 };

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------
function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// ---------------------------------------------------------------------------
// Stats card with animated counter
// ---------------------------------------------------------------------------
function StatCard({
  icon,
  target,
  label,
  sublabel,
}: {
  icon: string;
  target: number;
  label: string;
  sublabel?: string;
}) {
  const value = useCountUp(target);
  return (
    <div className="lp-stats__card">
      <div className="lp-stats__icon-wrap">
        <span className="lp-material-icon lp-stats__icon">{icon}</span>
      </div>
      <div className="lp-stats__value">{value.toLocaleString('es-ES')}</div>
      <div className="lp-stats__label">{label}</div>
      {sublabel && <div className="lp-stats__sublabel">{sublabel}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections for the intersection observer
// ---------------------------------------------------------------------------
const SECTIONS = ['home', 'servicios', 'nosotros', 'testimonios'] as const;

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('home');
  const [kpis, setKpis] = useState<GlobalKpis>(DEFAULT_KPIS);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch global KPIs on mount
  useEffect(() => {
    fetch(`${BASE_URL}/globalKpis`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: GlobalKpis) => setKpis(data))
      .catch(() => {
        // fallback – keep zeros, silently ignore (public page must not break)
      });
  }, []);

  function handleNavClick(id: string) {
    setActiveSection(id);
    isScrollingRef.current = true;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' }
    );

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    observerRef.current = observer;

    return () => {
      observerRef.current?.disconnect();
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  return (
    <div className="lp">
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav__inner">
          <span className="lp-nav__logo">Salvida</span>

          <div className="lp-nav__links">
            {(['home', 'servicios', 'nosotros', 'testimonios'] as const).map((id) => (
              <button
                key={id}
                className={`lp-nav__link${activeSection === id ? ' lp-nav__link--active' : ''}`}
                onClick={() => handleNavClick(id)}
              >
                {id === 'home'
                  ? 'Inicio'
                  : id === 'servicios'
                  ? 'Servicios'
                  : id === 'nosotros'
                  ? 'Nosotros'
                  : 'Testimonios'}
              </button>
            ))}
          </div>

          <button className="lp-nav__cta" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </div>
        <div className="lp-nav__divider" />
      </nav>

      <main className="lp-main">
        {/* ── Hero ── */}
        <section className="lp-hero" id="home">
          <div className="lp-hero__blobs" aria-hidden="true">
            <div className="lp-hero__blob lp-hero__blob--1" />
            <div className="lp-hero__blob lp-hero__blob--2" />
          </div>

          <h1 className="lp-hero__title">Salvida</h1>

          <p className="lp-hero__subtitle">
            Ayudamos a las Personas con Movilidad Reducida a salir y entrar de su propio hogar
            con seguridad y dignidad, superando las escaleras que limitan su independencia.
          </p>

          <div className="lp-hero__actions">
            <button className="lp-hero__btn-primary" onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
            <button
              className="lp-hero__btn-secondary"
              onClick={() => navigate('/login?register=true')}
            >
              Crear cuenta
            </button>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="lp-stats" id="servicios">
          <div className="lp-stats__grid">
            <StatCard
              icon="transfer_within_a_station"
              target={kpis.totalServices}
              label="Servicios Realizados"
            />
            <StatCard
              icon="groups"
              target={kpis.totalUsers}
              label="Personas Asistidas"
            />
            <StatCard
              icon="location_on"
              target={kpis.assistancePoints}
              label="Puntos de Asistencia"
            />
          </div>
        </section>

        {/* ── Video ── */}
        <section className="lp-video" id="nosotros">
          <div className="lp-video__frame">
            <img
              className="lp-video__img"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc3UX1FguYT2duV0Oc7SWw8_OcNtgzZCPS1aZAmzIro3OZr3HzZMd9qXc_HQTpFDCul_1nHC_pm4rkteqWNQASwgmKM5r0uG8JLttFzElcTnQblsdJj07q7awgW08YdQgu2O4rEMsjd1h-02YwhCeUvmlT97qSX0tGTSd8FPFft6t6LHYSXDCcZLI450wCDkZR4b3w_SwMRhY5ESr2aV2Zbjq-Fc49zcBLyOOC64BNPa8OKLHq56cMqj5XuuCPF9fkPWdX-yPtiw"
              alt="Asistente ayudando a una persona con movilidad reducida a bajar escaleras"
            />
            <div className="lp-video__overlay" aria-hidden="true" />
            <div className="lp-video__play" role="button" aria-label="Reproducir video">
              <span className="lp-material-icon lp-video__play-icon">play_arrow</span>
            </div>
            <div className="lp-video__caption">
              <div className="lp-video__caption-title">Conoce nuestra misión</div>
              <div className="lp-video__caption-sub">3:45 • Salvida en acción</div>
            </div>
          </div>
        </section>

        {/* ── CTA Band ── */}
        <section className="lp-cta-band">
          <div className="lp-cta-band__inner">
            <h2 className="lp-cta-band__title">
              ¿Listo para recuperar tu independencia en casa?
            </h2>
            <button className="lp-cta-band__btn" onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
            <span className="lp-cta-band__note">(Requiere inicio de sesión)</span>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="lp-testimonials" id="testimonios">
          <div className="lp-testimonials__inner">
            <div className="lp-testimonials__header">
              <div>
                <span className="lp-testimonials__label">Experiencias Reales</span>
                <h2 className="lp-testimonials__title">Lo que dicen de nosotros</h2>
              </div>
              <div className="lp-testimonials__nav">
                <button className="lp-testimonials__nav-btn" aria-label="Anterior testimonio">
                  chevron_left
                </button>
                <button className="lp-testimonials__nav-btn" aria-label="Siguiente testimonio">
                  chevron_right
                </button>
              </div>
            </div>

            <div className="lp-testimonials__grid">
              {testimonials.map((t) => (
                <div key={t.initials} className="lp-testimonial-card">
                  <div className="lp-testimonial-card__stars" aria-label="5 estrellas">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="lp-material-icon lp-material-icon--filled">
                        star
                      </span>
                    ))}
                  </div>
                  <p className="lp-testimonial-card__quote">"{t.quote}"</p>
                  <div className="lp-testimonial-card__author">
                    <div
                      className={`lp-testimonial-card__avatar lp-testimonial-card__avatar--${t.avatarMod}`}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div className="lp-testimonial-card__name">{t.name}</div>
                      <div className="lp-testimonial-card__role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <span className="lp-footer__brand">Salvida</span>

          <div className="lp-footer__links">
            <a href="#" className="lp-footer__link">Política de Privacidad</a>
            <a href="#" className="lp-footer__link">Términos de Servicio</a>
            <a href="#" className="lp-footer__link">Contacto</a>
            <a href="#" className="lp-footer__link">Accesibilidad</a>
          </div>

          {/* Social media */}
          <div className="lp-footer__social">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.id}
                href={s.href}
                className="lp-footer__social-link"
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.svg}
              </a>
            ))}
          </div>

          <span className="lp-footer__copy">© 2025 Salvida. Movilidad con dignidad.</span>
        </div>
      </footer>
    </div>
  );
}
