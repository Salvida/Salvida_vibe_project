import Header from '../../components/Header/Header';
import { MOCK_PATIENTS } from '../../mockData';
import { Search, Plus, Mail, Phone, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Patients.css';

export default function Patients() {
  return (
    <div className="patients">
      <Header
        title="Mis PRMs"
        subtitle="Gestiona tus pacientes de movilidad reducida"
      />

      <div className="patients__body">
        <div className="patients__inner">

          <div className="patients__toolbar">
            <div className="patients__search-wrap">
              <span className="patients__search-icon">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Buscar PRMs..."
                className="patients__search-input"
              />
            </div>
            <button className="patients__add-btn">
              <Plus size={20} />
              <span>Añadir PRM</span>
            </button>
          </div>

          <div className="patients__table-wrap">
            <div className="patients__table-scroll">
              <table className="patients__table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th className="center">Reservas</th>
                    <th>Última Visita</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PATIENTS.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <Link to={`/patients/${patient.id}`} className="patient-link">
                          <div className="patient-link__avatar">
                            {patient.name.charAt(0)}
                          </div>
                          <span className="patient-link__name">{patient.name}</span>
                        </Link>
                      </td>
                      <td>
                        <div className="patient-contact">
                          <div className="patient-contact__item">
                            <Mail size={12} />
                            <span>{patient.email}</span>
                          </div>
                          <div className="patient-contact__item">
                            <Phone size={12} />
                            <span>{patient.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="patient-bookings">12</td>
                      <td className="patient-date">2024-01-15</td>
                      <td>
                        <span className={`patient-status ${patient.status === 'Activo' ? 'patient-status--active' : 'patient-status--inactive'}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td>
                        <button className="patient-more-btn">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
