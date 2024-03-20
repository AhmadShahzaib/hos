import mongoose from 'mongoose';

export const HistorySchema = new mongoose.Schema(
  {
    editedBy: {
      id: { type: String },
      name: { type: String },
    },
    type: {
      type: String,
      enum: ['correction', 'transfer'],
    },
    csvBeforeUpdate: {},
    csvAfterUpdate: {},
  },
  {
    timestamps: true,
  },
);
