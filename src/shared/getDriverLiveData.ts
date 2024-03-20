import { getTimeZoneDateRangeForDay } from '@shafiqrathore/logeld-tenantbackend-common-future';
import moment from "moment-timezone";
import LogsDocument from "mongoDb/document/document";
import mongoose, { FilterQuery } from "mongoose";
import { AppService } from "services/app.service";
import { dateRangeForDriverLog } from "./utils";

export const getLiveDriverData = async (driverId: string, HOSService: AppService, timeZone: string = moment.tz.guess()) => {

  const { start: currentDateStart, end: currentDateEnd } = getTimeZoneDateRangeForDay(moment(), timeZone);
  const dateRangeQuery = dateRangeForDriverLog(currentDateStart, currentDateEnd);
  const options: FilterQuery<LogsDocument> = {
    "driver.id": new mongoose.Types.ObjectId(driverId),
    ...dateRangeQuery
  };
  const data = await HOSService.findLatestEntry(options);
  if (!data) {
    return [];
  }
  const eighthDayStart = moment().tz(timeZone).subtract(7, 'days').startOf('day').unix();
  const last8DaysData = data.recap.filter(
    (recapObj) => recapObj.calendarStartDate >= eighthDayStart,
  ).map(status => status.toJSON());
  const initialValue = {
    onDuty: { totalSecondsSpentSoFar: 0 },
    offDuty: { totalSecondsSpentSoFar: 0 },
    onDriving: { totalSecondsSpentSoFar: 0 },
    onSleeperBerth: { totalSecondsSpentSoFar: 0 },
    onPersonalConveyance: { totalSecondsSpentSoFar: 0 },
    onYardMove: { totalSecondsSpentSoFar: 0 }
  }
  const secondsWorkedInLast8Days = last8DaysData.reduce((acc, curr) => {
    acc.onDuty.totalSecondsSpentSoFar += curr.onDuty?.totalSecondsSpentSoFar ?? 0;
    acc.offDuty.totalSecondsSpentSoFar += curr.offDuty?.totalSecondsSpentSoFar ?? 0;
    acc.onDriving.totalSecondsSpentSoFar += curr.onDriving?.totalSecondsSpentSoFar ?? 0;
    acc.onSleeperBerth.totalSecondsSpentSoFar += curr.onSleeperBerth?.totalSecondsSpentSoFar ?? 0;
    acc.onPersonalConveyance.totalSecondsSpentSoFar += curr.onPersonalConveyance?.totalSecondsSpentSoFar ?? 0;
    acc.onYardMove.totalSecondsSpentSoFar += curr.onYardMove?.totalSecondsSpentSoFar ?? 0;
    return acc
  }, initialValue);
  return [data, secondsWorkedInLast8Days];
}

/**
 * 
 * @deprecated This function is not required after completion of recap array as all data that this provides is available in recap array 
 */
export const getDriverDataSeventyByEight = async (driverId: string, HOSService: AppService) => {
  const eighthDayStart = moment().subtract(7, 'days').startOf('day').unix();
  const currentDayEnd = moment().endOf('day').unix();
  let options: FilterQuery<LogsDocument> = {
    $and: [
      { "driver.id": new mongoose.Types.ObjectId(driverId) },
    ]
  };
  const data = await HOSService.getLogsFromDb(options, eighthDayStart, currentDayEnd, true);
  if (!data || data.length < 0) {
    return [];
  }
  return data;
} 