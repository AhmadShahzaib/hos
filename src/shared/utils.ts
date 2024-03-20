import { LogActionType, StatusKey, ViolationType } from 'logs/Enums';
import moment from 'moment';

export const dateRangeForDriverLog = (startDateEpoch, endDateEpoch) => {
  return {
    'logs.actionDate': {
      $gte: startDateEpoch,
      $lte: endDateEpoch,
    },
  };
};

export const formatGraphData = async (data) => {
  const formattedArr = [];
  for (let index = 0; index < data.length; index++) {
    const parent = data[index];
    let obj = { ...parent };
    if (parent.updated && parent.updated.length > 0) {
      obj['updated'] = parent.updated.map((u) => {
        return { ...formatCommonKeys(u), parentId: parent.id };
      });
    }
    if (parent.editRequest && parent.editRequest.length > 0) {
      obj['editRequest'] = parent.editRequest.map((u) => {
        return { ...formatCommonKeys(u), parentId: parent.id };
      });
    }
    formattedArr.push(obj);
  }
  return formattedArr;
};

export const formatCommonKeys = (element) => {
  let statusKey = StatusKey[element.actionType];
  return {
    status: statusKey,
    startedAt: element.statusesData[statusKey].startedAt,
    lastStartedAt:
      element.statusesData[statusKey]?.lastStartedAt || element?.lastStartedAt,
    totalSecondsSpentSoFar:
      (element.statusesData[statusKey]?.lastStartedAt ||
        element?.lastStartedAt) - element.statusesData[statusKey].startedAt,
    actionDate: element.actionDate,
    odoMeterMillage: element.odoMeterMillage,
    odoMeterSpeed: element.odoMeterSpeed,
    engineHours: element.engineHours,
    vehicleManualId: element.vehicleManualId,
    geoLocation: element.geoLocation,
    driver: element.driver,
    id: element._id,
    violations: element.violations,
    deviceType: element.deviceType,
    notes: element.notes,
    isManual: element.isManual,
    eldType: element.eldType,
    deviceVersion: element.deviceVersion,
    deviceModel: element.deviceModel,
  };
};

export const markViolations = (partialData) => {
  // Calculating max limits of rules.
  const secondsIn8Hours = moment.duration(8, 'hours').asSeconds();
  const secondsIn11Hours = moment.duration(11, 'hours').asSeconds();
  const secondsIn14Hours = moment.duration(14, 'hours').asSeconds();

  // Calculating seconds spent so far in this driving chunk
  const chunkStart = parseInt(partialData.startedAt);
  const chunkEnd = parseInt(partialData.lastStartedAt);

  // Checking for 30 min break violation
  if (partialData.totalSecondsSpentSoFar > secondsIn8Hours) {// break ended less than 8 hours ago
    // check if any exception with 30 minutes inserted and the startedAt time is exactly the one of its containing log entry
    let violationStartTime = moment.unix(partialData.startedAt).add(8, 'hours');
    let violationToBeInserted = {
      statusStartedAt: chunkStart, startedAt: violationStartTime.unix(), endedAt: chunkEnd, type: ViolationType.THIRTY_MINUTES_BREAK
    }
    partialData.violations.push(violationToBeInserted);
  }
  if (partialData.totalSecondsSpentSoFar > secondsIn11Hours) {
    // check if any exception with 11 hours inserted and the startedAt time is exactly the one of its containing log entry
    let violationStartTime = moment.unix(partialData.startedAt).add(11, 'hours');
    let violationToBeInserted = {
      statusStartedAt: chunkStart, startedAt: violationStartTime.unix(), endedAt: chunkEnd, type: ViolationType.ELEVEN_HOURS_DRIVE
    }
    partialData.violations.push(violationToBeInserted);
  }
  if (partialData.totalSecondsSpentSoFar > secondsIn14Hours) {
    // check if any exception with 14 hours inserted and the startedAt time is exactly the one of its containing log entry
    let violationStartTime = moment.unix(partialData.startedAt).add(14, 'hours');
    let violationToBeInserted = {
      statusStartedAt: chunkStart, startedAt: violationStartTime.unix(), endedAt: chunkEnd, type: ViolationType.FOURTEEN_HOURS_SHIFT
    }
    partialData.violations.push(violationToBeInserted);
  }
  return partialData;
};
