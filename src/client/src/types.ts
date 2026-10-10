export type Facility = {
  id: number;
  name: string;
  type: string;
  suburb: string;
  capacity: number;
  amenities?: string[];
  available?: boolean;
  unavailableReason?: string | null;
};
export type Booking = { id: number; facility: string; date: string };
export type Report = {
  ticketId: number;
  facility: string;
  category: string;
  details: string;
  status: string;
  createdAt: string;
};
export type AppNotification = {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
};
export type Announcement = {
  id: number;
  facility: string;
  startDate: string;
  endDate: string;
  message: string;
};
export type AppConfig = {
  today: string;
  minBookingDate: string;
  maxBookingDate: string;
  fullRefundDays: number;
  reportCategories: string[];
  reportStatuses: string[];
  minDetailsLength: number;
  maxDetailsLength: number;
};
export type AuthState = { authenticated: boolean; user?: { email: string } };
