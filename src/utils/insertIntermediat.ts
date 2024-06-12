import moment from 'moment';
import { formateDate } from './formateDate';
import { generateUniqueHexId } from './generateEventSeqId';

export function insertIntermediat(
  dutyStatusLogs,
  foundLog,
  statusInfo,
  date,
  time,
  timezone,
) {
  const sqID = generateUniqueHexId();
  let odometer;
  let Ehours;
  let intType;
  if (statusInfo.odometer > '9999') {
    odometer = '9999';
  } else {
    odometer = statusInfo.odometer;
  }
  if (statusInfo.engineHour > '99.9') {
    Ehours = '99.9';
  } else {
    Ehours = statusInfo.engineHour;
  } // for accumalated in future
if(foundLog.eventCode == "1" && foundLog.eventType == "3"){
intType = "2"
}
if(foundLog.eventCode == "2" && foundLog.eventType == "3"){
  intType = "3"
  }
  if(foundLog.eventCode == "3" && foundLog.eventType == "1"){
    intType = "1"
    }
  const drivingIntermediate = {
    CYCLE_START_DATE: foundLog.CYCLE_START_DATE,
    SHIFT_START_DATE: foundLog.SHIFT_START_DATE,
    accumulatedEngineHours: '0',
    accumulatedVehicleMiles: '0',
    address: statusInfo.address,
    correspondingCmvOrderNumber: foundLog.correspondingCmvOrderNumber,
    dataDiagnosticEventIndicatorForDriver:
      foundLog.dataDiagnosticEventIndicatorForDriver,
    distanceSinceLastValidCoordinates:
      foundLog.distanceSinceLastValidCoordinates,
    eventCode: statusInfo.eventCode,
    eventDataCheckValue: '8D',
    eventDate: moment(date).tz(timezone).format('MMDDYY'),
    eventEndTime: '',
    eventLatitude: statusInfo.lat,
    eventLongitude: statusInfo.long,
    eventRecordOrigin: '3',
    eventRecordStatus: '1',
    eventSequenceIdNumber: sqID,
    eventTime: time,
    eventType: statusInfo.eventType,
    lineDataCheckValue: '5B',
    malfunctionIndicatorStatusForEld: '0',
    notes: statusInfo?.notes,
    state: 'Wisconsin',
    totalEngineHoursDutyStatus: statusInfo.engineHour,
    totalVehicleMilesDutyStatus: statusInfo.odometer,
    userOrderNumberForRecordOriginator: '1',
    intermediateType:intType, 
  };
  dutyStatusLogs.push(drivingIntermediate);
  dutyStatusLogs = dutyStatusLogs.sort((a, b) => a.eventTime - b.eventTime);
}
