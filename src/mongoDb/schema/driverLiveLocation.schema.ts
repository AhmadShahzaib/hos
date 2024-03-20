import mongoose from 'mongoose';

export const DriverLiveLocationSchema = new mongoose.Schema(
  {
    driverId: { type: String, required: true },
    // unitId: String,
    tenantId: { type: String, required: true },
    historyOfLocation: [{}],
  },
  {
    timestamps: true,
  },
);
