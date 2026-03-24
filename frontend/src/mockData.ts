import { Patient, Booking, Notification, UserProfile } from './types';

export const MOCK_USER: UserProfile = {
  id: 'user-1',
  firstName: 'Julia',
  lastName: 'Ross',
  email: 'julia.ross@salvida.com',
  phone: '+34 612 345 678',
  organization: 'Salvida Management',
  dni: '12345678A',
  role: 'Administradora',
  notification_prefs: {
    email: true,
    push: false,
    booking_reminder: true,
  },
};

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '12345',
    name: 'María García',
    email: 'm.garcia@email.com',
    phone: '+34 612 345 001',
    birthDate: '12 Oct 1985',
    bloodType: 'A+',
    height: '165cm',
    weight: '62kg',
    status: 'Activo',
    dni: '87654321B',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbvLp6QkVbOqGB2ySFMwyN9Tf5TdoMluU6KCbS5Zi1y97Wuf7eOLQBI5kEkMN1ILm_H4EQ-Uy3K3ifVeKIWPcytFxHFirmnU2pAwqxD4Jda1pegBFFrD2_XQx00FbJ4CvqTNhogxeH1nuimyFBf2OmoLIFpIwsIWm3xCFwmHTRY8TfVNcXPlsbVJpO_ymhgR2eaVG68L9OOVBu0ntXsjDv0PrSpt1ZBAZzu2GIKv_7wvZIzS-6BwWq_9KLN8lEtk0_CySN1k4aYg',
    emergency_contacts: [
      { id: 'ec-1', name: 'Pedro García', phone: '+34 612 000 001', relationship: 'Hijo' },
      { id: 'ec-2', name: 'Carmen López', phone: '+34 612 000 002', relationship: 'Asistente' },
    ],
    address: {
      id: 'addr-1',
      full_address: 'Calle Mayor 12, 28001 Madrid',
      lat: 40.4153,
      lng: -3.7074,
      validation_status: 'validated',
      is_accessible: true,
    },
    is_demo: true,
  },
  {
    id: 'SLV-8821',
    name: 'Carlos Rodríguez',
    email: 'carlos.r@email.com',
    phone: '+34 612 345 002',
    birthDate: '15 Ene 1970',
    bloodType: 'O+',
    height: '175cm',
    weight: '80kg',
    status: 'Activo',
    dni: '11223344C',
    emergency_contacts: [
      { id: 'ec-3', name: 'Ana Rodríguez', phone: '+34 612 000 003', relationship: 'Hija' },
    ],
    address: {
      id: 'addr-2',
      full_address: 'Avenida de la Paz 45, 28020 Madrid',
      validation_status: 'pending',
      is_accessible: false,
    },
    is_demo: true,
  },
  {
    id: 'SLV-8822',
    name: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    phone: '+34 612 345 003',
    birthDate: '22 Mar 1992',
    bloodType: 'B-',
    height: '160cm',
    weight: '55kg',
    status: 'Activo',
    dni: '55667788D',
    emergency_contacts: [
      { id: 'ec-4', name: 'Luis Martínez', phone: '+34 612 000 004', relationship: 'Hermano' },
      { id: 'ec-5', name: 'Rosa Sánchez', phone: '+34 612 000 005', relationship: 'Vecina' },
    ],
    is_demo: true,
  },
  {
    id: 'SLV-8823',
    name: 'Luis Sánchez',
    email: 'luis.s@email.com',
    phone: '+34 612 345 004',
    birthDate: '05 Dic 1965',
    bloodType: 'AB+',
    height: '180cm',
    weight: '85kg',
    status: 'Inactivo',
    dni: '99887766E',
    is_demo: true,
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    patientId: '12345',
    patientName: 'María García',
    patientAvatar: MOCK_PATIENTS[0].avatar,
    startTime: '10:00',
    endTime: '12:00',
    date: '2026-03-23',
    location: 'Hospital La Paz',
    status: 'Approved',
    service_reason: 'medical_appointment',
    is_demo: true,
  },
  {
    id: '2',
    patientId: 'SLV-8821',
    patientName: 'Carlos Rodríguez',
    startTime: '13:30',
    endTime: '14:45',
    date: '2026-03-23',
    location: 'Clínica de Rehabilitación Norte',
    status: 'Pending',
    service_reason: 'physiotherapy',
    is_demo: true,
  },
  {
    id: '3',
    patientId: 'SLV-8822',
    patientName: 'Ana Martínez',
    startTime: '16:00',
    endTime: '17:30',
    date: '2026-03-23',
    location: 'Centro de Diálisis Este',
    status: 'Approved',
    service_reason: 'dialysis',
    is_demo: true,
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Nueva reserva solicitada por Elena Pérez',
    description: 'Pendiente de confirmación para la cita',
    time: 'Hace 2 min',
    type: 'reservation',
    unread: true
  },
  {
    id: '2',
    title: 'Actualización del sistema: Mantenimiento a las 00:00',
    description: 'Se realizará mantenimiento programado esta noche',
    time: 'Hace 1 hora',
    type: 'system',
    unread: true
  },
  {
    id: '3',
    title: 'María García ha actualizado su perfil',
    description: 'Se han actualizado los datos médicos y de contacto',
    time: 'Hace 4 horas',
    type: 'profile',
    unread: false
  }
];
