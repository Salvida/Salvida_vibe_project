import { Link, useSearchParams } from "react-router-dom";
import { SalvidaLogo } from "@/assets/icons/SalvidaLogo";
import { useTranslation } from "react-i18next";
import AuthCard from "../../components/AuthCard/AuthCard";
import "./Login.css";

export default function Login() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const showRegister = searchParams.get("register") === "true";

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__logo">
          <div className="login__logo-icon">
            <SalvidaLogo width={60} height={60} className="login__logo-img" />
          </div>
          <span className="login__logo-name">Salvida</span>
        </div>

        {!showRegister && (
          <>
            <h1 className="login__title">{t("login.title")}</h1>
            <p className="login__subtitle">{t("login.subtitle")}</p>
          </>
        )}

        <AuthCard showRegister={showRegister} />

        {!showRegister && (
          <p className="login__back">
            {t("login.noAccount")}{" "}
            <Link to="/login?register=true">{t("login.registerTab")}</Link>
          </p>
        )}
        <p className="login__back">
          <Link to="/">{t("login.backToHome")}</Link>
        </p>
      </div>
    </div>
  );
}
