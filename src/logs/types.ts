import { LogActionType } from './Enums';

export type DutyType = {
  startedAt?: number;
  lastStartedAt?: number;
  counter?: number;
  totalSecondsSpentSoFar?: number;
};

export type ViolationTypeArr = {
  statusStartedAt?: number;
  startedAt?: number;
  type?: string;
  endedAt?: number;
};

export type LogEntry = {
  driverId: string;
  tenantId: string;
  serverDate: number;
  actionType?: LogActionType;
  notes?: string;
  isViolation?: boolean;
  violations?: ViolationTypeArr[];
  actionDate: number;
  geoLocation?: {
    address?: string;
    longitude: number;
    latitude: number;
  };
  odoMeterMillage?: number;
  odoMeterSpeed?: number;
  engineHours?: number;
  engineRPMs?: number;
  statusesData?: PartialStatusesType;
  vehicleManualId: string;
  editRequest?: editRequestLogEntry[];
  updated?: updatedLogEntry[];
  isApproved?: boolean;
  isManual?: boolean;
  id?: string;
  _id?: string;
  annotation?: number;
  parentId?: string;
  eventType?: string;
  sequenceNumber?: number;
  deviceVersion?: string;
  deviceModel?: string;
  eldType?: string;
  malfunction?: string;
};

type editRequestLogEntry = {
  annotation: number;
  notes?: string;
  isEdited?: boolean;
} & LogEntry;

type updatedLogEntry = {
  annotation: number;
  notes?: string;
  isEdited?: boolean;
} & LogEntry;
export type OnDuty = DutyType;

export type LoginLogoutLog = {
  actionDate: number;
  actionType: string;
  driverId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  vehicleId: string;
  odoMeterMillage: number;
  odoMeterSpeed: number;
  engineHours: number;
  engineRPMs: number;
  vehicleManualId: string;
  sequenceNumber: number;
  deviceVersion: string;
  deviceModel: string;
  eldType: string;
};

/**
 * @description OnBreak is being used to track last 30 minutes break.
 */
export type OnBreak = DutyType & {
  is30OrMoreMinutesHasBeen: boolean;
};

export type OnDriving = DutyType;

export type OnSleeperBerth = DutyType & {
  isMinimumSleeperSatisfied?: boolean;
  qualifyingTimeSpentInSeconds?: number;
};

export type OffDuty = DutyType & {
  isMinimumOffForResetSatisfied?: boolean;
  qualifyingTimeSpentInSeconds?: number;
};

export type OnPersonalConveyance = DutyType;

export type OnYardMove = DutyType;

export type CombinedStatuses = {
  calendarStartDate: number;
  calendarEndDate: number;
  shiftStartDate: number;
  shiftEndDate: number;
  violations: Array<{ type: String; count: number }>;
  onDuty: OnDuty;
  onBreak: OnBreak;
  onDriving: OnDriving;
  onSleeperBerth: OnSleeperBerth;
  offDuty: OffDuty;
  onPersonalConveyance: OnPersonalConveyance;
  onYardMove: OnYardMove;
};

export type PartialStatusesType = Partial<CombinedStatuses>;

export type LogsDocumentContentsType = {
  // driverId: string,
  // tenantId: string,
  driver: {
    id: string;
    tenantId: string;
    firstName: string;
    lastName: string;
  };
  statusesData: PartialStatusesType;
  shiftStartDate: number;
  shiftEndDate: number;
  calendarStartDate: number;
  calendarEndDate: number;
  dutyStatus?: LogActionType;
  totalDriveTimeInSecondsSoFar: number;
  totalDutyTimeInSecondsSoFar: number;
  continuousOffTimeInSeconds: number;
  logs: Array<LogEntry>;
  isActive: boolean;
};

export type GenericStatusTeller = {
  actionDate: number;
  actionType: LogActionType;
  startedAt: number;
  lastStartedAt: number;
  totalSecondsSpentSoFar: number;
};

export type statusKeys = 'offDuty' | 'onDuty' | 'onDriving' | 'onSleeperBerth';

export type EditLogEntry = {
  driverId?: string;
  tenantId?: string;
  isApproved: Boolean;
  logs: Array<Array<LogEntry>>;
};
