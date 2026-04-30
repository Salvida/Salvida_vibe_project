// frontend/src/pages/Legal/Accessibility.tsx
import LegalPage from "./LegalPage";

export default function Accessibility() {
  return (
    <LegalPage title="Accesibilidad" updatedDate="Enero 2025">
      <div className="legal__section">
        <h2>Nuestro compromiso</h2>
        <p>
          En Salvida creemos que todas las personas deben poder acceder a
          nuestra plataforma de forma independiente. Trabajamos para que
          nuestra web y aplicación cumplan con las pautas de accesibilidad
          web WCAG 2.1 nivel AA.
        </p>
      </div>

      <div className="legal__section">
        <h2>Medidas adoptadas</h2>
        <ul>
          <li>Estructura semántica con HTML5 para facilitar la navegación con lectores de pantalla</li>
          <li>Contraste de color suficiente en todos los elementos de texto</li>
          <li>Textos alternativos en imágenes e iconos</li>
          <li>Navegación completa por teclado</li>
          <li>Etiquetas ARIA donde es necesario</li>
        </ul>
      </div>

      <div className="legal__section">
        <h2>Limitaciones conocidas</h2>
        <p>
          Aunque trabajamos continuamente para mejorar la accesibilidad,
          puede haber áreas de la plataforma que aún no alcancen todos los
          criterios. Estamos comprometidos a resolver cualquier barrera
          identificada.
        </p>
      </div>

      <div className="legal__section">
        <h2>Reportar un problema</h2>
        <p>
          Si encuentras alguna dificultad de accesibilidad al usar nuestra
          plataforma, escríbenos a{" "}
          <a className="legal__contact-link" href="mailto:hola@salvida.es">
            hola@salvida.es
          </a>{" "}
          indicando la página y el problema encontrado. Lo atenderemos con
          la mayor brevedad posible.
        </p>
      </div>
    </LegalPage>
  );
}
