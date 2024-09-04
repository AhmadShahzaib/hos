interface HistoryOfLocation {
  address?: string;
  date?: string;
  engineHours?: string;
  direction?: string;

  latitude?: string;
  longitude?: string;
  odometer?: string;
  speed?: string;
  moving?:string,
  origin: string,
 
  time?: string;
  duration?:number;
 
}
export default interface driverStopLocation extends Document {
  driverId: string;
  vehicleId:string;
  tenantId: string;
  date: string; // YYYY-MM-DD
  historyOfLocation: HistoryOfLocation[];
  // encryptedHistoryOfLocation: string;
}
