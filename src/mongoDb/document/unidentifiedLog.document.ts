export interface GeoLocation extends Document {
  longitude: string;
  latitude: string;
  address: string;
}

export default interface UnidentifiedLogsDocument extends Document {
  driverId: string;
  eventSequenceIdNumber: string;
  eventRecordStatus: string;
  eventRecordOrigin: string;
  eventType: string;
  eventCode: string;
  eventDate: string;
  eventTime: string;
  accumulatedVehicleMiles: string;
  accumulatedEngineHours: number;
  eventLatitude: string;
  eventLongitude: string;
  distanceSinceLastValidCoordinates: string;
  correspondingCmvOrderNumber: string;
  malfunctionIndicatorStatusForEld: string;
  eventDataCheckValue: string;
  lineDataCheckValue: string;
  cmvVinNo: string;
  eldNumber: string;
  statusCode: string;
  reason: string;
  type: string;
  responseStatus: string;
  origin: {
    longitude: string;
    latitude: string;
    address: string;
  };
  destination: {
    longitude: string;
    latitude: string;
    address: string;
  };
  distance: string;
  duration: string;
  vehicleId: string;
  startEngineHour: string;
  endEngineHour: string;
  startVehicleMiles: string;
  endVehicleMiles: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  rejected: [string];
  tenantId:string;
}
