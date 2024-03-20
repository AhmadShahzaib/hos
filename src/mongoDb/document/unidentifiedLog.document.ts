export interface GeoLocation extends Document {
  longitude: String;
  latitude: String;
  address: String;
}

export default interface UnidentifiedLogsDocument extends Document {
  driverId: String;
  eventSequenceIdNumber: String;
  eventRecordStatus: String;
  eventRecordOrigin: String;
  eventType: String;
  eventCode: String;
  eventDate: String;
  eventTime: String;
  accumulatedVehicleMiles: String;
  accumulatedEngineHours: Number;
  eventLatitude: String;
  eventLongitude: String;
  distanceSinceLastValidCoordinates: String;
  correspondingCmvOrderNumber: String;
  malfunctionIndicatorStatusForEld: String;
  eventDataCheckValue: String;
  lineDataCheckValue: String;
  cmvVinNo: String;
  eldNumber: String;
  statusCode: String;
  reason: String;
  type: String;
  responseStatus: String;
  origin: {
    longitude: String;
    latitude: String;
    address: String;
  };
  destination: {
    longitude: String;
    latitude: String;
    address: String;
  };
  distance: String;
  duration: String;
  vehicleId: String;
  startEngineHour: String;
  endEngineHour: String;
  startVehicleMiles: String;
  endVehicleMiles: String;
  startDate: String;
  endDate: String;
  startTime: String;
  endTime: String;
  rejected: [String];
  tenantId:String;
}
