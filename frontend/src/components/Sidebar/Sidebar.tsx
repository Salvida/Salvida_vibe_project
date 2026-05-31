import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Users,
  Settings,
  LogOut,
  MapPin,
  UserCog,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { SalvidaLogo } from "../../assets/icons/SalvidaLogo";
import { useUIStore } from "../../store/useUIStore";
import { useDemoMode } from "../../hooks/useProfile";
import "./Sidebar.css";

const allNavItems = [
  {
    icon: CalendarDays,
    labelKey: "nav.bookings",
    path: "/app/bookings",
    adminOnly: false,
    superAdminOnly: false,
  },
  { icon: UserCog, labelKey: "nav.users", path: "/app/users", adminOnly: true, superAdminOnly: false },
  { icon: Users, labelKey: "nav.prms", path: "/app/prms", adminOnly: false, superAdminOnly: false },
  {
    icon: MapPin,
    labelKey: "nav.addresses",
    path: "/app/addresses",
    adminOnly: true,
    superAdminOnly: false,
  },
  {
    icon: Settings,
    labelKey: "nav.settings",
    path: "/app/settings",
    adminOnly: false,
    superAdminOnly: false,
  },
  {
    icon: ShieldCheck,
    labelKey: "nav.superadmin",
    path: "/app/superadmin",
    adminOnly: false,
    superAdminOnly: true,
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isSuperAdmin = user?.role === "superadmin";
  const demoMode = useDemoMode();
  const isDemo = user?.demoModeActive ?? false;
  const [confirming, setConfirming] = useState(false);
  const navItems = allNavItems.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (item.adminOnly) return isAdmin;
    return true;
  });

  const hasName = user && (user.firstName || user.lastName);
  const fullName = hasName
    ? `${user.firstName} ${user.lastName}`.trim()
    : (user?.email ?? t("common.profileIncomplete"));
  const initials = hasName
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : (user?.email?.charAt(0) ?? "?").toUpperCase();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <aside className={`sidebar${sidebarOpen ? " sidebar--open" : ""}`}>
      <div className="sidebar__logo">
        <SalvidaLogo width={160} height={52} className="sidebar__logo-img" />
        <p className="sidebar__logo-sub">{t("nav.brandSubtitle")}</p>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar__nav-link${isActive ? " sidebar__nav-link--active" : ""}`}
            >
              <item.icon size={20} />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        {isSuperAdmin && (
          confirming ? (
            <div className="sidebar__demo-confirm">
              <span className="sidebar__demo-confirm-label">
                {isDemo ? "¿Salir del modo demo?" : "¿Activar modo demo?"}
              </span>
              <div className="sidebar__demo-confirm-actions">
                <button
                  className="sidebar__demo-confirm-yes"
                  onClick={() => { demoMode.mutate(!isDemo); setConfirming(false); }}
                  disabled={demoMode.isPending}
                >
                  Confirmar
                </button>
                <button
                  className="sidebar__demo-confirm-no"
                  onClick={() => setConfirming(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              className={`sidebar__demo-toggle${isDemo ? " sidebar__demo-toggle--active" : ""}`}
              onClick={() => setConfirming(true)}
              aria-pressed={isDemo}
            >
              <FlaskConical size={15} />
              <span>{isDemo ? "Modo demo" : "Modo producción"}</span>
              <span className={`sidebar__demo-pip${isDemo ? " sidebar__demo-pip--on" : ""}`} />
            </button>
          )
        )}
        <a
          href="https://wa.me/34644572604"
          className="sidebar__whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>

        <div className="sidebar__user">
          <div className="sidebar__user-info">
            <div className="sidebar__user-avatar">{initials}</div>
            <div>
              <p className="sidebar__user-name">{fullName}</p>
              <p className="sidebar__user-role">
                {user?.role ? t(`userRoles.${user.role}`) : ""}
              </p>
            </div>
          </div>
          <button
            className="sidebar__logout-btn"
            onClick={handleLogout}
            title={t("common.logout")}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
