import {
  AppDeviceType,
  EventType,
  LogActionType,
  ViolationType,
} from 'logs/Enums';
import {
  CombinedStatuses,
  OffDuty,
  OnBreak,
  OnDriving,
  OnDuty,
  OnSleeperBerth,
  PartialStatusesType,
  OnPersonalConveyance,
  OnYardMove,
  DutyType,
} from 'logs/types';
import { Document, Schema } from 'mongoose';

export interface ViolationTypeArrDocument extends Document {
  statusStartedAt?: number;
  startedAt?: number;
  type?: string;
  endedAt?: number;
}
export interface CommonLogEntryKeysDocument extends Document {
  id?: string;
  driverId: string;
  tenantId: string;
  serverDate: Number;
  actionType: LogActionType;
  isViolation: boolean;
  violations?: Array<ViolationTypeArrDocument>;
  actionDate: Number;
  notes?: string;
  geoLocation?: {
    longitude: number;
    latitude: number;
    address?: string;
  };
  address: string;
  odoMeterMillage?: number;
  odoMeterSpeed?: number;
  engineHours?: number;
  engineRPMs?: number;
  statusesData?: PartialStatusesType; //TODO: Umer: <= this needs to be renamed to statusData as the property is pointing to one status at a time.
  violationType?: String;
  vehicleManualId: String;
  appVersion?: String;
  deviceVersion?: String;
  OSversion?: String;
  deviceType?: AppDeviceType;
  annotation?: number;
  isApproved?: Boolean;
  isManual?: Boolean;
  eventType?: EventType;
  sequenceNumber?: number;
  deviceModel?: String;
  eldType?: String;
  malfunction?: String;
}

export interface ExtendedWithEditRequestLogsEntryDocument
  extends LogsEntryDocument {
  annotation?: number;
  notes?: string;
  isEdited?: boolean;
  parentId?: string;
}
export interface ExtendedWithUpdatedLogsEntryDocument
  extends LogsEntryDocument {
  annotation?: number;
  notes?: string;
  parentId?: string;
}
export interface LogsEntryDocument extends CommonLogEntryKeysDocument {
  editRequest?: Array<ExtendedWithEditRequestLogsEntryDocument>;
  updated?: Array<ExtendedWithUpdatedLogsEntryDocument>;
}

export default interface LogsDocument extends Document {
  id: string;
  driver: {
    id: string;
    tenantId: string;
    firstName: string;
    lastName: string;
  };
  statusesData: StatusesDocument;
  shiftStartDate: number;
  shiftEndDate: number;
  calendarStartDate: number;
  calendarEndDate: number;
  dutyStatus: LogActionType;
  totalDriveTimeInSecondsSoFar: number;
  totalDutyTimeInSecondsSoFar: number;
  continuousOffTimeInSeconds: number;
  continuousDriveTime: number;
  continuousNonDriveTime: number;
  lastKnownLocation?: {
    longitude: number;
    latitude: number;
    address?: string;
  };
  secondLastKnownLocation?: {
    longitude: number;
    latitude: number;
    address?: string;
  };

