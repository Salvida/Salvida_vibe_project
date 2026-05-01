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
