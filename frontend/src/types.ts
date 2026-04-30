export interface Address {
  id: string;
  full_address: string;
  lat?: number;
  lng?: number;
  validation_status: 'pending' | 'validated' | 'rejected';
  validation_notes?: string;
  is_accessible: boolean;
  alias?: string;
  prm_id?: string;
  floor?: string;
  door?: string;
  created_by?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface Prm {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  bloodType: string;
  height?: number;
  weight?: number;
  status: 'Activo' | 'Inactivo';
  avatar?: string;
  dni?: string;
  addresses: Address[];
  emergency_contacts?: EmergencyContact[];
  is_demo?: boolean;
  created_by?: string;
  owner_name?: string;
  booking_count?: number;
  last_booking_date?: string;
}

export type ServiceReason =
  | 'medical_appointment'
  | 'physiotherapy'
  | 'dialysis'
  | 'hospital_admission'
  | 'administrative'
  | 'other';

export interface Booking {
  id: string;
  prmId: string;
  prmName: string;
  prmAvatar?: string;
  startTime: string;
  endTime: string;
  date: string;
  address: string;
  addressId?: string;
  lat?: number;
  lng?: number;
  status: 'Approved' | 'Pending' | 'Completed' | 'Cancelled';
  service_reason?: ServiceReason;
  service_reason_notes?: string;
  is_demo?: boolean;
  created_by_admin?: boolean;
  owner_name?: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'reservation' | 'system' | 'profile' | 'confirmation';
  unread: boolean;
}

export interface NotificationPrefs {
  email: boolean;
  push: boolean;
  booking_reminder: boolean;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  dni?: string;
  role: UserRole;
  avatar?: string;
  notification_prefs?: NotificationPrefs;
  isActive?: boolean;
  demoModeActive?: boolean;
  isDemo?: boolean;
}

export interface CreateUserRequest {
  email: string;
  method: 'invite' | 'direct';
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  organization?: string;
  role: UserRole;
  is_demo?: boolean;
}
