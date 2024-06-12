export default interface EditInsertLogsDocument extends Document {
  driverId: string;
  tenantId: string;
  requestStatus: string;
  isApproved: { type: string; enum: ['confirm', 'cancel', 'pending'] };
  dateTime: string;
  editDate: Date;
  shippingDoc: string;
lastItem:boolean;
  logs: [
    {
      eventSequenceIdNumber: string;
      eventRecordStatus: string;
      eventRecordOrigin: string;
      eventType: string;
      eventCode: string;
      eventDate: string;
      eventTime: string;
      accumulatedVehicleMiles: number;
      accumulatedEngineHours: number;
      eventLatitude: string;
      eventLongitude: string;
      distanceSinceLastValidCoordinates: number;
      correspondingCmvOrderNumber: string;
      userOrderNumberForRecordOriginator: string;
      malfunctionIndicatorStatusForEld: string;
      dataDiagnosticEventIndicatorForDriver: string;
      eventDataCheckValue: string;
      lineDataCheckValue: string;
    },
  ];
  action: string;
  status: string;
  editedBy: {
    id: { type: string };
    name: { type: string };
    role: { type: string };
  };
  type: {
    type: string;
    enum: ['correction', 'transfer'];
  };
  shippingId: {
    type: string;
  };
  trailerNumber: string;
  csvBeforeUpdate: {
    csv: {};
    violations: [];
  };
  csvAfterUpdate: {
    csv: {};
    violations: [];
  };
}
