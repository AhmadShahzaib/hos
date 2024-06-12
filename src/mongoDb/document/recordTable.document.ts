export default interface RecordTable extends Document {
  driverId: string;
  date: string;
  driverName: string;
  vehicleName: string;
  shippingId: string;
  signature: string;
  hoursWorked: number;
  distance: string;
  violations: [];
  status: {};
  lastKnownActivity: {};
  clock: {};
  homeTerminalTimeZone: {};
  tenantId: string;
  isPti: { type: string; default: '-1' };
}
