export default interface RecordTable extends Document {
  driverId: String;
  date: String;
  driverName: String;
  vehicleName: String;
  shippingId: String;
  signature: String;
  hoursWorked: Number;
  distance: String;
  violations: [];
  status: {};
  lastKnownActivity: {};
  homeTerminalTimeZone: {};
  tenantId: String;
  isPti: { type: String; default: '-1' };
}
