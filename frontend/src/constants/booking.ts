import type { Booking } from '../types';

export const STATUS_CLASS: Record<Booking['status'], string> = {
  Approved: 'booking-status--approved',
  Pending: 'booking-status--pending',
  Completed: 'booking-status--completed',
  Cancelled: 'booking-status--cancelled',
  SignPending: 'booking-status--sign-pending',
};
