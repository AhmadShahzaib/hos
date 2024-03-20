import mongoose from 'mongoose';

export const EditInsertLogHistorySchema = new mongoose.Schema(
  {
    driverId: String,
    driver: {
      id: { type: String },
      name: { type: String },
    },
    editedBy: {},
    dateTime: String,
    status: {
      type: String,
    },
    isApproved: String,
  },
  {
    timestamps: true,
  },
);