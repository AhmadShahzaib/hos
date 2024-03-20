import { EventType } from '../logs/Enums';
import { generateUniqueHexId } from './generateEventSeqId';

export async function addFirstandLast(arr, filterd,startTime,endTime) {
 const result = [...filterd];

  if (arr.length > 0 && startTime !== arr[0].eventTime) {
    result.push(arr[0]); // Add the first log from arr
  }

  if (arr.length > 1 && endTime !== arr[arr.length - 1].eventTime) {
    result.push(arr[arr.length - 1]); // Add the last log from arr
  }
  // if (arr.length == 0 && filterd.length == 1) { 
  //   let breakedLog = JSON.parse(JSON.stringify(filterd[0]))
  //   breakedLog.eventTime = endTime
  //   breakedLog.eventSequenceIdNumber = generateUniqueHexId()
  //   result.push(breakedLog)

  // }
  // if (arr.length > 0) { 
  //     let breakedLog = JSON.parse(JSON.stringify(arr[arr.length -1]))
  //   breakedLog.eventTime = startTime
  //   breakedLog.eventSequenceIdNumber = generateUniqueHexId()
  //   result.push(breakedLog)
  // }

  result.sort((a, b) => a.eventTime.localeCompare(b.eventTime));

  return result;
}

