import { EventType } from '../logs/Enums';
export async function getLog(logs,time) { 

const targetTime = time; // hhmmss

let foundLog = null;
let index = 0
for (let i = logs.length - 1; i >= 0; i--) {
  const currentLog = logs[i];
  const currentLogTime = currentLog.eventTime;

  // Compare the currentLogTime with the targetTime
  if (currentLogTime < targetTime) {
    if (currentLog.eventType != "2") {
      foundLog = currentLog;
      index = i
      break; // Exit the loop once we find the desired log
    }
  }
}
    return { foundLog, index }

}