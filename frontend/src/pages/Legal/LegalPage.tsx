// frontend/src/pages/Legal/LegalPage.tsx
import { useNavigate } from "react-router-dom";
import "./LegalPage.css";

interface LegalPageProps {
  title: string;
  updatedDate: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, updatedDate, children }: LegalPageProps) {
  const navigate = useNavigate();

  return (
    <div className="legal">
      <nav className="legal__nav">
        <button className="legal__back-btn" onClick={() => navigate("/")}>
          ← Volver al inicio
        </button>
        <span className="legal__brand">Salvida</span>
      </nav>
      <div className="legal__content">
        <h1 className="legal__title">{title}</h1>
        <p className="legal__updated">Última actualización: {updatedDate}</p>
        {children}
      </div>
    </div>
  );
}
