interface HistoryOfLocation {
  address?: string;
  date?: string;
  engineHours?: string;
  latitude?: string;
  longitude?: string;
  odometer?: string;
  speed?: string;
  duration?:number;
  eventType: string;
  status?: string;
  time?: string;
}
export default interface driverStopLocation extends Document {
  driverId: string;
  tenantId: string;
  date: string; // YYYY-MM-DD
  historyOfLocation: HistoryOfLocation[];
  // encryptedHistoryOfLocation: string;
}
