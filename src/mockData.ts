import { Patient, Booking, Notification } from './types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '12345',
    name: 'María García',
    email: 'm.garcia@email.com',
    phone: '+1 (555) 012-3456',
    birthDate: 'Oct 12, 1985',
    bloodType: 'A+',
    height: '165cm',
    weight: '62kg',
    status: 'Activo',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbvLp6QkVbOqGB2ySFMwyN9Tf5TdoMluU6KCbS5Zi1y97Wuf7eOLQBI5kEkMN1ILm_H4EQ-Uy3K3ifVeKIWPcytFxHFirmnU2pAwqxD4Jda1pegBFFrD2_XQx00FbJ4CvqTNhogxeH1nuimyFBf2OmoLIFpIwsIWm3xCFwmHTRY8TfVNcXPlsbVJpO_ymhgR2eaVG68L9OOVBu0ntXsjDv0PrSpt1ZBAZzu2GIKv_7wvZIzS-6BwWq_9KLN8lEtk0_CySN1k4aYg'
  },
  {
    id: 'SLV-8821',
    name: 'Carlos Rodríguez',
    email: 'carlos.r@email.com',
    phone: '+34 612 345 679',
    birthDate: 'Jan 15, 1970',
    bloodType: 'O+',
    height: '175cm',
    weight: '80kg',
    status: 'Activo'
  },
  {
    id: 'SLV-8822',
    name: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    phone: '+34 612 345 680',
    birthDate: 'Mar 22, 1992',
    bloodType: 'B-',
    height: '160cm',
    weight: '55kg',
    status: 'Activo'
  },
  {
    id: 'SLV-8823',
    name: 'Luis Sánchez',
    email: 'luis.s@email.com',
    phone: '+34 612 345 681',
    birthDate: 'Dec 05, 1965',
    bloodType: 'AB+',
    height: '180cm',
    weight: '85kg',
    status: 'Inactivo'
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    patientId: '12345',
    patientName: 'Margaret Smith',
    patientAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8PAqky3tJs1pzPg-90qnGK-5kJAPoxk_npay8Nq85IB5oLcOfpzvhZznX72aYEEMnVpkVmw7QFLJCk_fsGOc7QaEJlrvEyhsFbggDRX28f7TvQwbZVg-2je4LopCSu0Rj4Ygx6fpZs9uHMOUoEzGzCQg396Zc7WHblRWMD8FOrc83WKyVMfDmdBSHxy8blGRBfhwTSDhAct6bex4SXNGmAQehfdSpvcdiKKygRf8I0LxsqceALpDadLH49jAnl_5R06HuoEEYbA',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    date: '2023-10-05',
    location: 'Central Hospital',
    status: 'Approved'
  },
  {
    id: '2',
    patientId: 'SLV-8821',
    patientName: 'Robert Wilson',
    patientAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDPbymThQVyKPrzC-1lASGQe5aMcJGNP0Tdx1NTTySM5HHVVm0LDwnOF04RxCF38l9PFsmA16tEhtN5CH0cGZaWiaXcVXjyBb8f7Db8E2HJe_bBNvkWZOgifo3PcXueLiq6wdJS5vU0URxL9yBPqsM1zl1uosRM9wuUtf4jr5nimaUK8ezKa0seRlEyyU7RUGde5XGPR-lh_2eXLu-kLhT7sGDfoIz7zrpEumuB3EKgwd4nlaOOQ5Ta3cWDEfb6T2HXXfknHid6w',
    startTime: '01:30 PM',
    endTime: '02:45 PM',
    date: '2023-10-05',
    location: 'City Rehab Clinic',
    status: 'Pending'
  },
  {
    id: '3',
    patientId: 'SLV-8822',
    patientName: 'Helen Garcia',
    patientAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2obHsv0f5b9cBqvlAZxK4PztoipB88Cqsu2x2P3XE17SCwLXNTDDOiSDauWhWpzYCsRilqfFhdxL2qFGXGvO01AgpBLFulyfwgGnrQaEk6NoD4RS5HBFCNv0zSPWacfRMtmPMInwpxch0dbyPEy7Kb2bA_OB78ogdmA9vnTPFFKPKlswSq7simjZB9RrVXDhR8mtTZ8CbO9FKtPCBGtITX5nAnJLBtoNf2JMUBDlc_wEaYlq4lImgaB33kd2LUXhZq_VQC32tEw',
    startTime: '04:00 PM',
    endTime: '05:30 PM',
    date: '2023-10-05',
    location: 'Dialysis Center East',
    status: 'Approved'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'New reservation requested by Elena Pérez',
    description: 'Awaiting your confirmation for the appointment',
    time: '2M AGO',
    type: 'reservation',
    unread: true
  },
  {
    id: '2',
    title: 'System Update: Maintenance at 12:00 AM',
    description: 'Scheduled system maintenance will occur tonight',
    time: '1H AGO',
    type: 'system',
    unread: true
  },
  {
    id: '3',
    title: 'Patient Maria Garcia updated her profile',
    description: 'Medical records and contact info were updated',
    time: '4H AGO',
    type: 'profile',
    unread: false
  }
];
