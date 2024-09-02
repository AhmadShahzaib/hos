import mongoose from 'mongoose';

const historyOfLocation = new mongoose.Schema({
  address: { type: String },
  date: { type: String },
  engineHours: { type: String },
  latitude: { type: String },
  longitude: { type: String },
  odometer: { type: String },
  speed: { type: String },
  eventType: { type: String },
  status: { type: String },
  time: { type: String },
});

export const DriverLiveLocationSchema = new mongoose.Schema(
  {
    driverId: { type: String, required: true },
    vehicleId: { type: String, required: true },
    tenantId: { type: String, required: true },
    date: { type: String, rquired: true }, // YYYY-MM-DD
    historyOfLocation: [historyOfLocation],
    encryptedHistoryOfLocation: { type: String },
  },
  {
    timestamps: true,
  },
);
