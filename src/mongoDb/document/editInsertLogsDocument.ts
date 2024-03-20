export default interface EditInsertLogsDocument extends Document {
  driverId: String;
  tenantId: String;
  requestStatus: String;
  isApproved: { type: String; enum: ['confirm', 'cancel', 'pending'] };
  dateTime: String;
  editDate: Date;
  shippingDoc: String;
lastItem:boolean;
  logs: [
    {
      eventSequenceIdNumber: String;
      eventRecordStatus: String;
      eventRecordOrigin: String;
      eventType: String;
      eventCode: String;
      eventDate: String;
      eventTime: String;
      accumulatedVehicleMiles: Number;
      accumulatedEngineHours: Number;
      eventLatitude: String;
      eventLongitude: String;
      distanceSinceLastValidCoordinates: Number;
      correspondingCmvOrderNumber: String;
      userOrderNumberForRecordOriginator: String;
      malfunctionIndicatorStatusForEld: String;
      dataDiagnosticEventIndicatorForDriver: String;
      eventDataCheckValue: String;
      lineDataCheckValue: String;
    },
  ];
  action: String;
  status: String;
  editedBy: {
    id: { type: String };
    name: { type: String };
    role: { type: String };
  };
  type: {
    type: String;
    enum: ['correction', 'transfer'];
  };
  shippingId: {
    type: String;
  };
  trailerNumber: String;
  csvBeforeUpdate: {
    csv: {};
    violations: [];
  };
  csvAfterUpdate: {
    csv: {};
    violations: [];
  };
}
