import { Schema } from 'mongoose';
import * as mongoose from 'mongoose';
import { CombinedStatuses, GenericStatusTeller } from 'logs/types';
import {
  AppDeviceType,
  EventType,
  LogActionType,
  ViolationType,
} from 'logs/Enums';
import moment from 'moment';

const ViolationTypeArrSchema = {
  statusStartedAt: { type: Number, required: false },
  startedAt: { type: Number, required: false },
  type: { type: String, enum: ViolationType, required: false },
  endedAt: { type: Number, required: false },
};
export const StatusesSchema = new mongoose.Schema({
  calendarStartDate: Number,
  calendarEndDate: Number,
  shiftStartDate: Number,
  shiftEndDate: Number,
  violations: {
    required: true,
    type: Array<{ type: ViolationType; count: Number }>,
    default: [],
  },
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

const logEntryKeys = {
  driverId: { type: Schema.Types.ObjectId, required: true, index: true },
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  serverDate: { type: Number, index: true },
  actionType: {
    enum: LogActionType,
    type: String,
    default: LogActionType.OFF_DUTY,
    index: true,
  },
  isViolation: { required: false, type: Boolean, default: false },
  violations: { required: false, type: [ViolationTypeArrSchema] },
  actionDate: { type: Number, default: null, index: true },
  notes: { required: false, type: String },
  geoLocation: {
    required: false,
    longitude: Number,
    latitude: Number,
    address: String,
  },
  address: { required: false, type: String },
  odoMeterMillage: { required: false, type: Number },
  odoMeterSpeed: { required: false, type: Number },
  engineHours: { required: false, type: Number },
  engineRPMs: { required: false, type: Number },
  statusesData: { required: false, type: StatusesSchema },
  violationType: { required: false, type: String },
  vehicleManualId: { required: true, type: String },
  appVersion: { required: false, type: String },
  deviceVersion: { required: false, type: String },
  OSversion: { required: false, type: String },
  deviceType: {
    required: true,
    enum: AppDeviceType,
    type: String,
    default: 'android',
    index: true,
  },
  annotation: { required: false, type: Number },
  isManual: { required: false, type: Boolean },
  eventType: { required: false, type: String, enum: EventType },
  sequenceNumber: { required: false, type: Number },
  deviceModel: { required: false, type: String },
  eldType: { required: false, type: String },
  malfunction: { required: false, type: String },
};
let editRequestLogEntryKeys = {
  ...logEntryKeys,
  isEdited: { required: false, type: Boolean },
  annotation: { required: false, type: Number },
  notes: { required: false, type: String },
  parentId: { required: false, type: String },
};
let updatedLogEntryKeys = {
  ...logEntryKeys,
  annotation: { required: false, type: Number },
  notes: { required: false, type: String },
  parentId: { required: false, type: String },
};

export const LogsEntrySchema = new mongoose.Schema(
  {
    ...logEntryKeys,
    editRequest: { required: false, type: [editRequestLogEntryKeys] },
    updated: { required: false, type: [updatedLogEntryKeys] },
    isApproved: { required: false, type: Boolean },
  },
  { timestamps: true },
);

export const ShiftDataSchema = new mongoose.Schema(
  {
    shiftStart: { required: true, type: Number },
    shiftEnd: { required: true, type: Number },
    statusesData: { required: true, type: StatusesSchema },
  },
  { _id: false },
);

export const LogsSchema: Schema = new mongoose.Schema(
  {
    driver: {
      id: { type: Schema.Types.ObjectId, required: true, index: true },
      tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
    },
    statusesData: {
      required: false,
      type: StatusesSchema,
    },
    shiftStartDate: { type: Number, default: null, index: true },
    shiftEndDate: { type: Number, default: null, index: true },
    calendarStartDate: { type: Number, required: true, index: true },
    calendarEndDate: {
      type: Number,
      required: false,
      index: true,
      default: null,
    },
    isActive: { type: Boolean, required: true, default: true },
    dutyStatus: {
      enum: LogActionType,
      type: String,
      required: true,
      default: LogActionType.OFF_DUTY,
    },
    continuousOffTimeInSeconds: { type: Number, required: true, default: 0 },
    totalDriveTimeInSecondsSoFar: { type: Number, required: true, default: 0 },
    totalDutyTimeInSecondsSoFar: { type: Number, required: true, default: 0 },
    lastKnownLocation: {
      required: false,
      longitude: Number,
      latitude: Number,
      address: String,
    },
    secondLastKnownLocation: {
      required: false,
      longitude: Number,
      latitude: Number,
      address: String,
    },
    logs: {
      type: [LogsEntrySchema],
    },
    recap: {
      type: [StatusesSchema],
    },
    shiftRecap: [],
    currentStatusInstance: {},
    shiftStartStatus: {
      type: Number,
      default: 0,
    },
    potentialQualifyingPeriod: [],
    prevQualifyingPeriod: [],
    qualifyingPeriod: [],
    isPotentialSatisfied: {
      type: Boolean,
    },
    continuousDriveTime: {
      type: Number,
      default: 0,
    },
    continuousNonDriveTime: {
      type: Number,
      default: 0,
    },
    isStarted: {
      type: Boolean,
      default: false,
    },
    lastEntry: {
      type: logEntryKeys,
    },
  },
  { timestamps: true },
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
