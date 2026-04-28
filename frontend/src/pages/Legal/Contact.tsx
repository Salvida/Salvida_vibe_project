// frontend/src/pages/Legal/Contact.tsx
import LegalPage from "./LegalPage";

export default function Contact() {
  return (
    <LegalPage title="Contacto" updatedDate="Enero 2025">
      <div className="legal__section">
        <h2>Estamos aquí para ayudarte</h2>
        <p>
          Si tienes alguna pregunta sobre nuestro servicio, necesitas ayuda con
          tu cuenta o quieres solicitar información, puedes contactarnos por
          cualquiera de estas vías:
        </p>
      </div>

      <div className="legal__section">
        <h2>Correo electrónico</h2>
        <p>
          <a className="legal__contact-link" href="mailto:hola@salvida.es">
            hola@salvida.es
          </a>
        </p>
        <p>Respondemos en un plazo máximo de 48 horas laborables.</p>
      </div>

      <div className="legal__section">
        <h2>Teléfono</h2>
        <p>
          <a className="legal__contact-link" href="tel:644572604">
            644 57 26 04
          </a>
        </p>
        <p>Atención telefónica en horario de lunes a viernes, de 9:00 a 18:00.</p>
      </div>

      <div className="legal__section">
        <h2>WhatsApp</h2>
        <p>
          También puedes escribirnos por WhatsApp al{" "}
          <a
            className="legal__contact-link"
            href="https://wa.me/34644572604"
            target="_blank"
            rel="noopener noreferrer"
          >
            644 57 26 04
          </a>
          . Respondemos en el menor tiempo posible.
        </p>
      </div>
    </LegalPage>
  );
}
