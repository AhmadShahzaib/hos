import { EventType } from '../logs/Enums';

export async function getInBetweenLogs(logs, startTime, endTime) {
  const arr = [];

  for (let i = 0; i < logs.length; i++) {
    const stime = logs[i].eventTime;

    if (i < logs.length - 1) {
      const etime = logs[i + 1].eventTime;
      if ((stime >= startTime && stime <= endTime) || (etime >= startTime && etime <= endTime)) {
        arr.push(logs[i]);
      }
    } else {
      const etime = '235959';
      if ((stime >= startTime && stime <= endTime) || (etime >= startTime && etime <= endTime)) {
        arr.push(logs[i]);
      }
    }
  }

  const filterd =  logs.filter((log, index) => {
    const stime = log.eventTime;
    const etime = index === logs.length - 1 ? '235959' : logs[index + 1].eventTime;
    return !(stime >= startTime && stime <= endTime) && !(etime >= startTime && etime <= endTime);
  });

    return { filterd, arr };
}
