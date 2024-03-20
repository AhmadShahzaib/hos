
//currentItem ======> index of log
const editLogs=(currentItem,mainCsvRequest) =>{
if (validate()) {
    const dutyStatusList = mainCsvRequest.csv.eldEventListForDriversRecordOfDutyStatus;
  
    // Check if startedAt has changed
    if (parseInt(startedAt) !== parseInt(logList[currentItem].startedAt)) {
      startTimeChange = true;
    }
  
    // Check if lastStartedAt has changed
    if (parseInt(lastStartedAt) !== parseInt(logList[currentItem].lastStartedAt)) {
      endTimeChange = true;
    }
  
    // Check if startTimeChange, endTimeChange, or statusChange is true
    if (startTimeChange || endTimeChange || statusChange) {
      const eventIndex = dutyStatusList.findIndex(
        (it) => it.eventSequenceIdNumber === currentSequenceNumber && it.eventRecordStatus === "1"
      );
  
      // Check conditions for updating dutyStatusList
      if (
        (currentItem === 0 && (startTimeChange || statusChange)) ||
        (currentItem !== 0 && ((startTimeChange && endTimeChange) || !endTimeChange || statusChange))
      ) {
        // Set eventRecordStatus, eventDataCheckValue, and lineDataCheckValue
        dutyStatusList[eventIndex].eventRecordStatus = "2";
        dutyStatusList[eventIndex].eventDataCheckValue = Utility.calculateEventDataCheckValue(
          CsvUtils.getConcatenateValue(dutyStatusList[eventIndex])
        );
        dutyStatusList[eventIndex].lineDataCheckValue = Utility.calculateLineDataCheckValue(
          CsvUtils.getConcatenateValue(dutyStatusList[eventIndex])
        );
  
        // Call makeDuplicateUpdate function
        makeDuplicateUpdate(dutyStatusList[eventIndex], dutyStatusList, startedAt, true);
      }
  
      // Check if logList length is greater than 1
      if (logList.length > 1) {
        // Check if startTimeChange is true
        if (startTimeChange) {
          // Iterate over logList in reverse order
          for (let i = currentItem - 1; i >= 0; i--) {
            const item = logList[i];
            // Check if item startedAt is greater than or equal to startedAt
            if (parseInt(item.startedAt) >= parseInt(startedAt)) {
              // Mark corresponding statuses as inactive in dutyStatusList
              for (const status of dutyStatusList) {
                if (item.sequenceNumber === status.eventSequenceIdNumber) {
                  status.eventRecordStatus = "2";
                  status.eventDataCheckValue = Utility.calculateEventDataCheckValue(
                    CsvUtils.getConcatenateValue(status)
                  );
                  status.lineDataCheckValue = Utility.calculateLineDataCheckValue(
                    CsvUtils.getConcatenateValue(status)
                  );
                }
              }
            } else {
              break;
            }
          }
        }
  
        // Check if endTimeChange is true
        if (endTimeChange) {
          // Iterate over logList
          for (let i = currentItem + 1; i < logList.length; i++) {
            const item = logList[i];
            // Check if item lastStartedAt is less than or equal to lastStartedAt
            if (parseInt(item.lastStartedAt) <= parseInt(lastStartedAt)) {
              // Mark item as inactive in dutyStatusList
              for (const status of dutyStatusList) {
                if (item.sequenceNumber === status.eventSequenceIdNumber) {
                  status.eventRecordStatus = "2";
                  status.eventDataCheckValue = Utility.calculateEventDataCheckValue(
                    CsvUtils.getConcatenateValue(status)
                  );
                  status.lineDataCheckValue = Utility.calculateLineDataCheckValue(
                    CsvUtils.getConcatenateValue(status)
                  );
                }
              }
            } else {
              // Mark item as inactive, duplicate it, and set its time to new lastStartedAt
              for (const status of dutyStatusList) {
                if (item.sequenceNumber === status.eventSequenceIdNumber) {
                  status.eventRecordStatus = "2";
                  status.eventDataCheckValue = Utility.calculateEventDataCheckValue(
                    CsvUtils.getConcatenateValue(status)
                  );
                  status.lineDataCheckValue = Utility.calculateLineDataCheckValue(
                    CsvUtils.getConcatenateValue(status)
                  );
  
                  makeDuplicateUpdate(status, dutyStatusList, lastStartedAt, false);
                  break;
                }
              }
              break;
            }
          }
        }
  
        // Find previous active item
        const previousActiveItem = dutyStatusList
          .filter((it) => it.eventSequenceIdNumber < currentSequenceNumber && it.eventRecordStatus === "1")
          .reduce((prev, curr) => (prev.eventSequenceIdNumber > curr.eventSequenceIdNumber ? prev : curr), null);
  
        // Find next active item
        const nextActiveItem = dutyStatusList
          .filter((it) => it.eventSequenceIdNumber > currentSequenceNumber && it.eventRecordStatus === "1")
          .reduce((prev, curr) => (prev.eventSequenceIdNumber < curr.eventSequenceIdNumber ? prev : curr), null);
  
        // Check conditions for updating dutyStatusList based on previousActiveItem and nextActiveItem
        if (
          previousActiveItem !== null &&
          nextActiveItem !== null &&
          selectedStatus === Utility.getStatusFromEventCode2(previousActiveItem.eventCode) &&
          selectedStatus === Utility.getStatusFromEventCode2(nextActiveItem.eventCode)
        ) {
          const eventIndex1 = dutyStatusList.findIndex(
            (it) => it.eventSequenceIdNumber === currentSequenceNumber && it.eventRecordStatus === "1"
          );
  
          dutyStatusList[eventIndex1].eventTime = previousActiveItem.eventTime;
          dutyStatusList[eventIndex1].lineDataCheckValue = Utility.calculateLineDataCheckValue(
            CsvUtils.getConcatenateValue(dutyStatusList[eventIndex1])
          );
          dutyStatusList[eventIndex1].eventDataCheckValue = Utility.calculateEventDataCheckValue(
            CsvUtils.getConcatenateValue(dutyStatusList[eventIndex1])
          );
  
          nextActiveItem.eventRecordStatus = "2";
          nextActiveItem.eventDataCheckValue = Utility.calculateEventDataCheckValue(
            CsvUtils.getConcatenateValue(nextActiveItem)
          );
          nextActiveItem.lineDataCheckValue = Utility.calculateLineDataCheckValue(
            CsvUtils.getConcatenateValue(nextActiveItem)
          );
  
          previousActiveItem.eventRecordStatus = "2";
          previousActiveItem.eventDataCheckValue = Utility.calculateEventDataCheckValue(
            CsvUtils.getConcatenateValue(previousActiveItem)
          );
          previousActiveItem.lineDataCheckValue = Utility.calculateLineDataCheckValue(
            CsvUtils.getConcatenateValue(previousActiveItem)
          );
        } else if (
          previousActiveItem !== null &&
          selectedStatus === Utility.getStatusFromEventCode2(previousActiveItem.eventCode)
        ) {
          const eventIndex1 = dutyStatusList.findIndex(
            (it) => it.eventSequenceIdNumber === currentSequenceNumber && it.eventRecordStatus === "1"
          );
  
          previousActiveItem.eventRecordStatus = "2";
          previousActiveItem.eventDataCheckValue = Utility.calculateEventDataCheckValue(
            CsvUtils.getConcatenateValue(previousActiveItem)
          );
          previousActiveItem.lineDataCheckValue = Utility.calculateLineDataCheckValue(
            CsvUtils.getConcatenateValue(previousActiveItem)
          );
  
          dutyStatusList[eventIndex1].eventTime = previousActiveItem.eventTime;
          dutyStatusList[eventIndex1].eventDataCheckValue = Utility.calculateEventDataCheckValue(
            CsvUtils.getConcatenateValue(dutyStatusList[eventIndex1])
          );
          dutyStatusList[eventIndex1].lineDataCheckValue = Utility.calculateLineDataCheckValue(
            CsvUtils.getConcatenateValue(dutyStatusList[eventIndex1])
          );
        } else if (nextActiveItem !== null && selectedStatus === Utility.getStatusFromEventCode2(nextActiveItem.eventCode)) {
          nextActiveItem.eventRecordStatus = "2";
          nextActiveItem.eventDataCheckValue = Utility.calculateEventDataCheckValue(
            CsvUtils.getConcatenateValue(nextActiveItem)
          );
          nextActiveItem.lineDataCheckValue = Utility.calculateLineDataCheckValue(
            CsvUtils.getConcatenateValue(nextActiveItem)
          );
        }
      }
    } else {
      // Display toast message
      Toast.makeText(requireActivity(), "Time and status are same as previous", Toast.LENGTH_SHORT).show();
    }
  }
}