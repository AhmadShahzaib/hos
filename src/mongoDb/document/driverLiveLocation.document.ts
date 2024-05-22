interface HistoryOfLocation {
  address?: string;
  date?: string;
  engineHours?: string;
  latitude?: string;
  longitude?: string;
  odometer?: string;
  speed?: string;
  status?: string;
  time?: string;
}
export default interface DriverLiveLocationDocument extends Document {
  driverId: String;
  tenantId: String;
  date: String; // YYYY-MM-DD
  historyOfLocation: HistoryOfLocation[];
  encryptedHistoryOfLocation: String;
}
