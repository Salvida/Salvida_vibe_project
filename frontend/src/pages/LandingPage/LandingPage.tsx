import { useState, useEffect, useRef } from 'react';
import AuthModal from './AuthModal';
import './LandingPage.css';

const testimonials = [
  {
    quote:
      'Excelente servicio. Me sentí respetada y segura durante todo el trayecto al hospital. Los conductores son muy amables.',
    initials: 'ME',
    name: 'María Elena',
    role: 'Usuaria desde 2023',
    avatarMod: 'purple',
  },
  {
    quote:
      'Muy puntuales. Es difícil encontrar servicios que realmente cumplan con los horarios cuando se trata de citas médicas.',
    initials: 'JR',
    name: 'Juan Rodríguez',
    role: 'Familiar de Usuario',
    avatarMod: 'mauve',
  },
  {
    quote:
      'Trato humano excepcional. No es solo un transporte, es acompañamiento real. Gracias Salvida por dignificar el servicio.',
    initials: 'CG',
    name: 'Carmen García',
    role: 'Usuaria Frecuente',
    avatarMod: 'lime',
  },
] as const;

const stats = [
  {
    icon: 'medical_services',
    value: '280',
    label: 'Servicios Totales',
    sublabel: null,
  },
  {
    icon: 'groups',
    value: '47 Usuarios',
    label: null,
    sublabel: '20 Hombres / 27 Mujeres',
  },
  {
    icon: 'location_on',
    value: '15',
    label: 'Puntos de Asistencia',
    sublabel: null,
  },
] as const;

const SECTIONS = ['home', 'servicios', 'nosotros', 'testimonios'] as const;

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleNavClick(id: string) {
    // Update active state immediately on click
    setActiveSection(id);
    // Suppress observer updates while smooth scroll is in progress (~1s)
    isScrollingRef.current = true;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Ignore observer updates triggered by programmatic scrolls
        if (isScrollingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { threshold: [0.3, 0.5], rootMargin: '-80px 0px 0px 0px' }
    );

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

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
            <button
              className={`lp-nav__link${activeSection === 'home' ? ' lp-nav__link--active' : ''}`}
              onClick={() => handleNavClick('home')}
            >
              Home
            </button>
            <button
              className={`lp-nav__link${activeSection === 'servicios' ? ' lp-nav__link--active' : ''}`}
              onClick={() => handleNavClick('servicios')}
            >
              Servicios
            </button>
            <button
              className={`lp-nav__link${activeSection === 'nosotros' ? ' lp-nav__link--active' : ''}`}
              onClick={() => handleNavClick('nosotros')}
            >
              Nosotros
            </button>
            <button
              className={`lp-nav__link${activeSection === 'testimonios' ? ' lp-nav__link--active' : ''}`}
              onClick={() => handleNavClick('testimonios')}
            >
              Testimonios
            </button>
          </div>

          <button className="lp-nav__cta" onClick={() => setAuthOpen(true)}>Login</button>
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
            Un proyecto dedicado a transformar el transporte médico y la asistencia para Personas
            de Movilidad Reducida (PMR), combinando tecnología, cuidado y dignidad.
          </p>

          <div className="lp-hero__actions">
            <button className="lp-hero__btn-primary" onClick={() => setAuthOpen(true)}>
              Iniciar sesión
            </button>
            <button className="lp-hero__btn-secondary" onClick={() => scrollTo('nosotros')}>
              Conocer más
            </button>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="lp-stats" id="servicios">
          <div className="lp-stats__grid">
            {stats.map((s) => (
              <div key={s.icon} className="lp-stats__card">
                <div className="lp-stats__icon-wrap">
                  <span className="lp-material-icon lp-stats__icon">{s.icon}</span>
                </div>
                <div className="lp-stats__value">{s.value}</div>
                {s.label && <div className="lp-stats__label">{s.label}</div>}
                {s.sublabel && <div className="lp-stats__sublabel">{s.sublabel}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ── Video ── */}
        <section className="lp-video" id="nosotros">
          <div className="lp-video__frame">
            <img
              className="lp-video__img"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc3UX1FguYT2duV0Oc7SWw8_OcNtgzZCPS1aZAmzIro3OZr3HzZMd9qXc_HQTpFDCul_1nHC_pm4rkteqWNQASwgmKM5r0uG8JLttFzElcTnQblsdJj07q7awgW08YdQgu2O4rEMsjd1h-02YwhCeUvmlT97qSX0tGTSd8FPFft6t6LHYSXDCcZLI450wCDkZR4b3w_SwMRhY5ESr2aV2Zbjq-Fc49zcBLyOOC64BNPa8OKLHq56cMqj5XuuCPF9fkPWdX-yPtiw"
              alt="Personal médico asistiendo a paciente con equipamiento de movilidad"
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
              ¿Listo para transformar tu experiencia de traslado?
            </h2>
            <button className="lp-cta-band__btn" onClick={() => setAuthOpen(true)}>
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
                <button
                  className="lp-testimonials__nav-btn"
                  aria-label="Anterior testimonio"
                >
                  chevron_left
                </button>
                <button
                  className="lp-testimonials__nav-btn"
                  aria-label="Siguiente testimonio"
                >
                  chevron_right
                </button>
              </div>
            </div>

            <div className="lp-testimonials__grid">
              {testimonials.map((t) => (
                <div key={t.initials} className="lp-testimonial-card">
                  <div className="lp-testimonial-card__stars" aria-label="5 estrellas">
                    {'star'.repeat(1) /* trick: render 5 spans */}
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
            <a href="#" className="lp-footer__link">Privacy Policy</a>
            <a href="#" className="lp-footer__link">Terms of Service</a>
            <a href="#" className="lp-footer__link">Contact Us</a>
            <a href="#" className="lp-footer__link">Accessibility</a>
          </div>
          <span className="lp-footer__copy">© 2024 Salvida. Empowering mobility with care.</span>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
