import { generateUniqueHexId } from './generateEventSeqId';

export async function calculateAccumulatedMiles(csvs) {
  const data = JSON.parse(JSON.stringify(csvs));
  const csv = JSON.parse(JSON.stringify(csvs.csvAfterUpdate.csv));
  let dutyLogs = csv.eldEventListForDriversRecordOfDutyStatus.filter(
    (element) => {
      return element.eventRecordStatus != '2';
    },
  );
  if (dutyLogs.length > 1) {
    for (let i = 0; i < dutyLogs.length; i++) {
      let distance = 0;
      let enginHours = 0;
      if (i != dutyLogs.length - 1) {
        distance =
          Number(dutyLogs[i + 1].totalVehicleMilesDutyStatus) -
          Number(dutyLogs[i].totalVehicleMilesDutyStatus);
        enginHours =
          Number(dutyLogs[i + 1].totalEngineHoursDutyStatus) -
          Number(dutyLogs[i].totalEngineHoursDutyStatus);

        if (distance < 0 || enginHours < 0) {
          distance = 0;
          enginHours = 0;
        }
        if (distance > 9999) {
          distance = 9999;
        }
        if (enginHours > 99.9) {
          enginHours = 99.9;
        }
        dutyLogs[i].accumulatedVehicleMiles = distance + '';
        dutyLogs[i].accumulatedEngineHours = enginHours + '';
      } else {
        dutyLogs[i].accumulatedVehicleMiles = '0';
        dutyLogs[i].accumulatedEngineHours = '0';
      }
    }
    for (let i = 1; i < dutyLogs.length; i++) {
      if (
        parseInt(dutyLogs[i].totalVehicleMilesDutyStatus) <
        parseInt(dutyLogs[i - 1].totalVehicleMilesDutyStatus)
      ) {
        dutyLogs[i].isOdometer = '1';
      } else {
        dutyLogs[i].isOdometer = '0';
      }
      if (
        parseInt(dutyLogs[i].totalEngineHoursDutyStatus) <
        parseInt(dutyLogs[i - 1].totalEngineHoursDutyStatus)
      ) {
        dutyLogs[i].isEngineHours = '1';
      } else {
        dutyLogs[i].isEngineHours = '0';
      }
    }
  }

  dutyLogs = odometerViolationWithoutDriving(dutyLogs);
  data.csvAfterUpdate.csv.eldEventListForDriversRecordOfDutyStatus = dutyLogs;
  return data;
}

/**
 * @description : The function below validates if the truck has odometer changes without changing on driving status.
 */
function odometerViolationWithoutDriving(logs) {
  const violationEventType = ['1'];
  const violationEventCode = ['1', '2', '4'];

  for (let i = 0; i < logs.length - 1; i++) {
    let nextIndex = i;
    nextIndex += 1;

    if (
      violationEventType.includes(logs[i].eventType) &&
      violationEventCode.includes(logs[i].eventCode)
    ) {
      logs[i].isOdometer = '0';

      if (
        logs[i].totalVehicleMilesDutyStatus !=
        logs[nextIndex].totalVehicleMilesDutyStatus
      ) {
        logs[i].isOdometer = '1';
      }
    }
  }
  return logs;
}
