import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PLATFORM_ICONS from "../../lib/platformIcons";
import "./LandingPage.css";

// ---------------------------------------------------------------------------
// Social link type from API
// ---------------------------------------------------------------------------
interface ApiSocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  order: number;
}

const DEFAULT_SOCIAL_LINKS: ApiSocialLink[] = [
  { id: "facebook",  platform: "facebook",  label: "Facebook",  url: "https://www.facebook.com/p/Salvida-61565788268475/", order: 0 },
  { id: "instagram", platform: "instagram", label: "Instagram", url: "https://www.instagram.com",                          order: 1 },
  { id: "tiktok",    platform: "tiktok",    label: "TikTok",    url: "https://www.tiktok.com",                             order: 2 },
  { id: "google",    platform: "google",    label: "Google",    url: "https://www.google.com",                             order: 3 },
];

// ---------------------------------------------------------------------------
// Static testimonials – sourced from client feedback emails
// ---------------------------------------------------------------------------
const testimonials = [
  {
    quote:
      "Gracias a Salvida puedo salir de casa sin depender de nadie. Antes las escaleras eran una barrera, ahora son solo un trámite.",
    initials: "ME",
    name: "María Elena",
    role: "Usuaria desde 2023",
    avatarMod: "purple",
  },
  {
    quote:
      "Muy puntuales y atentos. Mi madre puede bajar y subir a su casa con total seguridad. El equipo trata a las personas con mucho respeto.",
    initials: "JR",
    name: "Juan Rodríguez",
    role: "Familiar de Usuaria",
    avatarMod: "mauve",
  },
  {
    quote:
      "Un servicio que devuelve la independencia. No es solo asistencia, es recuperar la libertad de entrar y salir de tu propio hogar.",
    initials: "CG",
    name: "Carmen García",
    role: "Usuaria Frecuente",
    avatarMod: "lime",
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

const DEFAULT_KPIS: GlobalKpis = {
  totalServices: 0,
  totalUsers: 0,
  assistancePoints: 0,
};

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------
function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
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
      <div className="lp-stats__value">{value.toLocaleString("es-ES")}</div>
      <div className="lp-stats__label">{label}</div>
      {sublabel && <div className="lp-stats__sublabel">{sublabel}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections for the intersection observer
// ---------------------------------------------------------------------------
const SECTIONS = ["home", "servicios", "nosotros", "testimonios"] as const;

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("home");
  const [kpis, setKpis] = useState<GlobalKpis>(DEFAULT_KPIS);
  const [socialLinks, setSocialLinks] = useState<ApiSocialLink[]>(DEFAULT_SOCIAL_LINKS);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch social links on mount
  useEffect(() => {
    fetch(`${BASE_URL}/api/social-links`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: ApiSocialLink[]) => setSocialLinks(data))
      .catch(() => {/* silently ignore – no social links shown */});
  }, []);

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
    if (el) el.scrollIntoView({ behavior: "smooth" });
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
      { threshold: 0.3, rootMargin: "-80px 0px 0px 0px" },
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
            {(["home", "servicios", "nosotros", "testimonios"] as const).map(
              (id) => (
                <button
                  key={id}
                  className={`lp-nav__link${activeSection === id ? " lp-nav__link--active" : ""}`}
                  onClick={() => handleNavClick(id)}
                >
                  {id === "home"
                    ? "Inicio"
                    : id === "servicios"
                      ? "Servicios"
                      : id === "nosotros"
                        ? "Nosotros"
                        : "Testimonios"}
                </button>
              ),
            )}
          </div>

          <button className="lp-nav__cta" onClick={() => navigate("/login")}>
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
            Ayudamos a las Personas con Movilidad Reducida a salir y entrar de
            su propio hogar con seguridad y dignidad, superando las escaleras
            que limitan su independencia.
          </p>

          <div className="lp-hero__actions">
            <button
              className="lp-hero__btn-primary"
              onClick={() => navigate("/login")}
            >
              Iniciar sesión
            </button>
            <button
              className="lp-hero__btn-secondary"
              onClick={() => navigate("/login?register=true")}
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
            <div
              className="lp-video__play"
              role="button"
              aria-label="Reproducir video"
            >
              <span className="lp-material-icon lp-video__play-icon">
                play_arrow
              </span>
            </div>
            <div className="lp-video__caption">
              <div className="lp-video__caption-title">
                Conoce nuestra misión
              </div>
              <div className="lp-video__caption-sub">
                3:45 • Salvida en acción
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="lp-testimonials" id="testimonios">
          <div className="lp-testimonials__inner">
            <div className="lp-testimonials__header">
              <div>
                <span className="lp-testimonials__label">
                  Experiencias Reales
                </span>
                <h2 className="lp-testimonials__title">
                  Lo que dicen de nosotros
                </h2>
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
                  <div
                    className="lp-testimonial-card__stars"
                    aria-label="5 estrellas"
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="lp-material-icon lp-material-icon--filled"
                      >
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
            <a href="#" className="lp-footer__link">
              Política de Privacidad
            </a>
            <a href="#" className="lp-footer__link">
              Términos de Servicio
            </a>
            <a href="#" className="lp-footer__link">
              Contacto
            </a>
            <a href="#" className="lp-footer__link">
              Accesibilidad
            </a>
          </div>

          {/* Social media */}
          {socialLinks.length > 0 && (
            <div className="lp-footer__social">
              {socialLinks.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  className="lp-footer__social-link"
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {PLATFORM_ICONS[s.platform] ?? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          )}

          <span className="lp-footer__copy">
            © 2025 Salvida. Movilidad con dignidad.
          </span>
        </div>
      </footer>
    </div>
  );
}
