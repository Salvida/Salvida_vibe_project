import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper/types";
import "swiper/swiper.css";
import PLATFORM_ICONS from "../../lib/platformIcons";
import { SalvidaLogo } from "../../assets/icons/SalvidaLogo";
import "./LandingPage.css";
import videoSrc from "../../assets/video/Y0S8F6SYMHLHC1WP.mp4";
import WhatsAppFAB from "../../components/WhatsAppFAB/WhatsAppFAB";

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
  {
    id: "facebook",
    platform: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/p/Salvida-61565788268475/",
    order: 0,
  },
  {
    id: "instagram",
    platform: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com",
    order: 1,
  },
  {
    id: "tiktok",
    platform: "tiktok",
    label: "TikTok",
    url: "https://www.tiktok.com",
    order: 2,
  },
  {
    id: "google",
    platform: "google",
    label: "Google",
    url: "https://www.google.com",
    order: 3,
  },
];

// ---------------------------------------------------------------------------
// Review type from API
// ---------------------------------------------------------------------------
interface ApiReview {
  id: string;
  source: string;
  author_name: string;
  author_avatar?: string;
  rating: number;
  text: string;
  published_at?: string;
}

// ---------------------------------------------------------------------------
// Static mock reviews – shown when API returns nothing
// ---------------------------------------------------------------------------
const testimonials = [
  {
    quote:
      "Gracias a Salvida puedo salir de casa sin depender de nadie. Antes las escaleras eran una barrera, ahora son solo un trámite. Gracias a Salvida puedo salir de casa sin depender de nadie. Antes las escaleras eran una barrera, ahora son solo un trámite. Gracias a Salvida puedo salir de casa sin depender de nadie. Antes las escaleras eran una barrera, ahora son solo un trámite. Gracias a Salvida puedo salir de casa sin depender de nadie. Antes las escaleras eran una barrera, ahora son solo un trámite. Gracias a Salvida puedo salir de casa sin depender de nadie. Antes las escaleras eran una barrera, ahora son solo un trámite. Gracias a Salvida puedo salir de casa sin depender de nadie. Antes las escaleras eran una barrera, ahora son solo un trámite.",
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
  {
    quote:
      "Mi padre lleva meses usando el servicio y cada vez que lo veo bajar solo las escaleras, sé que fue la mejor decisión. Gracias por el cuidado y la profesionalidad.",
    initials: "LM",
    name: "Luis Martínez",
    role: "Familiar de Usuario",
    avatarMod: "purple",
  },
  {
    quote:
      "Rápidos, amables y muy eficientes. Me han dado una autonomía que pensé que había perdido para siempre. Lo recomiendo sin dudarlo.",
    initials: "AP",
    name: "Ana Pérez",
    role: "Usuaria desde 2024",
    avatarMod: "mauve",
  },
  {
    quote:
      "El equipo siempre llega puntual y trata a mi abuela con una delicadeza y un respeto que nos da mucha tranquilidad a toda la familia.",
    initials: "RS",
    name: "Roberto Sánchez",
    role: "Familiar de Usuaria",
    avatarMod: "lime",
  },
  {
    quote:
      "Después de mi operación, Salvida fue clave para recuperar mi rutina. Subir y bajar de casa sin ayuda de nadie volvió a ser posible.",
    initials: "IT",
    name: "Isabel Torres",
    role: "Usuaria Habitual",
    avatarMod: "purple",
  },
] as const;

// ---------------------------------------------------------------------------
// Quote popup – rendered via portal so it floats above the swiper
// ---------------------------------------------------------------------------
interface PopupState {
  text: string;
  left: number;
  width: number;
  // below placement
  top?: number;
  maxHeightBelow?: number;
  // above placement
  bottom?: number;
  maxHeightAbove?: number;
}

function QuotePopup({ popup }: { popup: PopupState }) {
  const GAP = 8;
  const MARGIN = 16;
  const style: React.CSSProperties =
    popup.top !== undefined
      ? {
          top: popup.top + GAP,
          left: popup.left,
          width: popup.width,
          maxHeight: popup.maxHeightBelow,
        }
      : {
          bottom: popup.bottom! + GAP,
          left: popup.left,
          width: popup.width,
          maxHeight: popup.maxHeightAbove,
        };
  void MARGIN;
  return ReactDOM.createPortal(
    <div className="lp-quote-popup" data-quote-popup style={style}>
      "{popup.text}"
    </div>,
    document.body,
  );
}

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
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<string>("home");
  const [kpis, setKpis] = useState<GlobalKpis>(DEFAULT_KPIS);
  const [socialLinks, setSocialLinks] =
    useState<ApiSocialLink[]>(DEFAULT_SOCIAL_LINKS);
  const [reviews, setReviews] = useState<ApiReview[] | null>(null);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch reviews on mount; null means "still loading / use mocks"
  useEffect(() => {
    fetch(`${BASE_URL}/api/reviews`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: ApiReview[]) => setReviews(data.length > 0 ? data : null))
      .catch(() => setReviews(null));
  }, []);

  // Fetch social links on mount
  useEffect(() => {
    fetch(`${BASE_URL}/api/social-links`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: ApiSocialLink[]) => setSocialLinks(data))
      .catch(() => {
        /* silently ignore – no social links shown */
      });
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

  // Close popup on click outside
  useEffect(() => {
    if (!popup) return;
    function handleClick(e: MouseEvent) {
      if (!(e.target as Element).closest("[data-quote-popup]")) {
        setPopup(null);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [popup]);

  function handleQuoteEnter(
    e: React.MouseEvent<HTMLParagraphElement>,
    text: string,
  ) {
    const el = e.currentTarget;
    if (el.scrollHeight <= el.clientHeight) return;
    const rect = el.getBoundingClientRect();
    const MARGIN = 16;
    const GAP = 8;
    const spaceBelow = window.innerHeight - rect.bottom - GAP - MARGIN;
    const spaceAbove = rect.top - GAP - MARGIN;
    if (spaceBelow >= 150 || spaceBelow >= spaceAbove) {
      setPopup({
        text,
        left: rect.left,
        width: rect.width,
        top: rect.bottom,
        maxHeightBelow: Math.max(spaceBelow, 80),
      });
    } else {
      setPopup({
        text,
        left: rect.left,
        width: rect.width,
        bottom: window.innerHeight - rect.top,
        maxHeightAbove: Math.max(spaceAbove, 80),
      });
    }
  }

  return (
    <div className="lp">
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav__inner">
          <button
            className="lp-nav__logo"
            onClick={() => handleNavClick("home")}
            aria-label={t("landing.nav.home")}
          >
            <SalvidaLogo width={60} height={60} className="lp-nav__logo-img" />
          </button>

          <div className="lp-nav__links">
            {(["home", "servicios", "nosotros", "testimonios"] as const).map(
              (id) => (
                <button
                  key={id}
                  className={`lp-nav__link${activeSection === id ? " lp-nav__link--active" : ""}`}
                  onClick={() => handleNavClick(id)}
                >
                  {t(`landing.nav.${id}`)}
                </button>
              ),
            )}
          </div>

          <button className="lp-nav__cta" onClick={() => navigate("/login")}>
            {t("landing.nav.login")}
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

          <p className="lp-hero__subtitle">{t("landing.hero.subtitle")}</p>

          <div className="lp-hero__actions">
            <button
              className="lp-hero__btn-primary"
              onClick={() => navigate("/login")}
            >
              {t("landing.hero.loginBtn")}
            </button>
            <button
              className="lp-hero__btn-secondary"
              onClick={() => navigate("/login?register=true")}
            >
              {t("landing.hero.registerBtn")}
            </button>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="lp-stats" id="servicios">
          <div className="lp-stats__grid">
            <StatCard
              icon="transfer_within_a_station"
              target={kpis.totalServices}
              label={t("landing.stats.services")}
            />
            <StatCard
              icon="groups"
              target={kpis.totalUsers}
              label={t("landing.stats.users")}
            />
            <StatCard
              icon="location_on"
              target={kpis.assistancePoints}
              label={t("landing.stats.points")}
            />
          </div>
        </section>

        {/* ── Video ── */}
        <section className="lp-video" id="nosotros">
          <div className="lp-video__frame">
            <video
              className="lp-video__video"
              src={videoSrc}
              controls
            />
            <div className="lp-video__caption">
              <div className="lp-video__caption-title">
                {t("landing.video.captionTitle")}
              </div>
              <div className="lp-video__caption-sub">
                {t("landing.video.captionSub")}
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
                  {t("landing.testimonials.label")}
                </span>
                <h2 className="lp-testimonials__title">
                  {t("landing.testimonials.title")}
                </h2>
              </div>
              <div className="lp-testimonials__nav">
                <button
                  className="lp-testimonials__nav-btn"
                  aria-label={t("landing.testimonials.prevLabel")}
                  onClick={() => swiperRef.current?.slidePrev()}
                >
                  chevron_left
                </button>
                <button
                  className="lp-testimonials__nav-btn"
                  aria-label={t("landing.testimonials.nextLabel")}
                  onClick={() => swiperRef.current?.slideNext()}
                >
                  chevron_right
                </button>
              </div>
            </div>

            <Swiper
              modules={[Navigation, A11y]}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              spaceBetween={24}
              loop
              breakpoints={{
                0: { slidesPerView: 1 },
                560: { slidesPerView: 2 },
                900: { slidesPerView: 3 },
              }}
            >
              {(reviews ?? testimonials).map((item) => {
                const isApi = "author_name" in item;
                if (isApi) {
                  const r = item as ApiReview;
                  const initials = r.author_name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <SwiperSlide key={r.id}>
                      <div className="lp-testimonial-card">
                        <div className="lp-testimonial-card__source-badge">
                          {PLATFORM_ICONS[r.source] ?? null}
                        </div>
                        <div
                          className="lp-testimonial-card__stars"
                          aria-label={t("landing.testimonials.starsLabel", {
                            count: r.rating,
                          })}
                        >
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <span
                              key={i}
                              className="lp-material-icon lp-material-icon--filled"
                            >
                              star
                            </span>
                          ))}
                          {Array.from({ length: 5 - r.rating }).map((_, i) => (
                            <span key={i} className="lp-material-icon">
                              star
                            </span>
                          ))}
                        </div>
                        <p
                          className="lp-testimonial-card__quote"
                          onMouseEnter={(e) => handleQuoteEnter(e, r.text)}
                        >
                          "{r.text}"
                        </p>
                        <div className="lp-testimonial-card__author">
                          {r.author_avatar ? (
                            <img
                              src={r.author_avatar}
                              alt={r.author_name}
                              className="lp-testimonial-card__avatar-img"
                            />
                          ) : (
                            <div className="lp-testimonial-card__avatar lp-testimonial-card__avatar--purple">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="lp-testimonial-card__name">
                              {r.author_name}
                            </div>
                            <div className="lp-testimonial-card__role">
                              {r.source === "google" ? "Google" : "Facebook"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                }
                const mock = item as (typeof testimonials)[number];
                return (
                  <SwiperSlide key={mock.initials}>
                    <div className="lp-testimonial-card">
                      <div
                        className="lp-testimonial-card__stars"
                        aria-label={t("landing.testimonials.starsLabel", {
                          count: 5,
                        })}
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
                      <p
                        className="lp-testimonial-card__quote"
                        onMouseEnter={(e) => handleQuoteEnter(e, mock.quote)}
                      >
                        "{mock.quote}"
                      </p>
                      <div className="lp-testimonial-card__author">
                        <div
                          className={`lp-testimonial-card__avatar lp-testimonial-card__avatar--${mock.avatarMod}`}
                        >
                          {mock.initials}
                        </div>
                        <div>
                          <div className="lp-testimonial-card__name">
                            {mock.name}
                          </div>
                          <div className="lp-testimonial-card__role">
                            {mock.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </section>
      </main>

      {popup && <QuotePopup popup={popup} />}
      <WhatsAppFAB variant="landing" />

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <span className="lp-footer__brand">Salvida</span>

          <div className="lp-footer__links">
            <Link to="/privacidad" className="lp-footer__link">
              {t("landing.footer.privacy")}
            </Link>
            <Link to="/terminos" className="lp-footer__link">
              {t("landing.footer.terms")}
            </Link>
            <Link to="/contacto" className="lp-footer__link">
              {t("landing.footer.contact")}
            </Link>
            <Link to="/accesibilidad" className="lp-footer__link">
              {t("landing.footer.accessibility")}
            </Link>
          </div>

          {/* Contact info */}
          <div className="lp-footer__contact">
            <a
              href="mailto:hola@salvida.es"
              className="lp-footer__contact-item"
              aria-label="Correo electrónico"
            >
              <span className="lp-material-icon lp-footer__contact-icon">mail</span>
              {t("landing.footer.email")}
            </a>
            <a
              href="tel:+34644572604"
              className="lp-footer__contact-item"
              aria-label="Teléfono"
            >
              <span className="lp-material-icon lp-footer__contact-icon">phone</span>
              {t("landing.footer.phone")}
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
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          )}

          <span className="lp-footer__copy">{t("landing.footer.copy")}</span>
        </div>
      </footer>
    </div>
  );
}
