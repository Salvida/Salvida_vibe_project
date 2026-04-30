// frontend/src/pages/Legal/PrivacyPolicy.tsx
import LegalPage from "./LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Política de Privacidad" updatedDate="Enero 2025">
      <div className="legal__section">
        <h2>1. Responsable del tratamiento</h2>
        <p>
          Salvida es responsable del tratamiento de los datos personales recogidos
          a través de esta plataforma. Para cualquier consulta relacionada con
          tus datos, puedes contactarnos en{" "}
          <a className="legal__contact-link" href="mailto:hola@salvida.es">
            hola@salvida.es
          </a>
          .
        </p>
      </div>

      <div className="legal__section">
        <h2>2. Datos que recogemos</h2>
        <p>Recogemos únicamente los datos necesarios para prestar el servicio:</p>
        <ul>
          <li>Nombre y apellidos</li>
          <li>Correo electrónico y teléfono de contacto</li>
          <li>Dirección del inmueble donde se presta el servicio</li>
          <li>Información de movilidad relevante para la asistencia</li>
        </ul>
      </div>

      <div className="legal__section">
        <h2>3. Finalidad del tratamiento</h2>
        <p>
          Los datos recogidos se utilizan exclusivamente para gestionar las
          reservas de asistencia y coordinar la prestación del servicio de
          acompañamiento en escaleras para personas con movilidad reducida.
        </p>
      </div>

      <div className="legal__section">
        <h2>4. Base legal</h2>
        <p>
          El tratamiento se basa en la ejecución del contrato de servicio
          aceptado por el usuario al registrarse en la plataforma, de acuerdo
          con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
        </p>
      </div>

      <div className="legal__section">
        <h2>5. Conservación de datos</h2>
        <p>
          Los datos se conservan durante el tiempo necesario para la prestación
          del servicio y, posteriormente, durante los plazos legalmente exigidos.
        </p>
      </div>

      <div className="legal__section">
        <h2>6. Tus derechos</h2>
        <p>Tienes derecho a:</p>
        <ul>
          <li>Acceder a tus datos personales</li>
          <li>Rectificar datos inexactos o incompletos</li>
          <li>Solicitar la supresión de tus datos</li>
          <li>Oponerte al tratamiento o solicitar su limitación</li>
          <li>Portabilidad de tus datos</li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, escríbenos a{" "}
          <a className="legal__contact-link" href="mailto:hola@salvida.es">
            hola@salvida.es
          </a>
          .
        </p>
      </div>

      <div className="legal__section">
        <h2>7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas adecuadas para proteger
          tus datos frente a accesos no autorizados, pérdida o divulgación.
        </p>
      </div>
    </LegalPage>
  );
}
