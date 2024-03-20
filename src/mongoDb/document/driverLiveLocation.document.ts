export default interface DriverLiveLocationDocument extends Document {
  driverId: String;
  //   unitId: String;
  tenantId: String;
  historyOfLocation: [{}];
}
