import mongoose from 'mongoose';

const historyOfLocation = new mongoose.Schema({
  address: { type: String },
  date: { type: String },
  engineHours: { type: String },
  latitude: { type: String },
  longitude: { type: String },
  odometer: { type: String },
  duration:{type:Number},
  speed: { type: String },
  eventType: { type: String },
  status: { type: String },
  time: { type: String },
});

export const DriverStopLocationSchema = new mongoose.Schema(
  {
    driverId: { type: String, required: true },
    tenantId: { type: String, required: true },
    date: { type: String, rquired: true }, // YYYY-MM-DD
    historyOfLocation: [historyOfLocation],
    encryptedHistoryOfLocation: { type: String },
  },
  {
    timestamps: true,
  },
);