  isActive: boolean;
  logs: Array<LogsEntryDocument>;
  recap: Array<StatusesDocument>;
  logEntryIds?: Array<string>;
  // New additions
  shiftRecap: Array<DutyType>;
  currentStatusInstance: DutyType;
  shiftStartStatus: number;
  potentialQualifyingPeriod: Array<number>;
  prevQualifyingPeriod: Array<number>;
  qualifyingPeriod: Array<number>;
  isPotentialSatisfied: boolean;
  isStarted: boolean;
  lastEntry: LogsEntryDocument;
}
export default interface DriverCsvDocument extends Document {
  month: string,
  day: string,
  raw: Array<any>,
  csv: {

    eldFileHeaderSegment: {
      "eldRegistrationId": string,
      "eldIdentifier": string,
      "eldAuthenticationValue": string,
      "outputFileComment": string,
      "lineDataCheckValue": string
    },
    driverInfo: {
      "lastName": string,
      "firstName": string,
      "eldUsername": string,
      "driverLicenseIssuingState": string,
      "driverLicenseNumber": string,
      "lineDataCheckValue": number
    },
    "coDriver": {
      "coDriverLastName": string
      "coDriverFirstName": string
      "eldUsernameForCoDriver": string
      "lineDataCheckValue": number
    },
    "powerUnitLine": {
      "powerUnitNumber": number,
      "cmvVin": number,
      "trailerNumber": "",
      "lineDataCheckValue": number
    },
    "carrierLine": {
      "carriersUSDOTNumber": number,
      "carrierName": string,
      "multiDayBasisUsed": string,
      "24HourPeriodStartingTime": string,
      "timeZoneOffsetFromUtc": number,
      "lineDataCheckValue": number
    },
    "shippingLine": {
      "shippingDocumentNumber": number,
      "exemptDriverConfiguration": string,
      "lineDataCheckValue": number
    },
    "timePlaceLine": {
      "currentDate": string,
      "currentTime": string,
      "currentLatitude": number,
      "currentLongitude": number,
      "currentTotalVehicleMiles": number,
      "currentTotalEngineHours": number,
      "lineDataCheckValue": number
    },

    "eldIdLine": {
      "eldRegistrationId": string,
      "eldIdentifier": string,
      "eldAuthenticationValue": string,
      "outputFileComment": string,
      "lineDataCheckValue": number
    },
    "userList": {
      "assignedUserOrderNumber": number,
      "userEldAccountType": string,
      "userLastName": string,
      "userFirstName": string,
      "lineDataCheckValue": number
    },
    "cmvList": [
      {
        "assignedUserCmvOrderNumber": number,
        "cmvPowerUnitNumber": number,
        "cmvVin": number,
        "lineDataCheckValue": number
      }
    ],
    "eventAnnotationsCommentsAndDriverLocation": [
      {
        "eventSequenceIdNumber": number,
        "eldUsernameOfRecordOriginator": string,
        "eventCommentOrAnnotation": string,
        "eventDate": number,
        "eventTime": number,
        "driverLocationDescription": string,
        "lineDataCheckValue": number
      }
    ],
    "eldEventListForDriverCertificationOfOwnRecords": [
      {
        "eventSequenceIdNumber": number,
        "eventCode": number,
        "eventDate": number,
        "eventTime": number,
        "dateOfTheCertifiedRecord": number,
        "correspondingCmvOrderNumber": number,
        "lineDataCheckValue": number
      }
    ],
    "malfunctionsAndDiagnosticEventRecords": [
      {
        "eventSequenceIdNumber": number,
        "eventCode": number,
        "malfunctionOrDiagnosticCode": number,
        "eventDate": number,
        "eventTime": number,
        "totalVehicleMiles": number,
        "totalEngineHours": number,
        "correspondingCmvOrderNumber": number,
        "lineDataCheckValue": number
      }
    ],

    "eventLogListForUnidentifiedDriverProfile": [
      {
        "eventSequenceIdNumber": string,
        "eventRecordStatus": string,
        "eventRecordOrigin": string,
        "eventType": string,
        "eventCode": number,
        "eventDate": number,
        "eventTime": number,
        "accumulatedVehicleMiles": number,
        "accumulatedEngineHours": number,
        "eventLatitude": number,
        "eventLongitude": number,
        "distanceSinceLastValidCoordinates": number,
        "correspondingCmvOrderNumber": number,
        "malfunctionIndicatorStatusForEld": string,
        "eventDataCheckValue": number,
        "lineDataCheckValue": number
      }
    ],
    "fileDataCheckLine": {
      "fileDataCheckValue": number
    },

    "eldEventListForDriversRecordOfDutyStatus": [
      {
        "eventSequenceIdNumber": number,
        "eventRecordStatus": string,
        "eventRecordOrigin": string,
        "eventType": string,
        "eventCode": number,
        "eventDate": number,
        "eventTime": number,
        "accumulatedVehicleMiles": number,
        "accumulatedEngineHours": number,
        "eventLatitude": number,
        "eventLongitude": number,
        "distanceSinceLastValidCoordinates": number,
        "correspondingCmvOrderNumber": number,
        "userOrderNumberForRecordOriginator": number,
        "malfunctionIndicatorStatusForEld": string,
        "dataDiagnosticEventIndicatorForDriver": string,
        "eventData": string,
        "checkValue": number,
        "lineDataCheckValue": number
      }
    ],
    "eldLoginLogoutReport": [
      {
        "eventSequenceIdNumber": number,
        "eventCode": number,
        "eldUsername": string,
        "eventDate": number,
        "eventTime": number,
        "totalVehicleMiles": number,
        "totalEngineHours": number,
        "lineDataCheckValue": number
      }
    ],
    "cmvEnginePowerUpShutDownActivity": [
      {
        "eventSequenceIdNumber": number,
        "eventCode": number,
        "eventDate": number,
        "eventTime": number,
        "totalVehicleMiles": number,
        "totalEngineHours": number,
        "eventLatitude": number,
        "eventLongitude": number,
        "cmvPowerUnitNumber": number,
        "cmvVin": number,
        "trailerNumber": number,
        "shippingDocumentNumber": number,
        "lineDataCheckValue": number
      }
    ]
  },
  meta: {},
  snapShot: {}
}

export interface StatusesDocument extends Document {
  calendarStartDate: number;
  calendarEndDate: number;
  shiftStartDate: number;
  shiftEndDate: number;
  violations: Array<{ type: ViolationType; count: number }>;
  onDuty: OnDuty;
  offDuty: OffDuty;
  onDriving: OnDriving;
  onBreak: OnBreak;
  onSleeperBerth: OnSleeperBerth;
  onPersonalConveyance: OnPersonalConveyance;
  onYardMove: OnYardMove;
}

export interface LogEditRequestHistoryDocument extends Document {
  driver: {
    id: string;
    tenantId: string;
    firstName: string;
    lastName: string;
  };
  editedBy: {
    id: string;
    name: string;
    editedDay: Number;
  };
  date: Number;
  parentLogDocumentId: string;
  isApproved?: Boolean;
  notes?: string;
}

export default interface unidentifiedLogsDocument extends Document {
  eventSequenceIdNumber: Number,
  eventRecordStatus: String,
  eventRecordOrigin: String,
  eventType: String,
  eventCode: String,
  eventDate: String,
  eventTime: String,
  accumulatedVehicleMiles: Number,
  accumulatedEngineHours: Number,
  eventLatitude: String,
  eventLongitude: String,
  distanceSinceLastValidCoordinates: String,
  correspondingCmvOrderNumber: String,
  malfunctionIndicatorStatusForEld: String,
  eventDataCheckValue: String,
  lineDataCheckValue: String,
  cmvVin: String,
  eldnumber: String
}