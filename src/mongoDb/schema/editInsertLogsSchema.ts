import mongoose from 'mongoose';

export const EditInsertLogsSchema = new mongoose.Schema(
  {
    driverId: String,
    tenantId: String,
    requestStatus: String, // holds notification sent status
    isApproved: {
      type: String,
      default: 'pending',
      enum: ['confirm', 'cancel', 'pending'],
    },
    dateTime: String,
    editDate: Date,
    lastItem:Boolean,
    logs: [
      // holds edited log
      {
        eventSequenceIdNumber: String,
        eventRecordStatus: String,
        eventRecordOrigin: String,
        eventType: String,
        eventCode: String,
        eventDate: String,
        eventTime: String,
        accumulatedVehicleMiles: Number,
        accumulatedEngineHours: Number,
        eventLatitude: String,
        eventLongitude: String,
        distanceSinceLastValidCoordinates: Number,
        correspondingCmvOrderNumber: String,
        userOrderNumberForRecordOriginator: String,
        malfunctionIndicatorStatusForEld: String,
        dataDiagnosticEventIndicatorForDriver: String,
        eventDataCheckValue: String,
        lineDataCheckValue: String,
      },
    ],
    action: String, // holds performed action ["Accept", "Reject"]
    status: String, // holds status string, who accepted/rejected the request
    editedBy: {
      id: { type: String },
      name: { type: String },
      role: { type: String },
    },
    type: {
      type: String,
      enum: ['correction', 'transfer'],
    },
    shippingId: {
      type: String,
    },
    trailerNumber: String,
    csvBeforeUpdate: {
      csv: {},
      violations: [],
    },
    csvAfterUpdate: {
      csv: {},
      violations: [],
    },
  },
  {
    timestamps: true,
  },
);
