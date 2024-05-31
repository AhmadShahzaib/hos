import { formateDate } from './formateDate';
import { generateUniqueHexId } from './generateEventSeqId';
const moment = require('moment-timezone');

export async function createNewLog(
  startTime,
  date,
  endTime,
  eventType,
  eventCode,
  lat,
  long,
  address,
  odometer,
  engineHour,
  truck,
  shippingDocument,
  tralier,
  timezone,
  notes,
  state
) {
  console.log(
    date + '  ----------------------------------------------- date for new log',
  );
  const [year, month, day] = date.split('-');

// Format the date as 'MMDDYY'
const formattedDate = `${month}${day}${year.slice(-2)}`;
  const newLog = {
    CYCLE_START_DATE: 0, // Use appropriate value
    SHIFT_START_DATE: 0, // Use appropriate value
    accumulatedEngineHours: '0',
    accumulatedVehicleMiles: '0',
    address,
    correspondingCmvOrderNumber: '1',
    dataDiagnosticEventIndicatorForDriver: '0',
    distanceSinceLastValidCoordinates: '0',
    eventCode,
    eventDataCheckValue: '0E', // Use appropriate value
    eventDate: formattedDate, // Extract YYMMDD from startTime
    eventEndTime: '',
    eventLatitude: lat,
    eventLongitude: long,
    eventRecordOrigin: '3',
    eventRecordStatus: '1',
    shippingId:shippingDocument ,
    trailerId: tralier,
    // truck add here.
    eventSequenceIdNumber: generateUniqueHexId(), // Use appropriate value
    eventTime: startTime, // Extract HHMMSS from startTime
    eventType,
    lineDataCheckValue: '02', // Use appropriate value
    malfunctionIndicatorStatusForEld: '0',
    notes: notes,
    state: state, // Use appropriate value
    totalEngineHoursDutyStatus: engineHour,
    totalVehicleMilesDutyStatus: odometer,
    userOrderNumberForRecordOriginator: '1',
  };
  console.log(
    moment(date).tz(timezone).format('MMDDYY') +
      '  ----------------------------------------------- date for timezone new log',
  );
  // console.log(
  //   moment(date).tz(timezone) +
  //     '  ----------------------------------------------- date ',
  // );

  // console.log(
  //   moment('2023-09-27').tz('America/Chicago').format('MMDDYY') +
  //     '  ----------------------------------------------- date fixed function',
  // );

  return newLog;
}
