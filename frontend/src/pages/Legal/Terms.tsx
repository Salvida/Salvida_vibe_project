// frontend/src/pages/Legal/Terms.tsx
import LegalPage from "./LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Términos de Servicio" updatedDate="Enero 2025">
      <div className="legal__section">
        <h2>1. Descripción del servicio</h2>
        <p>
          Salvida es una plataforma de gestión de asistencia en escaleras para
          personas con movilidad reducida. El servicio permite a los usuarios
          reservar acompañamiento profesional para acceder y salir de sus
          domicilios de forma segura y digna.
        </p>
      </div>

      <div className="legal__section">
        <h2>2. Aceptación de los términos</h2>
        <p>
          El uso de esta plataforma implica la aceptación de los presentes
          términos. Si no estás de acuerdo con alguno de ellos, te pedimos
          que no hagas uso del servicio.
        </p>
      </div>

      <div className="legal__section">
        <h2>3. Uso correcto de la plataforma</h2>
        <p>El usuario se compromete a:</p>
        <ul>
          <li>Facilitar información veraz y actualizada</li>
          <li>Notificar con antelación suficiente cualquier cancelación</li>
          <li>Tratar con respeto al personal asistente</li>
          <li>No ceder sus credenciales de acceso a terceros</li>
        </ul>
      </div>

      <div className="legal__section">
        <h2>4. Disponibilidad del servicio</h2>
        <p>
          Salvida realiza los esfuerzos razonables para garantizar la
          disponibilidad del servicio, pero no puede garantizar una
          disponibilidad ininterrumpida. Las reservas están sujetas a
          disponibilidad de personal en cada zona y horario.
        </p>
      </div>

      <div className="legal__section">
        <h2>5. Modificaciones</h2>
        <p>
          Salvida se reserva el derecho de modificar estos términos en cualquier
          momento. Los cambios serán comunicados con antelación razonable a
          través de la plataforma o por correo electrónico.
        </p>
      </div>

      <div className="legal__section">
        <h2>6. Legislación aplicable</h2>
        <p>
          Estos términos se rigen por la legislación española. Para cualquier
          controversia, las partes se someten a los tribunales del domicilio
          del usuario, salvo que la normativa establezca otro fuero.
        </p>
      </div>

      <div className="legal__section">
        <h2>7. Contacto</h2>
        <p>
          Para cualquier consulta sobre estos términos, escríbenos a{" "}
          <a className="legal__contact-link" href="mailto:hola@salvida.es">
            hola@salvida.es
          </a>
          .
        </p>
      </div>
    </LegalPage>
  );
}
