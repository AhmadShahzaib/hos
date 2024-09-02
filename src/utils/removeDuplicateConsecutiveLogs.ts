/**
 * Function author - Ahmad Shahzaib
 */
import { getIntermediateType } from 'utils/getIntermediateType';

export async function removeDuplicateConsecutiveLogss(logs) {
  const activeLogs = [];
  const filteredLogs = []; // Create a new array for filtered logs
  let previousLog = null; // Track the previous log
  const inActiveLogs = [];
  const intermediateLogs = [];
  const statusLogs = [];
  let finalLogs;

  // Separating inActive logs
  logs.forEach((element, index) => {
    if (element.eventRecordStatus == '2') {
      inActiveLogs.push(element);
    }
  });

  // Separating active logs
  logs.forEach((element, index) => {
    if (element.eventRecordStatus == '1') {
      activeLogs.push(element);
    }
  });

  // Separating pure status logs and intermediate logs
  activeLogs.forEach((element, index) => {
    if (element.eventType == '2') {
      intermediateLogs.push(element);
    } else {
      statusLogs.push(element);
    }
  });

  // The loop will work only on the status logs
  for (const log of statusLogs) {
    // Check if the current log is the same as the previous one
    if (
      previousLog &&
      log.eventCode === previousLog.eventCode &&
      log.eventType === previousLog.eventType
    ) {
      continue; // Skip this log if it's a duplicate
    }

    filteredLogs.push(log); // Add the log to the filteredLogs array
    previousLog = log; // Update the previousLog
  }

  // Merging status logs, intermediate logs and inactive logs
  finalLogs = [...filteredLogs, ...inActiveLogs, ...intermediateLogs];

  return finalLogs;
}

/**
 * Function author - SHarif
 */
export async function removeDuplicateConsecutiveLogs(logs) {
  let filteredLogs = [...logs]; // Copy the original logs array

  let foundDuplicate = true;
  while (foundDuplicate) {
    foundDuplicate = false;
    const newFilteredLogs = [];

    for (let i = 0; i < filteredLogs.length; i++) {
      if (
        i === 0 ||
        filteredLogs[i].eventCode !== filteredLogs[i - 1].eventCode ||
        filteredLogs[i].eventType !== filteredLogs[i - 1].eventType
      ) {
        newFilteredLogs.push(filteredLogs[i]);
      } else {
        foundDuplicate = true;
        if (filteredLogs[i].eventTime < filteredLogs[i - 1].eventTime) {
          newFilteredLogs.pop();
          newFilteredLogs.push(filteredLogs[i]);
        }
      }
    }

    filteredLogs = newFilteredLogs;
  }

  return filteredLogs;
}
export async function moveIntermediateLog(logs, newlog) {
  let filteredLogs = [...logs]; // Copy the original logs array
  let foundlog = false;
  for (let i = 0; i < filteredLogs.length; i++) {
    if (foundlog && filteredLogs[i].eventType !== '2') {
      break;
    }
    if (foundlog && filteredLogs[i].eventType == '2') {
      filteredLogs[i].intermediateType = getIntermediateType(newlog);
      // filteredLogs.splice(i, 1); // comment this line and you will get functionality done.
    }
    if (
      filteredLogs[i].eventSequenceIdNumber == newlog.eventSequenceIdNumber &&
      filteredLogs[i].eventCode == newlog.eventCode &&
      filteredLogs[i].eventType == newlog.eventType
    ) {
      foundlog = true;
    }
  }

  return filteredLogs;
}