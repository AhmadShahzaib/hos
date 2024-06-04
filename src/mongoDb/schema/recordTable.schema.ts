import mongoose from 'mongoose';

export const RecordTableSchema = new mongoose.Schema(
  {
    driverId: { type: String },
    eventSequenceIdNumber: { type: String, require: true },
    date: { type: String, require: true },
    driverName: { type: String, require: true },
    vehicleName: { type: String, require: true },
    shippingId: { type: String, require: false },
    status: {},
    lastKnownActivity: {},
    clock: {},
    signature: { type: String, require: false },
    hoursWorked: { type: Number, require: true },
    distance: { type: String, require: false },
    violations: [],
    homeTerminalTimeZone: {},
    tenantId: { type: String, require: true },
    isPti: { type: String, default: '-1' },
  },
  {
    timestamps: true,
  },
);
