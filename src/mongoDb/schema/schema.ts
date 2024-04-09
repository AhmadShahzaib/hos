import { Schema } from 'mongoose';
import * as mongoose from 'mongoose';

import moment from 'moment';


export const StatusesSchema = new mongoose.Schema({
  calendarStartDate: Number,
  calendarEndDate: Number,
  shiftStartDate: Number,
  shiftEndDate: Number,
  
  onDuty: {
    required: false,
    startedAt: { type: Number, index: true },
    lastStartedAt: Number,
    counter: Number,
    totalSecondsSpentSoFar: Number,
  },

  onBreak: {
    required: false,
    startedAt: { type: Number, index: true },
    lastStartedAt: Number,
    counter: Number,
    totalSecondsSpentSoFar: Number,
    is30OrMoreMinutesHasBeen: Boolean,
  },

  onDriving: {
    required: false,
    startedAt: { type: Number, index: true },
    lastStartedAt: Number,
    counter: Number,
    totalSecondsSpentSoFar: Number,
  },

  onSleeperBerth: {
    required: false,
    startedAt: { type: Number, index: true },
    lastStartedAt: Number,
    counter: Number,
    totalSecondsSpentSoFar: Number,
    isMinimumSleeperSatisfied: Boolean,
    qualifyingTimeSpentInSeconds: Number,
  },

  offDuty: {
    required: false,
    startedAt: { type: Number, index: true },
    lastStartedAt: Number,
    counter: Number,
    totalSecondsSpentSoFar: Number,
    isMinimumOffForResetSatisfied: Boolean,
    qualifyingTimeSpentInSeconds: Number,
  },

  onPersonalConveyance: {
    required: false,
    startedAt: { type: Number, index: true },
    lastStartedAt: Number,
    counter: Number,
    totalSecondsSpentSoFar: Number,
  },

  onYardMove: {
    required: false,
    startedAt: { type: Number, index: true },
    lastStartedAt: Number,
    counter: Number,
    totalSecondsSpentSoFar: Number,
  },
});





export const ShiftDataSchema = new mongoose.Schema(
  {
    shiftStart: { required: true, type: Number },
    shiftEnd: { required: true, type: Number },
    statusesData: { required: true, type: StatusesSchema },
  },
  { _id: false },
);



export const LogEditRequestHistorySchema: Schema = new mongoose.Schema(
  {
    driver: {
      id: { type: Schema.Types.ObjectId, required: true },
      tenantId: { type: Schema.Types.ObjectId, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
    },
    editedBy: {
      id: { type: Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      editedDay: { type: Number, required: true },
    },
    date: { type: Number, required: true },
    version: { type: Number, required: true, default: 1 },
    parentLogDocumentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    isApproved: { type: Boolean, required: false },
    notes: { type: String, required: false },
  },
  { timestamps: true },
);

export const DriverCsvSchema: Schema = new mongoose.Schema(
  {
    month: { type: Number, required: true },
    day: { type: Number, required: true },
    date: { type: String, required: false },
    userId: { type: String, required: false },
    originalLogs: { type: {}, required: true },
    csv: { type: {}, required: true },
    meta: { type: {} },
    snapshot: { type: {}, required: false },
  },
  { timestamps: false },
);

export const unidentifiedLogsSchema = new mongoose.Schema({
  eventSequenceIdNumber: { type: Number, require: true },
  eventRecordStatus: { type: String, required: true },
  eventRecordOrigin: { type: String, required: true },
  eventType: { type: String, required: true },
  eventCode: { type: String, required: true },
  eventDate: { type: String, required: true },
  eventTime: { type: String, required: true },
  accumulatedVehicleMiles: { type: Number, required: true },
  accumulatedEngineHours: { type: Number, required: true },
  eventLatitude: { type: String, required: true },
  eventLongitude: { type: String, required: true },
  distanceSinceLastValidCoordinates: { type: String, required: true },
  correspondingCmvOrderNumber: { type: String, required: true },
  malfunctionIndicatorStatusForEld: { type: String, required: true },
  eventDataCheckValue: { type: String, required: true },
  lineDataCheckValue: { type: String, required: true },
  cmvVin: { type: String, required: true },
  eldnumber: { type: String, required: true },
});
