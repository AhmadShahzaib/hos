/**
 * @description : The function duplicates passed log, modifies evenrRecordStatus, eventCode and eventTime
 */

export const duplicateAndModifyDutyStatus = (
  editedIndex, // Log to be duplicated
  dutyStatusList, // Duty status list
  payloadLog, // edited payload from client side
  boolean, // To toggle values
) => {
  let dutyStatusObject = {
    ...editedIndex,
  };

  dutyStatusObject['eventRecordStatus'] = '1';
  dutyStatusObject['eventRecordOrigin'] = '3';
  dutyStatusObject['shippingId'] =
  boolean == true ? payloadLog?.shippingId : editedIndex?.shippingId;
  dutyStatusObject['trailerId'] =
  boolean == true ? payloadLog?.trailerId : editedIndex?.trailerId;
  dutyStatusObject['state'] =
    boolean == true ? payloadLog.state : editedIndex.state;
  dutyStatusObject['eventCode'] =
    boolean == true ? payloadLog.eventCode : editedIndex.eventCode;
  dutyStatusObject['eventType'] =
    boolean == true ? payloadLog.eventType : editedIndex.eventType;
  dutyStatusObject['eventTime'] =
    boolean == true ? payloadLog.startTime : payloadLog.endTime;
  dutyStatusObject['eventLatitude'] =
    boolean == true ? payloadLog.eventLatitude : editedIndex.eventLatitude;
  dutyStatusObject['eventLongitude'] =
    boolean == true ? payloadLog.eventLongitude : editedIndex.eventLongitude;
  dutyStatusObject['totalVehicleMilesDutyStatus'] =
    boolean == true
      ? payloadLog.totalVehicleMilesDutyStatus
      : editedIndex.totalVehicleMilesDutyStatus;
  dutyStatusObject['totalEngineHoursDutyStatus'] =
    boolean == true
      ? payloadLog.totalEngineHoursDutyStatus
      : editedIndex.totalEngineHoursDutyStatus;
  dutyStatusObject['address'] =
    boolean == true ? payloadLog.address : editedIndex.address;
  dutyStatusObject['notes'] =
    boolean == true ? payloadLog.notes : editedIndex.notes;

  // Following code segment ignores the last one second entry
  const index = dutyStatusList.findIndex(
    (obj) => obj.eventSequenceIdNumber === payloadLog.eventSequenceIdNumber,
  );
  if (
    // dutyStatusList[index + 1].eventType != 2 &&
    dutyStatusList[index + 1] != undefined &&
    payloadLog.endTime == '235959'
  ) {
    // Do not inactive the intermediate
    if (dutyStatusList[index + 1].eventType == 2) {
      dutyStatusList[index + 1]['eventRecordStatus'] = '1';
    } else {
      dutyStatusList[index + 1]['eventRecordStatus'] = '2';
    }
  }

  dutyStatusList.push(dutyStatusObject);
  return dutyStatusList;
};
