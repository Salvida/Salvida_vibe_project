export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  bloodType: string;
  height: string;
  weight: string;
  status: 'Activo' | 'Inactivo';
  avatar?: string;
}

export interface Booking {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  startTime: string;
  endTime: string;
  date: string;
  location: string;
  status: 'Approved' | 'Pending' | 'Completed' | 'Cancelled';
  type?: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'reservation' | 'system' | 'profile' | 'confirmation';
  unread: boolean;
}
