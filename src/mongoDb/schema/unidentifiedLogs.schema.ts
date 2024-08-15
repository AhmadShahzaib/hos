import mongoose from 'mongoose';

const GeoLocation = {
  longitude: String,
  latitude: String,
  address: String,
};

export const UnidentifiedLogsSchema = new mongoose.Schema(
  {
    driverId: { type: String, default: 'unidentified' },
    eventSequenceIdNumber: { type: String, require: false },
    eventRecordStatus: { type: String, required: true },
    eventRecordOrigin: { type: String, required: true },
    eventType: { type: String, required: false },
    eventCode: { type: String, required: false },
    eventDate: { type: String, required: true },
    eventTime: { type: String, required: true },
    accumulatedVehicleMiles: { type: String, required: true },
    accumulatedEngineHours: { type: Number, required: true },
    eventLatitude: { type: String, required: true },
    eventLongitude: { type: String, required: true },
    distanceSinceLastValidCoordinates: { type: String, required: true },
    correspondingCmvOrderNumber: { type: String, required: true },
    malfunctionIndicatorStatusForEld: { type: String, required: true },
    eventDataCheckValue: { type: String, required: true },
    lineDataCheckValue: { type: String, required: true },
    cmvVinNo: { type: String, required: true },
    eldNumber: { type: String, required: true },
    statusCode: { type: String },
    reason: { type: String },
    type: {
      type: String,
      enum: [
        'unidentified-unassigned',
        'unidentified-assigned',
        'unidentified-accepted',
      ],
      default: 'unidentified-unassigned',
    },
    responseStatus: { type: String, default: 'pending' },
    origin: {
      longitude: String,
      latitude: String,
      address: String,
    },
    destination: {
      longitude: String,
      latitude: String,
      address: String,
    },
    distance: { type: String },
    duration: { type: String },
    vehicleId: { type: String },
    startEngineHour: { type: String },
    endEngineHour: { type: String },
    startVehicleMiles: { type: String },
    endVehicleMiles: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    rejected: [],
    tenantId: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Create a virtual getter for id
UnidentifiedLogsSchema.virtual('id').get(function () {
  return (this.id = this._id);
});

// Apply the virtual getter to all output documents
UnidentifiedLogsSchema.set('toJSON', { virtuals: true });
UnidentifiedLogsSchema.set('toObject', { virtuals: true });
