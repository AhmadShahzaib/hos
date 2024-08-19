import {
  Inject,
  Injectable,
  Logger,
  Scope,
  UseInterceptors,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { dbConnection } from 'utils/db.connection';
import { DriverCsvSchema } from 'mongoDb/schema/schema';
import {
  dayFormatForDynamicCollection,
  getModelName,
  monthFormatForDynamicCollection,
} from 'utils/helperFunctions';
import {
  MessagePatternResponseInterceptor,
  MessagePatternResponseType,
  getTimeZoneDateRangeForDay,
  mapMessagePatternResponseToException,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { InjectModel } from '@nestjs/mongoose';
import EditInsertLogsDocument from 'mongoDb/document/editInsertLogsDocument';
import moment from 'moment';
import { checkSum, eventCheckSum } from 'utils/checkSum';

import { fileCheckData } from 'utils/fileDataCheck';
import {
  getIntermediateLocations,
  getIntermediateLocationsWithSpeed,
} from 'utils/intermediateLocations';
import { betweenLatLongInfo } from 'utils/betweenLatLongInfo';
import { updateVariables } from 'shared/calculateClocks';
import { calculateClocks } from 'shared/clocks';
import { checkViolations } from 'shared/calculateViolations';
import { getDatesInRange } from 'utils/getDatesBetweenUnixTimestamps';
import {
  getDatesBetweenUnixTimestamps,
  isSameDay,
  calculateTimeDifference,
} from 'utils/getDatesBetweenUnixTimestamps';
import { filter, firstValueFrom } from 'rxjs';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { getHours } from 'utils/getHours';
import { getLocationDescription } from 'utils/formatedLocation';
import { generateUniqueHexId } from 'utils/generateEventSeqId';
import { getInBetweenLogs } from 'utils/findInBetweenLogs';
import { addFirstandLast } from 'utils/addFirstandLastLog';
import { createNewLog } from 'utils/createNewLog';
import { insertLog } from 'utils/insertLog';
import { removeDuplicateConsecutiveLogs } from 'utils/removeDuplicateConsecutiveLogs';
import RecordTable from 'mongoDb/document/recordTable.document';
import { timeDifference } from 'utils/timeDifference';
import { isArray } from 'lodash';

const Schema = mongoose.Schema;
const globalIntermediates = {};
global.globalIntermediatesArray = [];

@Injectable({ scope: Scope.DEFAULT })
export class DriverCsvService {
  private readonly logger = new Logger('DriverCsvService');
  constructor(
    @InjectModel('EditInsertLogs')
    private readonly editInsertLogsModel: Model<EditInsertLogsDocument>,
    @Inject('DRIVER_SERVICE') private readonly driverClient: ClientProxy,
    @Inject('UNIT_SERVICE') private readonly unitClient: ClientProxy,
    @InjectModel('RecordTable')
    private readonly recordTable: Model<RecordTable>,
  ) {}
  checkDataLengthInSchema = async (date: any, driverInfo: any) => {
    try {
      const collectionNames = await dbConnection(); // ---> May needed in future otherwise remove this
      const collectionName = await getModelName(driverInfo, date);
      const dynamicModel = mongoose.model(
        `${collectionName}`,
        DriverCsvSchema,
        collectionName,
      );
      const existingData = await dynamicModel.find().lean();
    } catch (error) {}
  };

  //this function will get the csv object of one day calculate hos on the basis of it and return the hos calculated till end of the day or current DateTime according to
  // the driver timezone
  // calculateHOS = (latestCSV: any, lastCalculations, user: any) => {
  //   try {
  //     const csvDataOfDutyStatus =
  //       latestCSV.csv.eldEventListForDriversRecordOfDutyStatus; // get all the duty statuses

  //     let deviceCalculation = lastCalculations; // previous day's valid calculations run till 23:59:59

  //     const allHosRelatedStatuses = [];
  //     deviceCalculation.violation = [];

  //     // Filter all valid and active duty statuses
  //     csvDataOfDutyStatus.forEach((element, index) => {
  //       if (
  //         (element.eventType == 1 || element.eventType == 3) &&
  //         element.eventRecordStatus == 1 // represents active
  //       ) {
  //         // get all the statuses of event type 1 and event type 3
  //         allHosRelatedStatuses.push(element);
  //       }
  //     });

  //     // Sort the statuses
  //     allHosRelatedStatuses.sort((a, b) =>
  //       a.eventTime.localeCompare(b.eventTime),
  //     );

  //     let newcurrentCalculations; //this is the variable to put all device calulations after each log
  //     const violationArray = [];
  //     const currentDate = allHosRelatedStatuses[0].eventDate;
  //     deviceCalculation.SHIFT_START_DATE = [];
  //     deviceCalculation.CYCLE_START_DATE = {
  //       eventDate: '',
  //       eventTime: '',
  //     };
  //     // if (deviceCalculation.SHIFT_STARTED == true) {
  //     //   latestCSV.meta.pti = deviceCalculation.pti;
  //     // }
  //     latestCSV.meta.pti = '2';

  //     if (
  //       deviceCalculation.CURRENT_STATUS != allHosRelatedStatuses[0].eventCode
  //     ) {
  //       deviceCalculation.ON_DUTY_CURRENT_TIME = 0;
  //     }
  //     if (deviceCalculation.CYCLE_DAY > 0) {
  //       deviceCalculation.CYCLE_DAY += 1;
  //     }
  //     deviceCalculation.HOURS_WORKED = 0; // for cycle worked hours
  //     deviceCalculation.powerUp = latestCSV.meta.powerUp;
  //     deviceCalculation = this.calculateRecape(deviceCalculation);

  //     //
  //     // Looping all duty statuses
  //     allHosRelatedStatuses.forEach((element, index) => {
  //       let nextLogEventDateTime;
  //       if (element.eventType == 1) {
  //         deviceCalculation.CURRENT_STATUS = element.eventCode; // Getting eventCode
  //       } else if (element.eventType == 3) {
  //         deviceCalculation.CURRENT_STATUS = element.eventCode == 2 ? 4 : 1; // as PC/YM represents OFF/ON Duty, From PC/YM assigning as ON Duty == 4 and OFF DUTY == 1
  //       }
  //       if (index > 0) {
  //         deviceCalculation.ON_DUTY_CURRENT_TIME = 0;
  //       }
  //       if (index + 1 < allHosRelatedStatuses.length) {
  //         deviceCalculation.timeDifferenceInSeconds = calculateTimeDifference(
  //           element.eventTime,
  //           allHosRelatedStatuses[index + 1].eventTime,
  //         ); // Get time difference in seconds between two logs.
  //         deviceCalculation.currentDateTime =
  //           element.eventDate + allHosRelatedStatuses[index + 1].eventTime;
  //         nextLogEventDateTime = {
  //           eventDate: allHosRelatedStatuses[index + 1].eventDate,
  //           eventTime: allHosRelatedStatuses[index + 1].eventTime,
  //         };
  //       } else if (index + 1 == allHosRelatedStatuses.length) {
  //         let endTime;
  //         if (
  //           element.eventDate ==
  //           moment().tz(user.homeTerminalTimeZone.tzCode).format('MMDDYY')
  //         ) {
  //           endTime = moment()
  //             .tz(user.homeTerminalTimeZone.tzCode)
  //             .format('HHmmss');
  //         } else {
  //           endTime = '235959';
  //         }
  //         nextLogEventDateTime = {
  //           eventDate: element.eventDate,
  //           eventTime: endTime,
  //         };

  //         // Check wether the day is current day or previous
  //         //if
  //         //current day get time according to timezone
  //         //else
  //         //add end day time if not current day.
  //         deviceCalculation.currentDateTime = element.eventDate + endTime;
  //         deviceCalculation.timeDifferenceInSeconds = calculateTimeDifference(
  //           element.eventTime,
  //           endTime,
  //         ); // Get time difference in seconds between last log and end day
  //       }
  //       if (!deviceCalculation.violation) {
  //         deviceCalculation.violation = [];
  //       }
  //       if (
  //         deviceCalculation.CURRENT_STATUS != 3 &&
  //         deviceCalculation.violation.length > 0
  //       ) {
  //         //added a loop to remove extra violations
  //         const violationsLoop = deviceCalculation.violation.length;
  //         for (let q = 0; q < violationsLoop; q++) {
  //           if (
  //             deviceCalculation.violation[0].startedAt.eventDate != currentDate
  //           ) {
  //             if (
  //               deviceCalculation.violation[0].endedAt.eventDate != currentDate
  //             ) {
  //               deviceCalculation.violation.splice(0, 1);
  //             }
  //           }
  //         }
  //       }
  //       const currentLogEventDateTime = {
  //         eventDate: element.eventDate,
  //         eventTime: element.eventTime,
  //         CURRENT_STATUS_TIME: 0,
  //       };

  //       deviceCalculation = updateVariables(
  //         deviceCalculation,
  //         user.homeTerminalTimeZone.tzCode,
  //         nextLogEventDateTime,
  //         currentLogEventDateTime,
  //       );
  //       newcurrentCalculations = deviceCalculation;

  //       newcurrentCalculations = checkViolations(
  //         newcurrentCalculations,
  //         user.homeTerminalTimeZone.tzCode,
  //         nextLogEventDateTime,
  //         currentLogEventDateTime,
  //       );
  //       if (newcurrentCalculations?.violation.length > 0) {
  //         violationArray.push(...newcurrentCalculations.violation);
  //       }
  //       //checkPTI
  //       if (!latestCSV.meta.pti) {
  //         console.log('Please get latest build with PTI');
  //       }

  //       latestCSV.meta.pti = this.checkPti(
  //         latestCSV.meta.pti,
  //         deviceCalculation.CURRENT_STATUS,
  //         newcurrentCalculations.ON_DUTY_NOT_DRIVING_WITHOUT_DRIVE,
  //         newcurrentCalculations.engineStart,
  //       );
  //     });
  //     if (newcurrentCalculations.CYCLE_DAY > 0) {
  //       newcurrentCalculations.CYCLE_DATA.push({
  //         hoursWorked: newcurrentCalculations.HOURS_WORKED,
  //         day: newcurrentCalculations.CYCLE_DAY,
  //         date: latestCSV.date,
  //       });
  //     }
  //     const clockCalculationParams = {
  //       CONSECUTIVE_DRIVING: newcurrentCalculations.CONSECUTIVE_DRIVING,
  //       DRIVING_WITH_OUT_SPLIT: newcurrentCalculations.DRIVING_WITH_OUT_SPLIT,
  //       ON_DUTY_NOT_DRIVING_CYCLE:
  //         newcurrentCalculations.ON_DUTY_NOT_DRIVING_CYCLE,
  //       TOTAL_SHIFT_COUNTER: newcurrentCalculations.TOTAL_SHIFT_COUNTER,
  //       CURRENT_STATUS: newcurrentCalculations.CURRENT_STATUS,
  //       SHIFT_STARTED: newcurrentCalculations.SHIFT_STARTED,
  //       RECAPE_HOURS: newcurrentCalculations.RECAPE_HOURS,
  //       RECAPE_STATUS: newcurrentCalculations.RECAPE_STATUS,
  //     };

  //     newcurrentCalculations.violation.push(...violationArray);
  //     const currentClocks = calculateClocks(clockCalculationParams);

  //     const mergedVoilations = this.mergeAndFilterArrays(
  //       newcurrentCalculations.violation,
  //       newcurrentCalculations.violation,
  //     );
  //     latestCSV.meta.powerUp = newcurrentCalculations.powerUp;
  //     newcurrentCalculations.violation = mergedVoilations;
  //     latestCSV.meta.deviceCalculations = newcurrentCalculations;
  //     latestCSV.meta.clockData = currentClocks;
  //     latestCSV.meta.voilations = mergedVoilations;
  //     // latestCSV[0]._doc.meta.dateTime= moment().tz(user.homeTerminalTimeZone.tzCode).unix();
  //     return latestCSV;
  //   } catch (error) {
  //     return error;
  //   }
  // };
  calculateHOS = (latestCSV: any, lastCalculations, user: any) => {
    try {
      const csvDataOfDutyStatus =
        latestCSV.csv.eldEventListForDriversRecordOfDutyStatus; // get all the duty statuses

      let deviceCalculation = lastCalculations; // previous day's valid calculations run till 23:59:59

      let allHosRelatedStatuses = [];
      deviceCalculation.violation = [];

      // Filter all valid and active duty statuses
      csvDataOfDutyStatus.forEach((element, index) => {
        if (
          (element.eventType == 1 || element.eventType == 3) &&
          element.eventRecordStatus == 1 // represents active
        ) {
          // get all the statuses of event type 1 and event type 3
          allHosRelatedStatuses.push(element);
        }
      });

      // Sort the statuses
      allHosRelatedStatuses.sort((a, b) =>
        a.eventTime.localeCompare(b.eventTime),
      );

      let newcurrentCalculations; //this is the variable to put all device calulations after each log
      let violationArray = [];
      let currentDate = allHosRelatedStatuses[0].eventDate;
      deviceCalculation.SHIFT_START_DATE = [];
      deviceCalculation.engineStart = false;
      deviceCalculation.CYCLE_START_DATE = {
        eventDate: '',
        eventTime: '',
      };
      // if(deviceCalculation.SHIFT_STARTED == true){

      //   latestCSV.meta.pti = deviceCalculation.pti;
      // }
      latestCSV.meta.pti = '0';
      let count = 0;
      let pti = [];
      // let tempPti = [];

      // if (
      //   deviceCalculation.SHIFT_STARTED == true &&
      //   deviceCalculation.CURRENT_STATUS == '3'
      // ) {
      //   tempPti = lastCalculations.ptiViolation;
      // }
      delete lastCalculations.ptiViolation;
      if (
        deviceCalculation.CURRENT_STATUS != allHosRelatedStatuses[0].eventCode
      ) {
        deviceCalculation.ON_DUTY_CURRENT_TIME = 0;
      }
      if (deviceCalculation.CYCLE_DAY > 0) {
        deviceCalculation.CYCLE_DAY += 1;
      }
      deviceCalculation.HOURS_WORKED = 0; // for cycle worked hours
      deviceCalculation.powerUp = latestCSV.meta.powerUp;
      deviceCalculation = this.calculateRecape(deviceCalculation);

      //
      // Looping all duty statuses
      allHosRelatedStatuses.forEach((element, index) => {
        let nextLogEventDateTime;
        if (element.eventType == 1) {
          deviceCalculation.CURRENT_STATUS = element.eventCode; // Getting eventCode
        } else if (element.eventType == 3) {
          deviceCalculation.CURRENT_STATUS = element.eventCode == 2 ? 4 : 1; // as PC/YM represents OFF/ON Duty, From PC/YM assigning as ON Duty == 4 and OFF DUTY == 1
        }
        if (index > 0) {
          deviceCalculation.ON_DUTY_CURRENT_TIME = 0;
        }
        if (index + 1 < allHosRelatedStatuses.length) {
          deviceCalculation.timeDifferenceInSeconds = calculateTimeDifference(
            element.eventTime,
            allHosRelatedStatuses[index + 1].eventTime,
          ); // Get time difference in seconds between two logs.
          deviceCalculation.currentDateTime =
            element.eventDate + allHosRelatedStatuses[index + 1].eventTime;
          nextLogEventDateTime = {
            eventDate: allHosRelatedStatuses[index + 1].eventDate,
            eventTime: allHosRelatedStatuses[index + 1].eventTime,
          };
        } else if (index + 1 == allHosRelatedStatuses.length) {
          let endTime;
          if (
            element.eventDate ==
            moment().tz(user.homeTerminalTimeZone.tzCode).format('MMDDYY')
          ) {
            endTime = moment()
              .tz(user.homeTerminalTimeZone.tzCode)
              .format('HHmmss');
          } else {
            endTime = '235959';
          }
          nextLogEventDateTime = {
            eventDate: element.eventDate,
            eventTime: endTime,
          };

          // Check wether the day is current day or previous
          //if
          //current day get time according to timezone
          //else
          //add end day time if not current day.
          deviceCalculation.currentDateTime = element.eventDate + endTime;
          deviceCalculation.timeDifferenceInSeconds = calculateTimeDifference(
            element.eventTime,
            endTime,
          ); // Get time difference in seconds between last log and end day
        }
        if (!deviceCalculation.violation) {
          deviceCalculation.violation = [];
        }
        if (
          deviceCalculation.CURRENT_STATUS != 3 &&
          deviceCalculation.violation.length > 0
        ) {
          //added a loop to remove extra violations
          let violationsLoop = deviceCalculation.violation.length;
          for (let q = 0; q < violationsLoop; q++) {
            if (
              deviceCalculation.violation[0].startedAt.eventDate != currentDate
            ) {
              if (
                deviceCalculation.violation[0].endedAt.eventDate != currentDate
              ) {
                deviceCalculation.violation.splice(0, 1);
              }
            }
          }
        }
        let currentLogEventDateTime = {
          eventDate: element.eventDate,
          eventTime: element.eventTime,
          CURRENT_STATUS_TIME: 0,
        };

        deviceCalculation = updateVariables(
          deviceCalculation,
          user.homeTerminalTimeZone.tzCode,
          nextLogEventDateTime,
          currentLogEventDateTime,
        );
        newcurrentCalculations = deviceCalculation;

        newcurrentCalculations = checkViolations(
          newcurrentCalculations,
          user.homeTerminalTimeZone.tzCode,
          nextLogEventDateTime,
          currentLogEventDateTime,
        );
        if (newcurrentCalculations?.violation.length > 0) {
          violationArray.push(...newcurrentCalculations.violation);
        }
        //checkPTI
        if (!latestCSV.meta.pti) {
          console.log('Please get latest build with PTI');
        }

        if (
          newcurrentCalculations.SHIFT_STARTED &&
          newcurrentCalculations.SHIFT_START_DATE.length > 0
        ) {
          latestCSV.meta.pti = this.checkPti(
            latestCSV.meta.pti,
            deviceCalculation.CURRENT_STATUS,
            newcurrentCalculations.ON_DUTY_NOT_DRIVING_WITHOUT_DRIVE,
            newcurrentCalculations.engineStart,
          );
          if (newcurrentCalculations.SHIFT_START_DATE.length > pti.length) {
            pti.push({
              type: latestCSV.meta.pti,
              SHIFT_START_DATE: newcurrentCalculations.SHIFT_START_DATE[count],
            });
            count += 1;
          }
          if (
            newcurrentCalculations.SHIFT_START_DATE.length == pti.length &&
            latestCSV.meta.pti == '3'
          ) {
            pti[count - 1].type = latestCSV.meta.pti;
          }
        }
      });
      latestCSV.meta.ptiViolation = pti;
      if (newcurrentCalculations.CYCLE_DAY > 0) {
        newcurrentCalculations.CYCLE_DATA.push({
          hoursWorked: newcurrentCalculations.HOURS_WORKED,
          day: newcurrentCalculations.CYCLE_DAY,
          date: latestCSV.date,
        });
      }
      const clockCalculationParams = {
        CONSECUTIVE_DRIVING: newcurrentCalculations.CONSECUTIVE_DRIVING,
        DRIVING_WITH_OUT_SPLIT: newcurrentCalculations.DRIVING_WITH_OUT_SPLIT,
        ON_DUTY_NOT_DRIVING_CYCLE:
          newcurrentCalculations.ON_DUTY_NOT_DRIVING_CYCLE,
        TOTAL_SHIFT_COUNTER: newcurrentCalculations.TOTAL_SHIFT_COUNTER,
        CURRENT_STATUS: newcurrentCalculations.CURRENT_STATUS,
        SHIFT_STARTED: newcurrentCalculations.SHIFT_STARTED,
        RECAPE_HOURS: newcurrentCalculations.RECAPE_HOURS,
        RECAPE_STATUS: newcurrentCalculations.RECAPE_STATUS,
      };

      newcurrentCalculations.violation.push(...violationArray);
      const currentClocks = calculateClocks(clockCalculationParams);

      let mergedVoilations = this.mergeAndFilterArrays(
        newcurrentCalculations.violation,
        newcurrentCalculations.violation,
      );
      latestCSV.meta.powerUp = newcurrentCalculations.powerUp;
      newcurrentCalculations.violation = mergedVoilations;
      latestCSV.meta.deviceCalculations = newcurrentCalculations;
      latestCSV.meta.clockData = currentClocks;
      latestCSV.meta.voilations = mergedVoilations;
      // latestCSV[0]._doc.meta.dateTime= moment().tz(user.homeTerminalTimeZone.tzCode).unix();
      return latestCSV;
    } catch (error) {
      return error;
    }
  };

  calculateRecape = (deviceCalculation) => {
    //      if (deviceCalculation.CYCLE_DAY > 7) {
    //       Logger.log('Cycle Day greater than 8 #');

    // }

    if (
      deviceCalculation.CYCLE_DAY == 8 &&
      deviceCalculation.ON_DUTY_NOT_DRIVING_CYCLE < 70 * 60 * 60
    ) {
      deviceCalculation.RECAPE_STATUS = true;
      deviceCalculation.RECAPE_HOURS =
        deviceCalculation.CYCLE_DATA[0].hoursWorked;
    }
    if (deviceCalculation.CYCLE_DAY > 8) {
      if (deviceCalculation.ON_DUTY_NOT_DRIVING_CYCLE < 70 * 60 * 60) {
        Logger.log('Cycle time less than 70 hours #');

        deviceCalculation.RECAPE_STATUS = true;
        for (let i = 0; i <= deviceCalculation.CYCLE_DATA.length - 8; i++) {
          Logger.log('The itration number #' + i);

          if (deviceCalculation.CYCLE_DAY == 9 + i) {
            Logger.log('CYCLE DAY number #' + deviceCalculation.CYCLE_DAY);

            deviceCalculation.RECAPE_HOURS =
              deviceCalculation.CYCLE_DATA[i].hoursWorked;
            Logger.log(
              'ON_DUTY_NOT_DRIVING_CYCLE >>>>>>>> #' +
                deviceCalculation.ON_DUTY_NOT_DRIVING_CYCLE,
            );
            Logger.log(
              'RECAPE_HOURS >>>>>>>> #' + deviceCalculation.RECAPE_HOURS,
            );

            deviceCalculation.ON_DUTY_NOT_DRIVING_CYCLE =
              deviceCalculation.ON_DUTY_NOT_DRIVING_CYCLE -
              deviceCalculation.RECAPE_HOURS;
            deviceCalculation.RECAPE_HOURS =
              deviceCalculation.CYCLE_DATA[i + 1].hoursWorked;
          }
        }
      } else if (deviceCalculation.ON_DUTY_NOT_DRIVING_CYCLE >= 70 * 60 * 60) {
        deviceCalculation.RECAPE_STATUS = false;
        deviceCalculation.RECAPE_HOURS = 0;
      }
    }
    return deviceCalculation;
  };
  // merge voilations in one array
  mergeAndFilterArrays = (arr1, arr2) => {
    const mergedArray = [...arr1, ...arr2];
    const uniqueObjects = new Set();
    const resultArray = [];

    for (const obj of mergedArray) {
      const identifier = `${obj.type}-${obj.endedAt.eventDate}-${obj.endedAt.eventTime}`;

      if (!uniqueObjects.has(identifier)) {
        uniqueObjects.add(identifier);
        resultArray.push(obj);
      }
    }

    return resultArray;
  };
  checkPti = (pti, currentStatus, onDutyTime, driving) => {
    try {
      // 1 => NoPTI
      // 2 => pti
      if (onDutyTime > 15 * 60) {
        pti = '2';
      }
      if (onDutyTime < 15 * 60 && currentStatus == 3) {
        pti = '3';
      }
      if (onDutyTime < 1 && currentStatus == 3) {
        pti = '1';
      }
      if (driving) {
        pti = '1';
      }

      return pti;
    } catch (error) {
      return '0';
    }
  };

  ////////////////////////////
  /////////////////////////////
  /////////////////////////////
  normalizeFunction = async (
    user,
    speed,
    date,
    type,
    driverId,
    eventSequenceIdNumber,
    res,
    req,
    reqBody,
    queryParams,
    params,
    normalizedResp,
    normalizationType,
  ) => {
    if (type == 1) {
      speed = reqBody.speed;
      if (!speed)
        return res.status(421).send({
          statusCode: 421,
          message: 'Speed is a required field for manual normalization!',
          data: {},
        });
      if (speed < 5) {
        return res.status(421).send({
          statusCode: 421,
          message: 'Speed should not be less than 5 mph!',
          data: {},
        });
      }
    }

    // Get logs of river between date
    const logsOfSelectedDate = await this.get_logs_between_range({
      driverId: driverId,
      startDate: date,
      endDate: date,
    });
    if (logsOfSelectedDate.length == 0) {
      return res.status(404).send({
        statusCode: 400,
        message: 'No record found!.',
        data: {},
      });
    }
    // point where actual functions called.
    if (type == 0) {
      // Normalize the logs
      normalizedResp = await this.autoNormalizeDuty(
        logsOfSelectedDate,
        eventSequenceIdNumber,
        // this.get_logs_between_range,
        driverId,
        date,
        user,
        normalizationType,
      );
      235959;
    } else {
      // Normalize the logs manually
      normalizedResp = await this.manuallyNormalizeDuty(
        logsOfSelectedDate,
        eventSequenceIdNumber,
        // get_logs_between_range,
        driverId,
        date,
        user,
        speed, // in mPh
        normalizationType, // for pc or driving PC=1, dr=1
      );
    }

    // If the execution gets completed successfully, fetch driver info and save in DB.
    if (Object.keys(normalizedResp.data).length > 0) {
      console.log(`in if`);

      await this.addToDB(normalizedResp.data[0], user);
    } else if (
      normalizedResp.globalIntermediates &&
      Object.keys(normalizedResp.globalIntermediates).length > 0
    ) {
      console.log(`in elif`);

      let { object, array } = normalizedResp.globalIntermediates;
      // array = array[0];
      array = array.sort((a, b) => {
        a.eventDate - b.eventDate;
      });

      for (let i = 0; i < Object.keys(object).length; i++) {
        for (let j = 0; j < array.length; j++) {
          const indexDate = moment(array[j].eventDate, 'MMDDYY').format(
            'YYYY-MM-DD',
          );
          console.log(`eventDate in array ----- `, array[j].eventDate);
          console.log(`eventDate in indexDate ----- `, indexDate);

          if (indexDate == Object.keys(object)[i]) {
            object[Object.keys(object)[i]].intermediateLogs.push(array[j]);
          }
        }
      }

      for (let i = 0; i < Object.keys(object).length; i++) {
        const logsOfSelectedDate = await this.get_logs_between_range({
          driverId: driverId,
          startDate: Object.keys(object)[i],
          endDate: Object.keys(object)[i],
        });
        let finalCsv = logsOfSelectedDate[0].csv;
        let logsData = finalCsv['eldEventListForDriversRecordOfDutyStatus'];
        logsData = this.sortingDateTime(logsData);
        logsData.splice(
          object[Object.keys(object)[i]].intermediatePlacingIndex - 1,
          object[Object.keys(object)[i]].removeAvailableintermediatesLength + 1,
          ...object[Object.keys(object)[i]].intermediateLogs,
        );
        finalCsv['eldEventListForDriversRecordOfDutyStatus'] = logsData;
        console.log(
          `finalCSv view ----- `,
          finalCsv['eldEventListForDriversRecordOfDutyStatus'],
        );

        // Updates violations of previos date DR status logs
        // if (object[Object.keys(object)[i]].intermediateLogs.length > 0) {
        //   finalCsv['eldEventListForDriversRecordOfDutyStatus'][
        //     object[Object.keys(object)[i]].intermediatePlacingIndex - 1
        //   ]['violation'] = true;
        // }

        finalCsv = this.checkDecimalValueOfCsvFile(finalCsv);
        logsOfSelectedDate[0].csv = finalCsv;
        await this.addToDB(logsOfSelectedDate[0], user);
      }
    } else if (Object.keys(normalizedResp.data).length == 0) {
      return normalizedResp;
    }

    return normalizedResp;
  };

  /////////////////////////////////
  createMissingCSV = async (latestCSV: any, user: any, date) => {
    try {
      const companyTimeZone = user.homeTerminalTimeZone.tzCode;
      const finalCsv = latestCSV.csv;
      latestCSV.meta.dateTime = moment.tz(date, companyTimeZone).unix();
      latestCSV.meta.pti = '0';
      latestCSV.date = date;

      finalCsv.eventAnnotationsCommentsAndDriverLocation = [];
      finalCsv.eldEventListForDriverCertificationOfOwnRecords = [];
      const newLog =
        finalCsv.eldEventListForDriversRecordOfDutyStatus[
          finalCsv.eldEventListForDriversRecordOfDutyStatus.length - 1
        ];
      finalCsv.malfunctionsAndDiagnosticEventRecords = [];
      finalCsv.eventLogListForUnidentifiedDriverProfile = [];
      finalCsv.eldEventListForDriversRecordOfDutyStatus = [];
      finalCsv.eldLoginLogoutReport = [];
      finalCsv.cmvEnginePowerUpShutDownActivity = [];
      newLog.eventCode = finalCsv.timePlaceLine.currentEventCode;
      newLog.eventType = finalCsv.timePlaceLine.currentEventType
        ? finalCsv.timePlaceLine.currentEventType
        : '1';
      newLog.eventTime = '000000';
      newLog.eventDate = moment(date).format('MMDDYY');
      newLog.eventRecordStatus = '1';
      newLog.eventSequenceIdNumber = generateUniqueHexId();
      const logCheckSum = this.getLogChecksum(newLog);
      newLog.eventDataCheckValue = logCheckSum['eventDataCheckValue'];
      newLog.lineDataCheckValue = logCheckSum['lineDataCheckValue'];
      finalCsv.eldEventListForDriversRecordOfDutyStatus.push(newLog);
      finalCsv.timePlaceLine.currentDate = moment(date).format('MMDDYY');
      finalCsv.timePlaceLine.currentTime = moment
        .tz(moment(), companyTimeZone)
        .format('HHmmss');

      let dataStr = '';
      Object.keys(finalCsv.timePlaceLine).map((item) => {
        if (item !== 'lineDataCheckValue') {
          dataStr += finalCsv.timePlaceLine[item];
        }
      });

      const result = checkSum(dataStr);
      finalCsv.timePlaceLine.lineDataCheckValue = result.hexa;
      latestCSV.csv = finalCsv;
      const originalLogs = {
        cmvEnginePowerUpShutDownActivity: [],
        eldEventListForDriverCertificationOfOwnRecords: [],
        eldEventListForDriversRecordOfDutyStatus:
          finalCsv.eldEventListForDriversRecordOfDutyStatus,
        eldLoginLogoutReport: [],
      };
      latestCSV['originalLogs'] = originalLogs;
      delete latestCSV._id;

      return latestCSV;
    } catch (error) {
      return error;
    }
  };

  //update todays csv
  updateCSV = async (latestCSV: any, user: any, date) => {
    try {
      const companyTimeZone = user.homeTerminalTimeZone.tzCode;
      const finalCsv = latestCSV.csv;
      latestCSV.meta.dateTime = moment.tz(date, companyTimeZone).unix();

      finalCsv.timePlaceLine.currentDate = moment(date).format('MMDDYY');
      finalCsv.timePlaceLine.currentTime = moment
        .tz(moment(), companyTimeZone)
        .format('HHmmss');

      let dataStr = '';
      Object.keys(finalCsv.timePlaceLine).map((item) => {
        if (item !== 'lineDataCheckValue') {
          dataStr += finalCsv.timePlaceLine[item];
        }
      });

      const result = checkSum(dataStr);
      finalCsv.timePlaceLine.lineDataCheckValue = result.hexa;
      latestCSV.csv = finalCsv;
      delete latestCSV._id;

      return latestCSV;
    } catch (error) {
      return error;
    }
  };
  // **********************************************
  getLogChecksum = (newLog: any) => {
    let dataStr = '';
    Object.keys(newLog).map((item) => {
      if (item != 'lineDataCheckValue' && item != 'eventDataCheckValue') {
        dataStr += newLog[item];
      }
    });
    const logCheckSum = {};
    const eventChecksum = eventCheckSum(dataStr);
    logCheckSum['eventDataCheckValue'] = eventChecksum.hexa;
    const result = checkSum(dataStr + eventChecksum.hexa);
    logCheckSum['lineDataCheckValue'] = result.hexa;
    return logCheckSum;
  };
  // this is the Hos for the sync api call.
  flowOfHOSForRecent = async (recentCSV, user) => {
    try {
      if (recentCSV && recentCSV[0]?.meta?.deviceCalculations) {
        // check if the most recent csv has proper data
        const lastSyncTime = moment
          .unix(recentCSV[0]?.meta?.deviceCalculations.LAST_SYNC_TIME)
          .tz(user.homeTerminalTimeZone.tzCode);
        let lastCalculations;
        let lastCalculatedData;
        if (lastSyncTime.format('HH:mm:ss') == '23:59:59') {
          lastCalculations = recentCSV[0]?.meta?.deviceCalculations;
        } else {
          let dateOfQuery = moment(recentCSV[0].date);
          dateOfQuery = dateOfQuery.subtract(1, 'days');
          const dateQuery = dateOfQuery.format('YYYY-MM-DD');
          const previusQuery = {
            start: dateQuery,
            end: dateQuery,
          };
          lastCalculatedData = await this.getFromDB(previusQuery, user);
          lastCalculations =
            lastCalculatedData.graphData[0]?.meta?.deviceCalculations;
        }
        const currentDateTimeUnix = moment()
          .tz(user.homeTerminalTimeZone.tzCode)
          .unix();
        const datesBetween = getDatesBetweenUnixTimestamps(
          recentCSV[0].meta.dateTime,
          currentDateTimeUnix,
          user.homeTerminalTimeZone.tzCode,
        );
        const csvPresent = isSameDay(
          recentCSV[0].meta.dateTime,
          currentDateTimeUnix,
        );
        const isDataPresent = await this.findByDriverID(user._id, '');

        if (isDataPresent.length > 0) {
          const result = await this.deleteDriverRecord(user._id, '');
        }
        let latestCSV;
        for (const date of datesBetween) {
          latestCSV = recentCSV[0];
          if (date == recentCSV[0].date) {
            lastCalculations.pti = recentCSV[0].meta.pti;
            latestCSV = await this.calculateHOS(
              recentCSV[0],
              lastCalculations,
              user,
            );

            lastCalculations = latestCSV.meta.deviceCalculations;
            lastCalculations = this.updateLastStatus(
              lastCalculatedData.graphData[0].csv
                .eldEventListForDriversRecordOfDutyStatus,
              lastCalculations,
            );
            const powerUp = latestCSV.csv.cmvEnginePowerUpShutDownActivity;
            powerUp.sort((a, b) => a.eventTime.localeCompare(b.eventTime));
            if (
              powerUp.length > 0 &&
              powerUp[powerUp.length - 1].eventCode == '2'
            ) {
              lastCalculations.powerUp = true;
            } else if (
              powerUp.length > 0 &&
              powerUp[powerUp.length - 1].eventCode == '4'
            ) {
              lastCalculations.powerUp = false;
            }
            const response = await this.addToDB(latestCSV, user);
          } else {
            // need to test create missing Csv as i don't have latestCsv now

            if (!csvPresent) {
              latestCSV = await this.createMissingCSV(latestCSV, user, date);
              lastCalculations.pti = latestCSV.meta.pti;

              latestCSV = this.calculateHOS(latestCSV, lastCalculations, user);
              lastCalculations = latestCSV.meta.deviceCalculations;

              const response = await this.addToDB(latestCSV, user);
              lastCalculations = this.updateLastStatus(
                latestCSV.csv.eldEventListForDriversRecordOfDutyStatus,
                lastCalculations,
              );
              const powerUp = latestCSV.csv.cmvEnginePowerUpShutDownActivity;
              powerUp.sort((a, b) => a.eventTime.localeCompare(b.eventTime));
              if (
                powerUp.length > 0 &&
                (powerUp[powerUp.length - 1].eventCode == '2' ||
                  powerUp[powerUp.length - 1].eventCode == '1')
              ) {
                lastCalculations.powerUp = true;
              } else if (
                powerUp.length > 0 &&
                (powerUp[powerUp.length - 1].eventCode == '4' ||
                  powerUp[powerUp.length - 1].eventCode == '3')
              ) {
                lastCalculations.powerUp = false;
              }
            } else if (csvPresent) {
              latestCSV = await this.updateCSV(latestCSV, user, latestCSV.date);
              lastCalculations.pti = latestCSV.meta.pti;

              latestCSV = this.calculateHOS(latestCSV, lastCalculations, user);
              lastCalculations = latestCSV.meta.deviceCalculations;
              const response = await this.addToDB(latestCSV, user);
              lastCalculations = this.updateLastStatus(
                latestCSV.csv.eldEventListForDriversRecordOfDutyStatus,
                lastCalculations,
              );
            }
          }

          if (!user._id) {
            user._id = user.id;
          }
          await this.updateRecordMade(user, latestCSV);
        }
        // this potion is commented because there is no need to update hos only from here.
        // const meta = await this.updateMetaVariables(latestCSV);

        // if (user?._id) {
        //   user.id = user?._id?.toString(); // for making unit get by grivierid
        // }
        // const messagePatternUnits =
        //   await firstValueFrom<MessagePatternResponseType>(
        //     this.unitClient.send(
        //       { cmd: 'assign_meta_to_units' },
        //       { meta, user },
        //     ),
        //   );
        // if (messagePatternUnits.isError) {
        //   mapMessagePatternResponseToException(messagePatternUnits);
        // }
      }
    } catch (error) {}
  };

  //**************************************** */
  updateRecordMade = async (user, latestCSV) => {
    const recordMade = {
      driverId: '',
      date: '2023-10-25',
      // driverName: 'Sharif',
      vehicleName: '',
      shippingId: '',
      signature: '',
      hoursWorked: 19220020,
      distance: '0',
      violations: [],
      status: {},
      clock: {},
      // homeTerminalTimeZone: {},
      // tenantId: '',
      lastKnownActivity: {},
      isPti: '',
    };

    recordMade.driverId = user?._id;
    recordMade.date = latestCSV?.date;
    // recordMade.driverName = user?.driverFullName;
    const csvDataOfDutyStatus =
      latestCSV.csv.eldEventListForDriversRecordOfDutyStatus; // get all the duty statuses
    csvDataOfDutyStatus.sort((a, b) => a.eventTime.localeCompare(b.eventTime));

    const shippingIds = [];
    const trailerIds = [];
    const vehicleIds = [];
    csvDataOfDutyStatus.forEach((record) => {
      if (!shippingIds.includes(record.shippingId)) {
        shippingIds.push(record.shippingId);
      }
      if (!trailerIds.includes(record.trailerId)) {
        trailerIds.push(record.trailerId);
      }
      if (!vehicleIds.includes(record.vehicleId)) {
        if (record.vehicleId !== '') {
          vehicleIds.push(record.vehicleId);
        }
      }
    });

    recordMade.vehicleName = vehicleIds.toString() ?? null;
    // recordMade.violations = latestCSV?.meta?.voilations;
    recordMade.status = {
      currentEventType: latestCSV.csv.timePlaceLine.currentEventType,

      currentEventCode: latestCSV.csv.timePlaceLine.currentEventCode,
    };
    let statuses = latestCSV.csv.eldEventListForDriversRecordOfDutyStatus;
    recordMade.lastKnownActivity['location'] =
      statuses[statuses.length - 1].address;
    let signature;
    if (
      latestCSV.csv.eldEventListForDriverCertificationOfOwnRecords.length > 0
    ) {
      recordMade.shippingId =
        latestCSV.csv.eldEventListForDriverCertificationOfOwnRecords[0].shippingDocumentNumber;
      signature = true;
    } else {
      recordMade.shippingId = '';
      signature = false;
    }
    if (
      latestCSV.csv.eldEventListForDriverCertificationOfOwnRecords.length > 0
    ) {
      recordMade.signature = '1';
    } else {
      recordMade.signature = '0';
    }
    recordMade.hoursWorked = latestCSV.meta?.deviceCalculations?.HOURS_WORKED;
    recordMade.distance = latestCSV.meta?.totalVehicleMiles;
    // recordMade.homeTerminalTimeZone = user?.homeTerminalTimeZone;
    // recordMade.tenantId = user?.tenantId;
    //Add violations here
    recordMade.clock = latestCSV.meta.clockData;
    let voilationtemp = JSON.stringify(latestCSV.meta.voilations);
    recordMade.violations = JSON.parse(voilationtemp);
    if (!signature) {
      recordMade.violations.push({ type: 'SIGNATURE_MISSING' });
    }

    let ptiObject = latestCSV?.meta?.ptiViolation;
    if (ptiObject.length > 0) {
      for (let ptiData of ptiObject) {
        if (ptiData.type == '1') {
          recordMade.violations.push({ type: 'PTI_MISSING' });
        } else if (ptiData.type == '3') {
          recordMade.violations.push({ type: 'PTI_TIME_INSUFFICIENT' });
        }
      }
    }

    // add vehicle and trailer and shipping violations
    if (recordMade.vehicleName === '') {
      recordMade.violations.push({ type: 'NO_VEHICLE' });
    }
    if (shippingIds.toString() === '') {
      recordMade.violations.push({ type: 'NO_SHIPPING_ID' });
    }
    if (trailerIds.toString() === '') {
      recordMade.violations.push({ type: 'NO_TRAILER_ID' });
    }
    // call function and update or add deatils here.
    const resRecord = await this.addAndUpdateDriverRecord(recordMade);
    return resRecord;
  };
  flowOfHOSForPrevious = async (recentCSV, user) => {
    try {
      if (recentCSV && recentCSV[0]?.meta?.deviceCalculations) {
        // check if the most recent csv has proper data
        const lastSyncTime = moment
          .unix(recentCSV[0]?.meta?.deviceCalculations.LAST_SYNC_TIME)
          .tz(user.homeTerminalTimeZone.tzCode);
        let lastCalculations;
        let lastCalculatedData;
        //check if the recent csv time is end of day.
        if (lastSyncTime.format('HH:mm:ss') == '23:59:59') {
          lastCalculations = recentCSV[0]?.meta?.deviceCalculations;
        } else {
          //if not end of day then go back to the previous day data.
          let dateOfQuery = moment(recentCSV[0].date);
          dateOfQuery = dateOfQuery.subtract(1, 'days');
          const dateQuery = dateOfQuery.format('YYYY-MM-DD');
          const previusQuery = {
            start: dateQuery,
            end: dateQuery,
          };
          lastCalculatedData = await this.getFromDB(previusQuery, user);
          lastCalculations =
            lastCalculatedData.graphData[0].meta.deviceCalculations;
        }
        //get the current time and date accordin to the timzone of driver
        const currentDateTimeUnix = moment()
          .tz(user.homeTerminalTimeZone.tzCode)
          .unix();
        //get all th dates between the curent date and the time we started calculations from
        const datesBetween = getDatesBetweenUnixTimestamps(
          recentCSV[0].meta.dateTime,
          currentDateTimeUnix,
          user.homeTerminalTimeZone.tzCode,
        );
        const csvPresent = isSameDay(
          recentCSV[0].meta.dateTime,
          currentDateTimeUnix,
        );
        let latestCSV;
        datesBetween.shift();
        let index = 0;
        for (const date of datesBetween) {
          const query = {
            start: date,
            end: date,
          };

          latestCSV = await this.getFromDB(query, user); // get current date csv
          latestCSV = latestCSV.graphData;
          if (csvPresent) {
            latestCSV = await this.updateCSV(
              latestCSV[0],
              user,
              latestCSV.date,
            );
          } else {
            latestCSV = latestCSV[0];
          }
          const lastData = { lastObject: {}, lastPower: '' };
          if (index == 0) {
            lastData.lastObject = latestCSV.meta.deviceCalculations.lastLogTime;
            lastData.lastPower = latestCSV.meta.powerUp;
          } else {
            latestCSV.meta.powerUp = lastCalculations.powerUp;
          }
          lastCalculations.pti = latestCSV.meta.pti;

          latestCSV = this.calculateHOS(latestCSV, lastCalculations, user);

          lastCalculations = latestCSV.meta.deviceCalculations;
          if (index == 0) {
            latestCSV.meta.deviceCalculations.lastLogTime = lastData.lastObject;
            latestCSV.meta.powerUp = lastData.lastPower;
          }
          const response = await this.addToDB(latestCSV, user);
          lastCalculations = this.updateLastStatus(
            latestCSV.csv.eldEventListForDriversRecordOfDutyStatus,
            lastCalculations,
          );

          const powerUp = latestCSV.csv.cmvEnginePowerUpShutDownActivity;
          powerUp.sort((a, b) => a.eventTime.localeCompare(b.eventTime));
          if (
            powerUp.length > 0 &&
            (powerUp[powerUp.length - 1].eventCode == '2' ||
              powerUp[powerUp.length - 1].eventCode == '1')
          ) {
            lastCalculations.powerUp = true;
          } else if (
            powerUp.length > 0 &&
            (powerUp[powerUp.length - 1].eventCode == '4' ||
              powerUp[powerUp.length - 1].eventCode == '3')
          ) {
            lastCalculations.powerUp = false;
          }
          console.log(
            '\n\n\n  in update log Driver id previous days ++++++++++++' +
              user?._id,
          );
          if (!user._id) {
            user._id = user.id;
            console.log(
              '\n\n\n inside if in update log Driver id previous days++++++++++++' +
                user?._id,
            );
          }
          await this.updateRecordMade(user, latestCSV);
          index++;
        }
        // const meta = await this.updateMetaVariables(
        //   latestCSV,
        // );
        // console.log(`The Date Unit is being Updated`  + meta.lastActivity.currentDate);

        // if (user?._id) {
        //   user.id = user?._id?.toString(); // for making unit get by grivierid
        // }
        // const messagePatternUnits =
        //   await firstValueFrom<MessagePatternResponseType>(
        //     this.unitClient.send({ cmd: 'assign_meta_to_units' }, { meta, user }),
        //   );
        // if (messagePatternUnits.isError) {
        //   mapMessagePatternResponseToException(messagePatternUnits);
        // }
      }
    } catch (error) {}
  };
  //**************************************** */
  // this is the main function for calculating HOS on recent
  runCalculationOnRecentHOS = async (query, user) => {
    try {
      const recentCSV = await this.getLatestCSV(query, user); // this line is for getting the previous csv available for the given driver
      if (recentCSV == 2 || recentCSV.length == 0) {
        return 2;
      }
      await this.flowOfHOSForRecent(recentCSV, user);
      return 1;
    } catch (error) {
      return 2;
    }
  };
  //*********************************** */
  //update last status
  updateLastStatus = (
    eldEventListForDriversRecordOfDutyStatus,
    lastCalculations,
  ) => {
    let dutyStatuses = [];
    eldEventListForDriversRecordOfDutyStatus.forEach((element, index) => {
      if (
        (element.eventType == 1 || element.eventType == 3) &&
        element.eventRecordStatus == 1 // represents active
      ) {
        // get all the statuses of event type 1 and event type 3
        dutyStatuses.push(element);
      }
    });
    dutyStatuses = dutyStatuses.sort((a, b) =>
      a.eventTime.localeCompare(b.eventTime),
    );
    const dutyStatusLenght = dutyStatuses.length;
    if (dutyStatuses[dutyStatusLenght - 1].eventTime != '000000') {
      lastCalculations.lastLogTime = {
        eventDate: dutyStatuses[dutyStatusLenght - 1].eventDate,
        eventTime: dutyStatuses[dutyStatusLenght - 1].eventTime,
        eventType: dutyStatuses[dutyStatusLenght - 1].eventType,
        eventCode: dutyStatuses[dutyStatusLenght - 1].eventCode,
      };
    } else if (
      dutyStatuses[dutyStatusLenght - 1].eventTime == '000000' &&
      lastCalculations.lastLogTime.eventCode !=
        dutyStatuses[dutyStatusLenght - 1].eventCode &&
      lastCalculations.lastLogTime.eventType !=
        dutyStatuses[dutyStatusLenght - 1].eventType
    ) {
      lastCalculations.lastLogTime = {
        eventDate: dutyStatuses[dutyStatusLenght - 1].eventDate,
        eventTime: dutyStatuses[dutyStatusLenght - 1].eventTime,
        eventType: dutyStatuses[dutyStatusLenght - 1].eventType,
        eventCode: dutyStatuses[dutyStatusLenght - 1].eventCode,
      };
    }
    return lastCalculations;
  };
  //**************************************** */
  // this is the main function for calculating HOS on recent
  runCalculationOnDateHOS = async (query, user) => {
    const recentCSV = await this.getFromDB(query, user); // this line is for getting the previous csv available for the given driver
    await this.flowOfHOSForPrevious(recentCSV.graphData, user);
  };

  //**************************************** */
  // this is the main function for getting Logform
  getLogform = async (query, user) => {
    const recentCSV = await this.getFromDB(query, user); // this line is for getting the previous csv available for the given driver
    const csvOfDate = recentCSV.graphData[0];
    const csvDataOfDutyStatus =
      csvOfDate.csv.eldEventListForDriversRecordOfDutyStatus; // get all the duty statuses
    csvDataOfDutyStatus.sort((a, b) => a.eventTime.localeCompare(b.eventTime));

    const shippingIds = [];
    const trailerIds = [];
    csvDataOfDutyStatus.forEach((record) => {
      if (!shippingIds.includes(record.shippingId)) {
        shippingIds.push(record.shippingId);
      }
      if (!trailerIds.includes(record.trailerId)) {
        trailerIds.push(record.trailerId);
      }
    });
    return { shippingIds, trailerIds };
  };

  transferLog = async (sequenceId, date, duration, user, type) => {
    // console.log('this is the date of status==========>', date);

    try {
      const query = {
        start: date,
        end: moment().tz(user.homeTerminalTimeZone.tzCode).format('YYYY-MM-DD'),
      };
      // console.log('this is the date of status==========>', query);

      const resp: any = await this.getFromDB(query, user);
      // console.log('this is the length of resp', resp.graphData.length);
      const isDatePresent = resp.graphData.some((obj) => obj.date === date);
      if (isDatePresent) {
        if (resp && resp.graphData && resp.graphData.length > 0) {
          let allDutystatuses = [];

          resp.graphData.forEach((element) => {
            allDutystatuses.push(
              ...element.csv.eldEventListForDriversRecordOfDutyStatus,
              ...element.csv.eventAnnotationsCommentsAndDriverLocation,
              // ...element.csv.eldEventListForDriverCertificationOfOwnRecords,
              ...element.csv.malfunctionsAndDiagnosticEventRecords,
              ...element.csv.eventLogListForUnidentifiedDriverProfile,
              ...element.csv.cmvEnginePowerUpShutDownActivity,
              ...element.csv.eldLoginLogoutReport,
            );
          });
          // sort all the logs based on date and time
          allDutystatuses = this.sortingDateTime(allDutystatuses);

          // if we want to add time in current we go for this function otherwise
          if (type == 1) {
            this.subtractFromLogs(date, allDutystatuses, sequenceId, duration);
          } else if (type == 2) {
            // if we want to subtract time in current we go for this function.
            this.addInLogs(date, allDutystatuses, sequenceId, duration);
          }

          const datesBetween = getDatesInRange(query.start, query.end);

          let getOnDateLogs;

          let previousDayLog;
          let currentStatus;
          for (const [index, date] of datesBetween.entries()) {
            //get logs of the date which is in loop iteration
            getOnDateLogs = allDutystatuses.filter(
              (item) => item.eventDate === moment(date).format('MMDDYY'),
            );

            if (previousDayLog) {
              getOnDateLogs.push(this.createMissingLog(previousDayLog, date));
            }
            let filteredLogs = getOnDateLogs
              .filter((element) => {
                return (
                  (element.eventType == 1 ||
                    // element.eventType == 2 ||
                    element.eventType == 3) &&
                  element.eventRecordStatus == 1
                );
              })
              .sort((a, b) => a.eventTime.localeCompare(b.eventTime));
            getOnDateLogs = getOnDateLogs.sort((a, b) =>
              a.eventTime.localeCompare(b.eventTime),
            );
            previousDayLog = filteredLogs[filteredLogs.length - 1];
            currentStatus = filteredLogs[filteredLogs.length - 1].eventCode;

            filteredLogs = await removeDuplicateConsecutiveLogs(filteredLogs);
            const filteredLogsNonDuty = getOnDateLogs
              .filter((element) => {
                return (
                  element.eventType != 1 &&
                  // element.eventType != 2 &&
                  element.eventType != 3
                );
              })
              .sort((a, b) => a.eventTime.localeCompare(b.eventTime));
            const mergeArr = [...filteredLogsNonDuty, ...filteredLogs];
            getOnDateLogs = mergeArr;
            const currentCsv = resp.graphData.find((item) => item.date == date);
            const latestCsv = this.structureLogsCsv(currentCsv, getOnDateLogs);

            // let lastCalculations;
            //

            const response = await this.addToDB(latestCsv, user);
          }
          return 1;
        } else {
          return 2;
        }
      } else {
        return 3;
      }
    } catch (error) {
      throw error;
    }
  };
  subtractDurationFromDate(eventDate, eventTime, duration) {
    // Parse eventDate and eventTime into Date object
    const dateObj = moment(eventDate + eventTime, 'MMDDYYHHmmss');

    // Subtract duration from the Date object
    dateObj.subtract(duration, 'seconds');

    // Extract the new eventDate and eventTime
    const newEventDate = dateObj.format('MMDDYY');
    const newEventTime = dateObj.format('HHmmss');
    return {
      newEventDate,
      newEventTime,
    };
  }
  //
  addDurationToDate(eventDate, eventTime, duration) {
    // Parse eventDate and eventTime into a Date object
    const dateObj = moment(eventDate + eventTime, 'MMDDYYHHmmss');

    // Add duration to the Date object
    dateObj.add(duration, 'seconds');

    // Extract the new eventDate and eventTime
    const newEventDate = dateObj.format('MMDDYY');
    const newEventTime = dateObj.format('HHmmss');

    return {
      newEventDate,
      newEventTime,
    };
  }
  //structureLogsCsv
  structureLogsCsv = (latestCsv, getOnDateLogs) => {
    latestCsv.csv.eldEventListForDriversRecordOfDutyStatus =
      getOnDateLogs.filter((element) => {
        return (
          element.eventType == 1 ||
          element.eventType == 2 ||
          element.eventType == 3
        );
      });
    //violations are updated here and added in the csv

    latestCsv.csv.eldLoginLogoutReport = getOnDateLogs.filter((element) => {
      return element.hasOwnProperty('eldUsername');
    });
    latestCsv.csv.cmvEnginePowerUpShutDownActivity = getOnDateLogs.filter(
      (element) => {
        return element.hasOwnProperty('cmvPowerUnitNumber');
      },
    );

    latestCsv.csv.eventAnnotationsCommentsAndDriverLocation =
      getOnDateLogs.filter((element) => {
        return element.hasOwnProperty('driverLocationDescription');
      });
    // latestCsv.csv.eldEventListForDriverCertificationOfOwnRecords =
    //   getOnDateLogs.filter((element) => {
    //     return element.hasOwnProperty('certificateType');
    //   });
    return latestCsv;
  };
  //
  //
  //
  subtractFromLogs = (date, allDutystatuses, sequenceId, duration) => {
    const index = this.getCurrentIndex(date, allDutystatuses, sequenceId);

    for (let i = index + 1; i < allDutystatuses.length; i++) {
      const result = this.subtractDurationFromDate(
        allDutystatuses[i].eventDate,
        allDutystatuses[i].eventTime,
        duration,
      );

      allDutystatuses[i].eventDate = result.newEventDate;
      allDutystatuses[i].eventTime = result.newEventTime;
    }
    return allDutystatuses;
  };
  //
  addInLogs = (date, allDutystatuses, sequenceId, duration) => {
    const index = this.getCurrentIndex(date, allDutystatuses, sequenceId);

    for (let i = index + 1; i < allDutystatuses.length; i++) {
      const result = this.addDurationToDate(
        allDutystatuses[i].eventDate,
        allDutystatuses[i].eventTime,
        duration,
      );

      allDutystatuses[i].eventDate = result.newEventDate;
      allDutystatuses[i].eventTime = result.newEventTime;
    }
    return allDutystatuses;
  };
  //
  getCurrentIndex = (date, allDutystatuses, sequenceId) => {
    const transferDate = moment(date).format('MMDDYY');
    const index = allDutystatuses.findIndex((item) => {
      if (
        item.eventSequenceIdNumber == sequenceId &&
        item.eventDate == transferDate
      ) {
        return item;
      }
    });
    if (index == -1) {
      return 2;
    }
    return index;
  };
  sortingDateTime = (array) => {
    array.sort((a, b) => {
      const dateA = a.eventDate;
      const dateB = b.eventDate;
      const timeA = a.eventTime;
      const timeB = b.eventTime;

      // First, compare based on eventDate
      const dateComparison = dateA.localeCompare(dateB);

      // If eventDate is the same, compare based on eventTime
      if (dateComparison === 0) {
        return timeA.localeCompare(timeB);
      }

      return dateComparison;
    });
    return array;
  };
  // sortingDateTime = (array) => {
  //   array.sort((a, b) => {
  //     const dateA = new Date(a.eventDate + ' ' + a.eventTime);
  //     const dateB = new Date(b.eventDate + ' ' + b.eventTime);

  //     // Compare based on year
  //     const yearComparison = dateA.getFullYear() - dateB.getFullYear();

  //     // If years are different, return the year comparison
  //     if (yearComparison !== 0) {
  //       return yearComparison;
  //     }

  //     // If years are the same, compare based on eventTime
  //     const timeA = a.eventTime;
  //     const timeB = b.eventTime;
  //     return timeA.localeCompare(timeB);
  //   });

  //   return array;
  // };
  //
  createMissingLog = (previousLog, date) => {
    previousLog.eventDate = moment(date).format('MMDDYY');
    previousLog.eventTime = '000000';
    previousLog.eventRecordOrigin = '1';
    previousLog.eventSequenceIdNumber = generateUniqueHexId();
    return previousLog;
  };

  addToDB = async (data: any, driverInfo: any) => {
    try {
      const collectionNames = await dbConnection(); // ---> May needed in future otherwise remove this
      const date = data.meta.dateTime;
      const month = monthFormatForDynamicCollection(
        date,
        driverInfo.homeTerminalTimeZone.tzCode,
      );
      const day = dayFormatForDynamicCollection(
        date,
        driverInfo.homeTerminalTimeZone.tzCode,
      );
      const collectionName = await getModelName(driverInfo, date);
      const dynamicModel = mongoose.model(
        `${collectionName}`,
        DriverCsvSchema,
        collectionName,
      );
      let response;
      data.date = moment
        .unix(date)
        .tz(driverInfo.homeTerminalTimeZone.tzCode)
        .format('YYYY-MM-DD');
      data = { ...data, month: month, day: day };
      let result;
      // const result = await dynamicModel
      //   .findOneAndUpdate({ month: month, day: day }, data, {
      //     upsert: true,
      //     new: true,
      //   })
      //   .lean();
      const existingData = await dynamicModel
        .findOne({ month: month, day: day })
        .lean();
      // if (existingData) {
      //   let lengthOfExisting =
      //     existingData.csv.eldEventListForDriversRecordOfDutyStatus.length;
      //   let lengthOfIncoming =
      //     data.csv.eldEventListForDriversRecordOfDutyStatus.length;
      //   let existingClocks = existingData.meta.clockData.cycleSeconds;
      //   let incomingClocks = data.meta.clockData.cycleSeconds;
      //   let condition =
      //     lengthOfIncoming >= lengthOfExisting &&
      //     incomingClocks >= existingClocks
      //       ? true
      //       : false;
      //       console.log("cobdition on data entry ===> "+condition);
      //   if (condition) {
      //     result = await dynamicModel
      //       .findOneAndUpdate({ month: month, day: day }, data, {
      //         upsert: true,
      //         new: true,
      //       })
      //       .lean();
      //   } else if (condition) {
      //     return {
      //       error: true,
      //       message: 'This entry is not with Correct Data',
      //     };
      //   }
      // }
      // else if (!existingData) {
      result = await dynamicModel
        .findOneAndUpdate({ month: month, day: day }, data, {
          upsert: true,
          new: true,
        })
        .sort({ date: 1 })
        .lean();
      // }
      response = result;
      return response;
    } catch (error) {
      throw error;
    }
  };
  updateToDB = async (data: any, driverInfo: any) => {
    try {
      const collectionNames = await dbConnection(); // ---> May needed in future otherwise remove this
      const date = data.meta.dateTime;
      const month = monthFormatForDynamicCollection(
        date,
        driverInfo.homeTerminalTimeZone.tzCode,
      );
      const day = dayFormatForDynamicCollection(
        date,
        driverInfo.homeTerminalTimeZone.tzCode,
      );
      const collectionName = await getModelName(driverInfo, date);
      const dynamicModel = mongoose.model(
        `${collectionName}`,
        DriverCsvSchema,
        collectionName,
      );
      let response;
      Logger.log('ppoint where we check date');
      Logger.log(date);
      Logger.log(driverInfo.homeTerminalTimeZone.tzCode);

      data.date = moment
        .unix(date)
        .tz(driverInfo.homeTerminalTimeZone.tzCode)
        .format('YYYY-MM-DD');
      data = { ...data, month: month, day: day };
      let result;
      // const result = await dynamicModel
      //   .findOneAndUpdate({ month: month, day: day }, data, {
      //     upsert: true,
      //     new: true,
      //   })
      //   .lean();
      const existingData = await dynamicModel
        .findOne({ month: month, day: day })
        .lean();
      // if (existingData) {
      //   let lengthOfExisting =
      //     existingData.csv.eldEventListForDriversRecordOfDutyStatus.length;
      //   let lengthOfIncoming =
      //     data.csv.eldEventListForDriversRecordOfDutyStatus.length;
      //   let existingClocks = existingData.meta.clockData.cycleSeconds;
      //   let incomingClocks = data.meta.clockData.cycleSeconds;
      //   let condition =
      //     lengthOfIncoming >= lengthOfExisting &&
      //     incomingClocks >= existingClocks
      //       ? true
      //       : false;
      //       console.log("cobdition on data entry ===> "+condition);
      //   if (condition) {
      //     result = await dynamicModel
      //       .findOneAndUpdate({ month: month, day: day }, data, {
      //         upsert: true,
      //         new: true,
      //       })
      //       .lean();
      //   } else if (condition) {
      //     return {
      //       error: true,
      //       message: 'This entry is not with Correct Data',
      //     };
      //   }
      // }
      // else if (!existingData) {
      result = await dynamicModel
        .findOneAndReplace({ month: month, day: day }, data, {
          upsert: true,
          new: true,
        })
        .lean();
      // }
      response = result;
      return response;
    } catch (error) {
      throw error;
    }
  };
  // message patern function
  getGraphFromDB = async (date: any, driverInfo: any) => {
    try {
      await dbConnection(); // ---> May needed in future otherwise remove this
      const { start } = getTimeZoneDateRangeForDay(
        date.start,
        driverInfo.homeTerminalTimeZone.tzCode,
      );
      const { end } = getTimeZoneDateRangeForDay(
        date.end,
        driverInfo.homeTerminalTimeZone.tzCode,
      );

      const collectionName = await getModelName(driverInfo, start);
      const dynamicModel = mongoose.model(
        `${collectionName}`,
        DriverCsvSchema,
        collectionName,
      );
      const query = {
        'meta.dateTime': {
          $gte: start,
          $lte: end,
        },
      };
      const result = await dynamicModel.find(query).lean();

      return result;
    } catch (error) {
      throw error;
    }
  };
  getFromDB = async (date: any, driverInfo: any) => {
    try {
      await dbConnection(); // ---> May needed in future otherwise remove this
      const { start } = getTimeZoneDateRangeForDay(
        date.start,
        driverInfo.homeTerminalTimeZone.tzCode,
      );
      const { end } = getTimeZoneDateRangeForDay(
        date.end,
        driverInfo.homeTerminalTimeZone.tzCode,
      );
      let response;
      const driverID = driverInfo.id || driverInfo._id;
      const collectionName = await getModelName(driverInfo, start);
      const dynamicModel = mongoose.model(
        `${collectionName}`,
        DriverCsvSchema,
        collectionName,
      );
      const query = {
        'meta.dateTime': {
          $gte: start,
          $lte: end,
        },
      };
      const result = await dynamicModel.find(query).lean();
      // result.date

      /**
       * Check if log request is created? - V2
       * Author: Farzan
       */
      let isEditRequested = false;
      const editLogs = await this.editInsertLogsModel
        .find({
          driverId: driverID,
          isApproved: 'pending',
          dateTime: {
            $gte: JSON.stringify(start),
            $lte: JSON.stringify(end),
          },
        })
        .lean();
      if (editLogs.length > 0) {
        isEditRequested = true;
        editLogs[0].csvAfterUpdate['meta'] = result[0].meta;
      }

      response = {
        graphData: result,
        editStatus: {
          isEditRequested,
          editLogs,
          graphData: editLogs[0]?.csvBeforeUpdate || [],
        },
      };
      return response;
    } catch (error) {
      throw error;
    }
  };
  //this function will get the latest CSV from db collection
  getLatestCSV = async (date: any, driverInfo: any) => {
    try {
      await dbConnection(); // ---> May needed in future otherwise remove this
      const { start } = getTimeZoneDateRangeForDay(
        date.start,
        driverInfo.homeTerminalTimeZone.tzCode,
      );

      let response;
      const collectionName = await getModelName(driverInfo, start);
      const dynamicModel = mongoose.model(
        `${collectionName}`,
        DriverCsvSchema,
        collectionName,
      );
      const latestDocument = await dynamicModel
        .find()
        .sort({ _id: -1 })
        .limit(1)
        .lean()
        .exec();

      return latestDocument;
    } catch (error) {
      return 2;
      throw error;
    }
  };

  //delete from db
  delFromDB = async (date: any, driverInfo: any) => {
    try {
      await dbConnection(); // ---> May needed in future otherwise remove this
      const { start } = getTimeZoneDateRangeForDay(
        date.start,
        driverInfo.homeTerminalTimeZone.tzCode,
      );
      const { end } = getTimeZoneDateRangeForDay(
        date.end,
        driverInfo.homeTerminalTimeZone.tzCode,
      );

      const collectionName = await getModelName(driverInfo, start);
      const dynamicModel = mongoose.model(
        `${collectionName}`,
        DriverCsvSchema,
        collectionName,
      );
      const query = {
        'meta.dateTime': {
          $gte: start,
          $lte: end,
        },
      };
      const result = await dynamicModel.deleteOne(query).lean();
      // result.date

      /**
       * Check if log request is created? - V2
       * Author: Farzan
       */

      return result;
    } catch (error) {
      throw error;
    }
  };

  deleteLog = (logsOfSelectedDate, eventSequenceIdNumber) => {
    const finalCsv = logsOfSelectedDate[0].csv;

    logsOfSelectedDate.forEach((singleDay, index) => {
      if (index != 0) {
        finalCsv.eventAnnotationsCommentsAndDriverLocation.push(
          ...singleDay.csv.eventAnnotationsCommentsAndDriverLocation,
        );
        finalCsv.eldEventListForDriverCertificationOfOwnRecords.push(
          ...singleDay.csv.eldEventListForDriverCertificationOfOwnRecords,
        );
        finalCsv.malfunctionsAndDiagnosticEventRecords.push(
          ...singleDay.csv.malfunctionsAndDiagnosticEventRecords,
        );
        finalCsv.eventLogListForUnidentifiedDriverProfile.push(
          ...singleDay.csv.eventLogListForUnidentifiedDriverProfile,
        );
        finalCsv.eldEventListForDriversRecordOfDutyStatus.push(
          ...singleDay.csv.eldEventListForDriversRecordOfDutyStatus,
        );
        finalCsv.eldLoginLogoutReport.push(
          ...singleDay.csv.eldLoginLogoutReport,
        );
        finalCsv.cmvEnginePowerUpShutDownActivity.push(
          ...singleDay.csv.cmvEnginePowerUpShutDownActivity,
        );
      }
    });

    let decimal = 0;
    let checkValue;
    let isIncludedFlag = false;
    const deletedObjects = [];
    const deletableEventTypes = ['2', '4', '6'];
    Object.keys(finalCsv).map((item) => {
      if (Array.isArray(finalCsv[item])) {
        finalCsv[item].forEach((element, index) => {
          checkValue = finalCsv[item][index]?.lineDataCheckValue;
          decimal += parseInt(checkValue, 16);
          if (
            element['eventSequenceIdNumber'] &&
            eventSequenceIdNumber.includes(element['eventSequenceIdNumber'])
          ) {
            isIncludedFlag = true;
            deletedObjects.push(finalCsv[item][index]);
            delete finalCsv[item][index];
          }
        });
        finalCsv[item] = finalCsv[item].filter((element) => {
          return element != null;
        });
      } else if (!Array.isArray(finalCsv[item])) {
        if (item !== 'fileDataCheckLine') {
          checkValue = finalCsv[item]?.lineDataCheckValue;
          decimal += parseInt(checkValue, 16);
        }
        if (
          finalCsv[item].eventSequenceIdNumber &&
          eventSequenceIdNumber.includes(finalCsv[item].eventSequenceIdNumber)
        ) {
          isIncludedFlag = true;
          deletedObjects.push(finalCsv[item]);
          finalCsv[item] = {};
        }
      }
    });
    finalCsv.fileDataCheckLine.fileDataCheckValue = fileCheckData(decimal);

    return {
      logsOfSelectedDate,
      deletedObjects,
      isIncluded: {
        isIncludedFlag,
        message: `eventSequenceIdNumber does not exists!`,
      },
    };
  };
  /**
   * Normalization wardrobe - START
   */

  // To check fileDataCheckLine value in csv file - to maintain authenticity of the file
  checkDecimalValueOfCsvFile = (finalCsv) => {
    let decimal = 0;
    let checkValue;
    Object.keys(finalCsv).map((item) => {
      if (Array.isArray(finalCsv[item])) {
        finalCsv[item].forEach((element, index) => {
          checkValue = finalCsv[item][index]?.lineDataCheckValue;
          decimal += parseInt(checkValue, 16);
        });
        finalCsv[item] = finalCsv[item].filter((element) => {
          return element != null;
        });
      } else if (!Array.isArray(finalCsv[item])) {
        if (item !== 'fileDataCheckLine') {
          checkValue = finalCsv[item]?.lineDataCheckValue;
          decimal += parseInt(checkValue, 16);
        }
      }
    });
    finalCsv.fileDataCheckLine.fileDataCheckValue = fileCheckData(decimal);
    return finalCsv;
  };

  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_logs_of_specific_date_range' })
  async get_logs_between_range(requestParam: any): Promise<any> {
    try {
      const { driverId, startDate, endDate } = requestParam;
      let user = [];
      if (driverId) {
        await this.driverClient.connect();
        const messagePatternDriver =
          await firstValueFrom<MessagePatternResponseType>(
            this.driverClient.send({ cmd: 'get_driver_by_id' }, driverId),
          );
        if (messagePatternDriver.isError) {
          mapMessagePatternResponseToException(messagePatternDriver);
        }
        user = messagePatternDriver.data;
        await this.driverClient.close();
      }

      const query = {
        start: startDate.toString(),
        end: endDate.toString(),
      };

      const resp: any = await this.getGraphFromDB(query, user);
      return resp;
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      return err;
    }
  }

  /**
   * ################################ Normalization Wardrobe - START #################################
   */
  recursiveNormalize = async (
    // get_logs_between_range,
    driverId,
    nextDate,
    initialDutyHours,
    globalIntermediatesArray,
    user,
    normalizationType,
  ) => {
    let currentDrIndex;
    let currentDrObj;
    let drAlertFlag = false;
    const logsOfSelectedDate = await this.get_logs_between_range({
      driverId: driverId,
      startDate: nextDate,
      endDate: nextDate,
    });
    console.log(`nextDate check ------ `, nextDate);

    if (logsOfSelectedDate.length == 0) {
      return {
        statusCode: 200,
        message: 'No record found!.',
        data: {},
      };
    }

    let finalCsv = logsOfSelectedDate[0].csv;
    const unsortDutyHours =
      finalCsv['eldEventListForDriversRecordOfDutyStatus'];
    const dutyHours = unsortDutyHours.sort((a, b) =>
      a.eventTime.localeCompare(b.eventTime),
    );
    const availableIntermediateLogs = [];
    for (let j = 0; j < dutyHours.length; j++) {
      // if any intermediate status found
      if (
        dutyHours[j].eventType == '2' &&
        (dutyHours[j].eventCode == '1' || dutyHours[j].eventCode == '2')
      ) {
        availableIntermediateLogs.push(dutyHours[j]);
      } else if (
        (dutyHours[j].eventType == '1' && dutyHours[j].eventCode == '3') ||
        (dutyHours[j].eventType == '3' && dutyHours[j].eventCode == '1')
      ) {
        currentDrIndex = j;
        currentDrObj = dutyHours[j];
      }
      // if status found other than DR
      else if (
        dutyHours[j].eventType == '1' &&
        dutyHours[j].eventCode !== '3'
      ) {
        drAlertFlag = true;
        const timeChangeStatus = moment(dutyHours[j].eventTime, 'HHmmss');
        const timeDrivingStatus = moment(initialDutyHours.eventTime, 'HHmmss');
        const diff = timeDrivingStatus.diff(timeChangeStatus);
        const diffSeconds = Math.abs(moment.duration(diff).asSeconds());

        const hoursBase = await getHours(
          initialDutyHours.eventTime,
          dutyHours[j].eventTime,
        );
        const hours = Math.floor(hoursBase);
        // If time difference less than hour
        if (86400 - diffSeconds < 3600) {
          const speedMph = await this.addSpeedInDriving(
            initialDutyHours,
            dutyHours[j],
            hoursBase,
          );
          return {
            statusCode: 200,
            message:
              'Intermediate logs require an hour to create. Normalization is not required!', //if DR status found but time is less than hour
            data: {},
          };
        } else {
          const milesDiff =
            dutyHours[j].totalVehicleMilesDutyStatus -
            initialDutyHours.totalVehicleMilesDutyStatus;
          // If miles not covered, no intermediates would be created
          if (
            JSON.parse(dutyHours[j].totalVehicleMilesDutyStatus) <=
            JSON.parse(initialDutyHours.totalVehicleMilesDutyStatus)
          ) {
            return {
              statusCode: 200,
              message: `Invalid Duration of vehicle miles!`, //if DR status found but time is less than hour
              data: {},
            };
          }
          if (
            dutyHours[j].eventLatitude == initialDutyHours.eventLatitude &&
            dutyHours[j].eventLongitude == initialDutyHours.eventLongitude
          ) {
            return {
              statusCode: 200,
              message: `Invalid Duration of lat long!`, //if DR status found but time is less than hour
              data: {},
            };
          }
          if (milesDiff / hoursBase > 110 || milesDiff / hoursBase < 10) {
            return {
              statusCode: 200,
              message: `Invalid Duration of hours!`, //if DR status found but time is less than hour
              data: {},
            };
          }

          // If miles covered, intermediates would be created
          // const hours = Math.floor(diffSeconds / 3600);
          // const minutes = Math.floor((diffSeconds % 3600) / 60);
          // const seconds = diffSeconds % 60;
          // const engineHoursDiff =
          //   dutyHours[j].totalEngineHoursDutyStatus -
          //   initialDutyHours.totalEngineHoursDutyStatus;
          // if (
          //   dutyHours[j].totalEngineHoursDutyStatus <
          //     initialDutyHours.totalEngineHoursDutyStatus ||
          //   engineHoursDiff > hours + 2
          // ) {
          //   return {
          //     statusCode: 200,
          //     message: `Invalid Duration engine hours`, //if DR status found but time is less than hour
          //     data: {},
          //   };
          // }
          // Data holding / helping variables
          let updatedEventTime = moment(timeDrivingStatus, 'HHmmss');
          let engineHours = initialDutyHours.totalEngineHoursDutyStatus;
          let accumulatedEngineHours = initialDutyHours.accumulatedEngineHours;

          //eventHandler variable
          const logEventTime = moment(initialDutyHours.eventTime, 'HHmmss');
          const statusChangeEventTime = moment(
            currentDrObj.eventTime,
            'HHmmss',
          );
          let eventTimeHandler = await getHours(
            initialDutyHours.eventTime,
            currentDrObj.eventTime,
          );
          // let eventTimeHandler = Math.abs(moment.duration(diff).asSeconds());
          eventTimeHandler = Math.floor(eventTimeHandler);

          // variables
          let intermediateLogs;
          const createdIntermediateLogs = [];
          const spliceFlag = false;
          const violation = false;

          // Final and initial point lat long difference
          const initialLocation = {
            latitude: initialDutyHours.eventLatitude,
            longitude: initialDutyHours.eventLongitude,
          };
          const finalLocation = {
            latitude: dutyHours[j].eventLatitude,
            longitude: dutyHours[j].eventLongitude,
          };

          const intermediatePoints = await getIntermediateLocations(
            initialLocation,
            finalLocation,
            hoursBase,
          );

          if (intermediatePoints.length == 0) {
            return {
              statusCode: 200,
              message: `Invalid length on intermediate!`, //if DR status found but time is less than hour
              data: {},
            };
          }

          // Intermediate log is created after an hour; Created logs based on hour
          if (initialDutyHours.violation) delete initialDutyHours.violation;

          // Creating the intermediates

          for (let k = 0; k < hours; k++) {
            // Creating log
            let log;
            log = { ...initialDutyHours };

            // Global variables updations
            updatedEventTime = updatedEventTime.add(1, 'hours');
            engineHours = JSON.stringify(JSON.parse(engineHours) + 1);
            accumulatedEngineHours = JSON.stringify(
              JSON.parse(accumulatedEngineHours) + 1,
            );
            const latLongInfo =
              createdIntermediateLogs.length == 0
                ? await betweenLatLongInfo(
                    {
                      latitude: initialDutyHours.eventLatitude,
                      longitude: initialDutyHours.eventLongitude,
                    },
                    {
                      latitude: intermediatePoints[k].latitude,
                      longitude: intermediatePoints[k].longitude,
                    },
                  )
                : await betweenLatLongInfo(
                    {
                      latitude: createdIntermediateLogs[k - 1].eventLatitude,
                      longitude: createdIntermediateLogs[k - 1].eventLongitude,
                    },
                    {
                      latitude: intermediatePoints[k].latitude,
                      longitude: intermediatePoints[k].longitude,
                    },
                  );
            const distaneViaLatLon = latLongInfo.distance;
            const speedMph = latLongInfo.distance / 1;

            // Log information added
            log.eventSequenceIdNumber = generateUniqueHexId();
            // log.address = latLongInfo.destinationAddress;
            log.address = await getLocationDescription(
              intermediatePoints[k].latitude,
              intermediatePoints[k].longitude,
            );
            if (normalizationType == 0) {
              log.eventType = '2';
              log.eventCode = '1';
              log.intermediateType = '1'; // For DR > 1 | PC > 2 | YM > 3
            } else if (normalizationType == 1) {
              log.eventType = '2';
              log.eventCode = '2';
              log.intermediateType = '2'; // For DR > 1 | PC > 2 | YM > 3
            }
            if (eventTimeHandler > 0) {
              log.eventDate = initialDutyHours.eventDate;
              eventTimeHandler -= 1;
            } else {
              log.eventDate = dutyHours[j].eventDate;
            }
            log.eventLatitude = JSON.stringify(intermediatePoints[k].latitude);
            log.eventLongitude = JSON.stringify(
              intermediatePoints[k].longitude,
            );
            log.eventTime = updatedEventTime.format('HHmmss');
            log.totalEngineHoursDutyStatus = engineHours;
            log.totalVehicleMilesDutyStatus =
              createdIntermediateLogs.length == 0
                ? JSON.stringify(
                    Math.round(
                      JSON.parse(initialDutyHours.totalVehicleMilesDutyStatus) +
                        distaneViaLatLon,
                    ),
                  )
                : JSON.stringify(
                    Math.round(
                      JSON.parse(
                        createdIntermediateLogs[k - 1]
                          .totalVehicleMilesDutyStatus,
                      ) + distaneViaLatLon,
                    ),
                  );
            log.accumulatedVehicleMiles = JSON.stringify(
              Math.round(JSON.parse(distaneViaLatLon)),
            );
            log.accumulatedEngineHours = accumulatedEngineHours;

            // For first iteration add in duty status then to the intermediate log
            createdIntermediateLogs.length == 0
              ? (initialDutyHours['speed'] = this.customRound(speedMph))
              : (createdIntermediateLogs[k - 1].speed =
                  this.customRound(speedMph));
            // createdIntermediateLogs.length == 1
            //   ? (createdIntermediateLogs[k - 1].speed = speedMph.toFixed(2))
            //   : '0';
            // Handling speed violation
            if (createdIntermediateLogs.length == 0) {
              if (initialDutyHours['speed'] > 100) {
                initialDutyHours['speedViolation'] = true;
              } else {
                initialDutyHours['speedViolation'] = false;
              }
            } else {
              if (log['speed'] > 100) {
                log['speedViolation'] = true;
              } else {
                log['speedViolation'] = false;
              }
            }

            // Handling violations
            if (createdIntermediateLogs.length == 0) {
              if (
                JSON.parse(log.totalVehicleMilesDutyStatus) -
                  JSON.parse(initialDutyHours.totalVehicleMilesDutyStatus) >
                100
              ) {
                initialDutyHours['violation'] = true;
              }
            } else {
              if (
                JSON.parse(log.totalVehicleMilesDutyStatus) -
                  JSON.parse(
                    createdIntermediateLogs[createdIntermediateLogs.length - 1]
                      .totalVehicleMilesDutyStatus,
                  ) >
                100
              ) {
                createdIntermediateLogs[createdIntermediateLogs.length - 1][
                  'violation'
                ] = true;
              }
            }

            // Push in intermediate created logs array
            createdIntermediateLogs.push(log);
          }

          if (
            JSON.parse(initialDutyHours.totalVehicleMilesDutyStatus) >
            JSON.parse(dutyHours[j].totalVehicleMilesDutyStatus)
          ) {
            return {
              statusCode: 200,
              message:
                'Invalid data! Total miles covered on driving status are greater than the onves covered on status change.',
              data: {},
            };
          }

          const currentDayCreatedLogs = [];
          intermediateLogs = [...createdIntermediateLogs];
          // Separating current date logs
          for (let i = 0; i < intermediateLogs.length; i++) {
            const formatedDate = moment(
              intermediateLogs[i].eventDate,
              'MMDDYY',
            ).format('YYYY-MM-DD');
            if (formatedDate == nextDate) {
              currentDayCreatedLogs.push(intermediateLogs[i]);
              // intermediateLogs.pull(intermediateLogs[i]);
            }
          }

          dutyHours.splice(
            currentDrIndex + 1,
            availableIntermediateLogs.length > 0
              ? availableIntermediateLogs.length
              : 0,
            ...currentDayCreatedLogs,
          );

          // Handling violation valvulation between last duty status change and last intermediate
          const lastIntermediateLog =
            intermediateLogs[intermediateLogs.length - 1];
          if (
            JSON.parse(
              dutyHours[dutyHours.length - 1].totalVehicleMilesDutyStatus,
            ) -
              JSON.parse(lastIntermediateLog.totalVehicleMilesDutyStatus) >
            100
          ) {
            lastIntermediateLog['violation'] = true;
          }

          // calculating speed between last intermediate and change in duty status log
          const response = await betweenLatLongInfo(
            {
              latitude: lastIntermediateLog.eventLatitude,
              longitude: lastIntermediateLog.eventLongitude,
            },
            {
              latitude: finalLocation.latitude,
              longitude: finalLocation.longitude,
            },
          );
          const speedMph = response.distance / (hoursBase % 1) || 0; // mi/h
          lastIntermediateLog['speed'] = this.customRound(speedMph);
          speedMph > 100
            ? (lastIntermediateLog['speedViolation'] = true)
            : (lastIntermediateLog['speedViolation'] = false);

          global.globalIntermediatesArray = [initialDutyHours];
          global.globalIntermediatesArray.push(...intermediateLogs);

          finalCsv['eldEventListForDriversRecordOfDutyStatus'] = dutyHours;
          //Final value calculation of csv - authenticity maintained!
          finalCsv = this.checkDecimalValueOfCsvFile(finalCsv);
          logsOfSelectedDate[0].csv = finalCsv;
          await this.addToDB(logsOfSelectedDate[0], user);

          return {
            statusCode: 200,
            message: 'Normalizations executed successfully!',
            data: {},
            globalIntermediates: {
              object: globalIntermediates,
              array: global.globalIntermediatesArray,
            },
          };
        }
      }
    }

    if (!drAlertFlag) {
      globalIntermediates[nextDate] = {
        intermediatePlacingIndex: currentDrIndex + 1,
        removeAvailableintermediatesLength:
          availableIntermediateLogs.length > 0
            ? availableIntermediateLogs.length
            : 0,
        intermediateLogs: [],
      };
      nextDate = moment(nextDate).add(1, 'day');
      const response = await this.recursiveNormalize(
        // get_logs_between_range,
        driverId,
        moment(nextDate).format('YYYY-MM-DD'),
        initialDutyHours,
        global.globalIntermediatesArray,
        user,
        normalizationType,
      );
      if (response) {
        return response;
      }
    }
  };

  autoNormalizeDuty = async (
    logsOfSelectedDate,
    eventSequenceIdNumber,
    // get_logs_between_range,
    driverId,
    date,
    user,
    normalizationType,
  ) => {
    const finalCsv = logsOfSelectedDate[0].csv;
    const unsortDutyHours =
      finalCsv['eldEventListForDriversRecordOfDutyStatus'];
    const indexes = [];
    let drAlertFlag = false;
    const activeLogs = [];
    const inActiveLogs = [];
    let dutyHours = unsortDutyHours.sort((a, b) =>
      a.eventTime.localeCompare(b.eventTime),
    );
    for (let i = 0; i < dutyHours.length; i++) {
      if (eventSequenceIdNumber == dutyHours[i].eventSequenceIdNumber) {
        indexes.push(i);
      }
    }

    let pureDutyHours = dutyHours;
    dutyHours = [];

    // Separating inActive logs
    pureDutyHours.forEach((element, index) => {
      if (element.eventRecordStatus == '2') {
        inActiveLogs.push(element);
      }
    });

    // Separating active logs
    pureDutyHours.forEach((element, index) => {
      if (element.eventRecordStatus == '1') {
        dutyHours.push(element); // active logs
      }
    });

    for (let i = indexes[0]; i < dutyHours.length; i++) {
      const availableIntermediateLogs = [];

      // Get a duty status for DR
      if (
        (dutyHours[i].eventType == '1' && dutyHours[i].eventCode == '3') ||
        (dutyHours[i].eventType == '3' && dutyHours[i].eventCode == '1')
      ) {
        // check next duty statuses; loop is to ignore intermediate logs and focus on status change
        for (let j = i + 1; j < dutyHours.length; j++) {
          // if any intermediate status found
          if (
            dutyHours[j].eventType == '2' &&
            (dutyHours[j].eventCode == '1' || dutyHours[j].eventCode == '2')
          ) {
            availableIntermediateLogs.push(dutyHours[j]);
          }
          // if status found other than DR
          else if (
            dutyHours[j].eventType == '1' &&
            dutyHours[j].eventCode !== '3'
          ) {
            drAlertFlag = true;
            const timeChangeStatus = moment(dutyHours[j].eventTime, 'HHmmss');
            const timeDrivingStatus = moment(dutyHours[i].eventTime, 'HHmmss');
            const diff = timeDrivingStatus.diff(timeChangeStatus);
            const diffSeconds = Math.abs(moment.duration(diff).asSeconds());

            const hoursBase = await getHours(
              dutyHours[i].eventTime,
              dutyHours[j].eventTime,
            );
            const hours = Math.floor(hoursBase);
            // If time difference less than hour
            if (diffSeconds < 3600) {
              const speedMph = await this.addSpeedInDriving(
                dutyHours[i],
                dutyHours[j],
                hoursBase,
              );
              const unsortDutyHours =
                finalCsv['eldEventListForDriversRecordOfDutyStatus'];
              finalCsv['eldEventListForDriversRecordOfDutyStatus'] =
                unsortDutyHours.sort((a, b) =>
                  a.eventTime.localeCompare(b.eventTime),
                );
              finalCsv['eldEventListForDriversRecordOfDutyStatus'][i].speed =
                this.customRound(speedMph);
              // finalCsv = this.checkDecimalValueOfCsvFile(finalCsv);
              return {
                statusCode: 200,
                message: 'Speed Added. Normalization is not required!', //if DR status found but time is less than hour
                data: logsOfSelectedDate,
              };
            } else {
              const milesDiff =
                dutyHours[j].totalVehicleMilesDutyStatus -
                dutyHours[i].totalVehicleMilesDutyStatus;
              // If miles not covered, no intermediates would be created
              if (
                dutyHours[j].eventLatitude == dutyHours[i].eventLatitude &&
                dutyHours[j].eventLongitude == dutyHours[i].eventLongitude
              ) {
                return {
                  statusCode: 200,
                  message: `Invalid lat long!`, //if DR status found but time is less than hour
                  data: {},
                };
              }
              if (
                JSON.parse(dutyHours[j].totalVehicleMilesDutyStatus) <=
                JSON.parse(dutyHours[i].totalVehicleMilesDutyStatus)
              ) {
                return {
                  statusCode: 200,
                  message: `Invalid miles!`, //if DR status found but time is less than hour
                  data: {},
                };
              }
              if (milesDiff / hoursBase > 110 || milesDiff / hoursBase < 10) {
                return {
                  statusCode: 200,
                  message: `Invalid speed!`, //if DR status found but time is less than hour
                  data: {},
                };
              }

              // If miles covered, intermediates would be created
              // const hours = Math.floor(diffSeconds / 3600);
              // const minutes = Math.floor((diffSeconds % 3600) / 60);
              // const seconds = diffSeconds % 60;
              const engineHoursDiff =
                dutyHours[j].totalEngineHoursDutyStatus -
                dutyHours[i].totalEngineHoursDutyStatus;
              // if (
              //   dutyHours[j].totalEngineHoursDutyStatus <
              //     dutyHours[i].totalEngineHoursDutyStatus ||
              //   engineHoursDiff > hours + 1
              // ) {
              //   return {
              //     statusCode: 200,
              //     message: `Invalid Duration of  engine hours`, //if DR status found but time is less than hour
              //     data: {},
              //   };
              // }
              // Data holding / helping variables
              let updatedEventTime = moment(timeDrivingStatus, 'HHmmss');
              let engineHours = dutyHours[i].totalEngineHoursDutyStatus;
              let accumulatedEngineHours = dutyHours[i].accumulatedEngineHours;

              // variables
              let intermediateLogs;
              const createdIntermediateLogs = [];
              const spliceFlag = false;
              const violation = false;

              // Final and initial point lat long difference
              const initialLocation = {
                latitude: dutyHours[i].eventLatitude,
                longitude: dutyHours[i].eventLongitude,
              };
              const finalLocation = {
                latitude: dutyHours[j].eventLatitude,
                longitude: dutyHours[j].eventLongitude,
              };

              // Getting intermediate points/locations between starting and destination lat lng
              const intermediatePoints = await getIntermediateLocations(
                initialLocation,
                finalLocation,
                hoursBase,
              );

              if (
                intermediatePoints.length == 0 ||
                intermediatePoints.length < hours
              ) {
                return {
                  statusCode: 200,
                  message: `Invalid length of intermediate!`, //if DR status found but time is less than hour
                  data: {},
                };
              }

              // Intermediate log is created after an hour; Created logs based on hour
              if (dutyHours[i].violation) delete dutyHours[i].violation;

              // Creating the intermediates
              for (let k = 0; k < hours; k++) {
                // Creating log
                let log;
                log = { ...dutyHours[i] };

                // Global variables updations
                updatedEventTime = updatedEventTime.add(1, 'hours');
                engineHours = JSON.stringify(JSON.parse(engineHours) + 1);
                accumulatedEngineHours = JSON.stringify(
                  JSON.parse(accumulatedEngineHours) + 1,
                );

                const latLongInfo =
                  createdIntermediateLogs.length == 0
                    ? await betweenLatLongInfo(
                        {
                          latitude: dutyHours[i].eventLatitude,
                          longitude: dutyHours[i].eventLongitude,
                        },
                        {
                          latitude: intermediatePoints[k].latitude,
                          longitude: intermediatePoints[k].longitude,
                        },
                      )
                    : await betweenLatLongInfo(
                        {
                          latitude:
                            createdIntermediateLogs[k - 1].eventLatitude,
                          longitude:
                            createdIntermediateLogs[k - 1].eventLongitude,
                        },
                        {
                          latitude: intermediatePoints[k].latitude,
                          longitude: intermediatePoints[k].longitude,
                        },
                      );

                const distaneViaLatLon = latLongInfo.distance;
                const speedMph = latLongInfo.distance / 1;

                // Log information added
                log.eventSequenceIdNumber = await generateUniqueHexId();
                log.address = await getLocationDescription(
                  intermediatePoints[k].latitude,
                  intermediatePoints[k].longitude,
                );
                if (normalizationType == 0) {
                  log.eventType = '2';
                  log.eventCode = '1';
                  log.intermediateType = '1'; // For DR > 1 | PC > 2 | YM > 3
                } else if (normalizationType == 1) {
                  log.eventType = '2';
                  log.eventCode = '2';
                  log.intermediateType = '2'; // For DR > 1 | PC > 2 | YM > 3
                }
                log.eventLatitude = JSON.stringify(
                  intermediatePoints[k].latitude,
                );
                log.eventLongitude = JSON.stringify(
                  intermediatePoints[k].longitude,
                );
                log.eventTime = updatedEventTime.format('HHmmss');
                log.totalEngineHoursDutyStatus = engineHours;
                log.totalVehicleMilesDutyStatus =
                  createdIntermediateLogs.length == 0
                    ? JSON.stringify(
                        Math.round(
                          JSON.parse(dutyHours[i].totalVehicleMilesDutyStatus) +
                            distaneViaLatLon,
                        ),
                      )
                    : JSON.stringify(
                        Math.round(
                          JSON.parse(
                            createdIntermediateLogs[k - 1]
                              .totalVehicleMilesDutyStatus,
                          ) + distaneViaLatLon,
                        ),
                      );
                log.accumulatedVehicleMiles = JSON.stringify(
                  Math.round(JSON.parse(distaneViaLatLon)),
                );
                log.accumulatedEngineHours = accumulatedEngineHours;

                // For first iteration add in duty status then to the intermediate log
                createdIntermediateLogs.length == 0
                  ? (dutyHours[i]['speed'] = this.customRound(speedMph))
                  : (createdIntermediateLogs[k - 1].speed =
                      this.customRound(speedMph));
                // createdIntermediateLogs.length == 1
                //   ? (createdIntermediateLogs[k - 1].speed = speedMph.toFixed(2))
                //   : '0';
                // Handling speed violation
                if (createdIntermediateLogs.length == 0) {
                  if (dutyHours[i]['speed'] > 100) {
                    dutyHours[i]['speedViolation'] = true;
                  } else {
                    dutyHours[i]['speedViolation'] = false;
                  }
                } else {
                  if (log['speed'] > 100) {
                    log['speedViolation'] = true;
                  } else {
                    log['speedViolation'] = false;
                  }
                }

                // Handling violations
                // For duty status log
                if (createdIntermediateLogs.length == 0) {
                  if (
                    JSON.parse(log.totalVehicleMilesDutyStatus) -
                      JSON.parse(dutyHours[i].totalVehicleMilesDutyStatus) >
                    100
                  ) {
                    dutyHours[i]['violation'] = true;
                  }
                } else {
                  // between intermediate logs
                  if (
                    JSON.parse(log.totalVehicleMilesDutyStatus) -
                      JSON.parse(
                        createdIntermediateLogs[
                          createdIntermediateLogs.length - 1
                        ].totalVehicleMilesDutyStatus,
                      ) >
                    100
                  ) {
                    createdIntermediateLogs[createdIntermediateLogs.length - 1][
                      'violation'
                    ] = true;
                  }
                }

                // Push in intermediate created logs array
                createdIntermediateLogs.push(log);
              }

              if (
                JSON.parse(dutyHours[i].totalVehicleMilesDutyStatus) >
                JSON.parse(dutyHours[j].totalVehicleMilesDutyStatus)
              ) {
                return {
                  statusCode: 200,
                  message:
                    'Invalid data! Total miles covered on driving status are greater than the onves covered on status change.',
                  data: {},
                };
              }

              intermediateLogs = [...createdIntermediateLogs];
              dutyHours.splice(
                i + 1,
                availableIntermediateLogs.length > 0
                  ? availableIntermediateLogs.length
                  : 0,
                ...intermediateLogs,
              );

              // Handling violation valvulation between last duty status change and last intermediate
              const lastIntermediateLog =
                intermediateLogs[intermediateLogs.length - 1];
              if (
                JSON.parse(
                  dutyHours[dutyHours.length - 1].totalVehicleMilesDutyStatus,
                ) -
                  JSON.parse(lastIntermediateLog.totalVehicleMilesDutyStatus) >
                100
              ) {
                lastIntermediateLog['violation'] = true;
              }

              // calculating speed between last intermediate and change in duty status log
              const response = await betweenLatLongInfo(
                {
                  latitude: lastIntermediateLog.eventLatitude,
                  longitude: lastIntermediateLog.eventLongitude,
                },
                {
                  latitude: finalLocation.latitude,
                  longitude: finalLocation.longitude,
                },
              );
              const speedMph = response.distance / (hoursBase % 1) || 0; // mi/h
              lastIntermediateLog['speed'] = this.customRound(speedMph);
              speedMph > 100
                ? (lastIntermediateLog['speedViolation'] = true)
                : (lastIntermediateLog['speedViolation'] = false);

              pureDutyHours = [...dutyHours, ...inActiveLogs];

              // Sort the altered array
              pureDutyHours.sort((a, b) => {
                const timeA = parseInt(a.eventTime, 10);
                const timeB = parseInt(b.eventTime, 10);
                return timeA - timeB;
              });

              finalCsv['eldEventListForDriversRecordOfDutyStatus'] =
                pureDutyHours;

              //Final value calculation of csv - authenticity maintained!
              // finalCsv = this.checkDecimalValueOfCsvFile(finalCsv);

              return {
                statusCode: 200,
                message: 'Normalizations executed successfully!',
                data: logsOfSelectedDate,
              };
            }
          }
        }

        if (!drAlertFlag) {
          const currentDrIndex = i;
          globalIntermediates[date] = {
            intermediatePlacingIndex: currentDrIndex + 1,
            removeAvailableintermediatesLength:
              availableIntermediateLogs.length > 0
                ? availableIntermediateLogs.length
                : 0,
            intermediateLogs: [],
          };
          const nextDate = moment(date).add(1, 'day');
          const response = await this.recursiveNormalize(
            // this.get_logs_between_range,
            driverId,
            moment(nextDate).format('YYYY-MM-DD'),
            dutyHours[i],
            global.globalIntermediatesArray,
            user,
            normalizationType,
          );
          if (response) {
            return response;
          }
        }
      }
    }

    return {
      statusCode: 200,
      message: 'eventSequenceIdNumber does not exist!', // if no DR status found
      data: {},
    };
  };
  ////////////
  addSpeedInDriving = async (start, end, time) => {
    const latLongInfo = await betweenLatLongInfo(
      {
        latitude: start.eventLatitude,
        longitude: start.eventLongitude,
      },
      {
        latitude: end.eventLatitude,
        longitude: end.eventLongitude,
      },
    );
    const speedMph = latLongInfo.distance / time;

    return speedMph;
  };
  recursiveNormalizeManual = async (
    // get_logs_between_range,
    driverId,
    nextDate,
    initialDutyHours,
    globalIntermediatesArray,
    user,
    speed,
    normalizationType,
  ) => {
    let currentDrIndex;
    let currentDrObj;
    let drAlertFlag = false;
    const logsOfSelectedDate = await this.get_logs_between_range({
      driverId: driverId,
      startDate: nextDate,
      endDate: nextDate,
    });
    console.log(`nextDate check ------ `, nextDate);

    if (logsOfSelectedDate.length == 0) {
      return {
        statusCode: 200,
        message: 'No record found!.',
        data: {},
      };
    }

    let finalCsv = logsOfSelectedDate[0].csv;
    const unsortDutyHours =
      finalCsv['eldEventListForDriversRecordOfDutyStatus'];
    const dutyHours = unsortDutyHours.sort((a, b) =>
      a.eventTime.localeCompare(b.eventTime),
    );
    const availableIntermediateLogs = [];
    for (let j = 0; j < dutyHours.length; j++) {
      // if any intermediate status found
      if (
        dutyHours[j].eventType == '2' &&
        (dutyHours[j].eventCode == '1' || dutyHours[j].eventCode == '2')
      ) {
        availableIntermediateLogs.push(dutyHours[j]);
      } else if (
        dutyHours[j].eventType == '1' &&
        dutyHours[j].eventCode == '3'
      ) {
        currentDrIndex = j;
        currentDrObj = dutyHours[j];
      }
      // if status found other than DR
      else if (
        dutyHours[j].eventType == '1' &&
        dutyHours[j].eventCode !== '3'
      ) {
        drAlertFlag = true;
        const timeChangeStatus = moment(dutyHours[j].eventTime, 'HHmmss');
        const timeDrivingStatus = moment(initialDutyHours.eventTime, 'HHmmss');
        const diff = timeDrivingStatus.diff(timeChangeStatus);
        const diffSeconds = Math.abs(moment.duration(diff).asSeconds());
        const nextDutyStatus = dutyHours[j];

        const hoursBase = await getHours(
          initialDutyHours.eventTime,
          dutyHours[j].eventTime,
        );
        const hours = Math.floor(hoursBase);
        // If time difference less than hour
        if (diffSeconds < 3600) {
          return {
            statusCode: 200,
            message:
              'Intermediate logs require an hour to create. Normalization is not required!', //if DR status found but time is less than hour
            data: {},
          };
        } else {
          // If miles not covered, no intermediates would be created
          const milesDiff =
            dutyHours[j].totalVehicleMilesDutyStatus -
            initialDutyHours.totalVehicleMilesDutyStatus;

          if (
            dutyHours[j].eventLatitude == initialDutyHours.eventLatitude &&
            dutyHours[j].eventLongitude == initialDutyHours.eventLongitude
          ) {
            return {
              statusCode: 200,
              message: `Invalid lat long!`, //if DR status found but time is less than hour
              data: {},
            };
          }
          if (
            JSON.parse(dutyHours[j].totalVehicleMilesDutyStatus) <=
            JSON.parse(initialDutyHours.totalVehicleMilesDutyStatus)
          ) {
            return {
              statusCode: 200,
              message: `Invalid miles!`, //if DR status found but time is less than hour
              data: {},
            };
          }
          if (milesDiff / hoursBase > 110 || milesDiff / hoursBase < 10) {
            return {
              statusCode: 200,
              message: `Invalid speed!`, //if DR status found but time is less than hour
              data: {},
            };
          }

          // If miles covered, intermediates would be created
          // const hours = Math.floor(diffSeconds / 3600);
          // const minutes = Math.floor((diffSeconds % 3600) / 60);
          // const seconds = diffSeconds % 60;
          const engineHoursDiff =
            dutyHours[j].totalEngineHoursDutyStatus -
            initialDutyHours.totalEngineHoursDutyStatus;
          // if (
          //   dutyHours[j].totalEngineHoursDutyStatus <
          //     initialDutyHours.totalEngineHoursDutyStatus ||
          //   engineHoursDiff > hours + 2
          // ) {
          //   return {
          //     statusCode: 200,
          //     message: `Invalid Duration of  engine hours`, //if DR status found but time is less than hour
          //     data: {},
          //   };
          // }
          // Data holding / helping variables
          let updatedEventTime = moment(timeDrivingStatus, 'HHmmss');
          let engineHours = initialDutyHours.totalEngineHoursDutyStatus;
          let accumulatedEngineHours = initialDutyHours.accumulatedEngineHours;

          //eventHandler variable
          const logEventTime = moment(initialDutyHours.eventTime, 'HHmmss');
          const statusChangeEventTime = moment(
            currentDrObj.eventTime,
            'HHmmss',
          );
          let eventTimeHandler = await getHours(
            initialDutyHours.eventTime,
            currentDrObj.eventTime,
          );
          eventTimeHandler = Math.floor(eventTimeHandler);
          // variables
          let intermediateLogs;
          const createdIntermediateLogs = [];
          const spliceFlag = false;
          const violation = false;

          // Final and initial point lat long difference
          const initialLocation = {
            latitude: initialDutyHours.eventLatitude,
            longitude: initialDutyHours.eventLongitude,
          };
          const finalLocation = {
            latitude: dutyHours[j].eventLatitude,
            longitude: dutyHours[j].eventLongitude,
          };

          const intermediatePoints = await getIntermediateLocationsWithSpeed(
            initialLocation,
            finalLocation,
            hoursBase,
            speed,
          );
          if (intermediatePoints.length == 0) {
            return {
              statusCode: 200,
              message: `Unjust speed!`, //if DR status found but time is less than hour
              data: {},
            };
          }

          const loopLimit =
            intermediatePoints.length > hours
              ? hours
              : intermediatePoints.length;

          // Intermediate log is created after an hour; Created logs based on hour
          if (initialDutyHours.violation) delete initialDutyHours.violation;

          for (let k = 0; k < loopLimit; k++) {
            // Creating log
            let log;
            log = { ...initialDutyHours };

            // Global variables updations
            updatedEventTime = updatedEventTime.add(1, 'hours');
            engineHours = JSON.stringify(JSON.parse(engineHours) + 1);
            accumulatedEngineHours = JSON.stringify(
              JSON.parse(accumulatedEngineHours) + 1,
            );
            const latLongInfo =
              createdIntermediateLogs.length == 0
                ? await betweenLatLongInfo(
                    {
                      latitude: initialDutyHours.eventLatitude,
                      longitude: initialDutyHours.eventLongitude,
                    },
                    {
                      latitude: intermediatePoints[k].latitude,
                      longitude: intermediatePoints[k].longitude,
                    },
                  )
                : await betweenLatLongInfo(
                    {
                      latitude: createdIntermediateLogs[k - 1].eventLatitude,
                      longitude: createdIntermediateLogs[k - 1].eventLongitude,
                    },
                    {
                      latitude: intermediatePoints[k].latitude,
                      longitude: intermediatePoints[k].longitude,
                    },
                  );
            const distaneViaLatLon = latLongInfo.distance;

            // Log information added
            log.eventSequenceIdNumber = generateUniqueHexId();
            // log.address = latLongInfo.destinationAddress;
            log.address = await getLocationDescription(
              intermediatePoints[k].latitude,
              intermediatePoints[k].longitude,
            );
            if (normalizationType == 0) {
              log.eventType = '2';
              log.eventCode = '1';
              log.intermediateType = '1'; // For DR > 1 | PC > 2 | YM > 3
            } else if (normalizationType == 1) {
              log.eventType = '2';
              log.eventCode = '2';
              log.intermediateType = '2'; // For DR > 1 | PC > 2 | YM > 3
            }
            if (eventTimeHandler > 0) {
              log.eventDate = initialDutyHours.eventDate;
              eventTimeHandler -= 1;
            } else {
              log.eventDate = dutyHours[j].eventDate;
            }
            log.eventLatitude = JSON.stringify(intermediatePoints[k].latitude);
            log.eventLongitude = JSON.stringify(
              intermediatePoints[k].longitude,
            );
            log.eventTime = updatedEventTime.format('HHmmss');
            log.totalEngineHoursDutyStatus = engineHours;
            log.totalVehicleMilesDutyStatus =
              createdIntermediateLogs.length == 0
                ? JSON.stringify(
                    Math.round(
                      JSON.parse(initialDutyHours.totalVehicleMilesDutyStatus) +
                        distaneViaLatLon,
                    ),
                  )
                : JSON.stringify(
                    Math.round(
                      JSON.parse(
                        createdIntermediateLogs[k - 1]
                          .totalVehicleMilesDutyStatus,
                      ) + distaneViaLatLon,
                    ),
                  );
            log.accumulatedVehicleMiles = JSON.stringify(
              Math.round(JSON.parse(distaneViaLatLon)),
            );
            log.accumulatedEngineHours = accumulatedEngineHours;

            // Speed for the log
            let timeForSpeed =
              createdIntermediateLogs.length == 0
                ? await timeDifference(
                    log.eventTime,
                    initialDutyHours.eventTime,
                  )
                : await timeDifference(
                    log.eventTime,
                    createdIntermediateLogs[k - 1].eventTime,
                  );
            timeForSpeed == -23 ? (timeForSpeed = 1) : timeForSpeed;
            const speedMph =
              createdIntermediateLogs.length == 0
                ? speed
                : latLongInfo.distance / timeForSpeed;

            // For first iteration add in duty status then to the intermediate log
            createdIntermediateLogs.length == 0
              ? (initialDutyHours['speed'] = this.customRound(speedMph))
              : (log.speed = this.customRound(speedMph));
            createdIntermediateLogs.length == 1
              ? (createdIntermediateLogs[k - 1].speed =
                  this.customRound(speedMph))
              : '0';
            // Handling speed violations
            if (createdIntermediateLogs.length == 0) {
              if (initialDutyHours['speed'] > 100) {
                initialDutyHours['speedViolation'] = true;
              } else {
                initialDutyHours['speedViolation'] = false;
              }
            } else {
              if (log['speed'] > 100) {
                log['speedViolation'] = true;
              } else {
                log['speedViolation'] = false;
              }
            }

            // Handling violations
            if (createdIntermediateLogs.length == 0) {
              if (
                JSON.parse(log.totalVehicleMilesDutyStatus) -
                  JSON.parse(initialDutyHours.totalVehicleMilesDutyStatus) >
                100
              ) {
                initialDutyHours['violation'] = true;
                currentDrObj['violation'] = true;
              }
            } else {
              if (
                JSON.parse(log.totalVehicleMilesDutyStatus) -
                  JSON.parse(
                    createdIntermediateLogs[createdIntermediateLogs.length - 1]
                      .totalVehicleMilesDutyStatus,
                  ) >
                100
              ) {
                createdIntermediateLogs[createdIntermediateLogs.length - 1][
                  'violation'
                ] = true;
              }
            }

            // Push in intermediate created logs array
            createdIntermediateLogs.push(log);
          }

          if (
            JSON.parse(initialDutyHours.totalVehicleMilesDutyStatus) >
            JSON.parse(dutyHours[j].totalVehicleMilesDutyStatus)
          ) {
            return {
              statusCode: 200,
              message:
                'Invalid data! Total miles covered on driving status are greater than the onves covered on status change.',
              data: {},
            };
          }

          const currentDayCreatedLogs = [];
          intermediateLogs = [...createdIntermediateLogs];
          // Separating current date logs
          for (let i = 0; i < intermediateLogs.length; i++) {
            const formatedDate = moment(
              intermediateLogs[i].eventDate,
              'MMDDYY',
            ).format('YYYY-MM-DD');
            if (formatedDate == nextDate) {
              currentDayCreatedLogs.push(intermediateLogs[i]);
              // intermediateLogs.pull(intermediateLogs[i]);
            }
          }

          dutyHours.splice(
            currentDrIndex + 1,
            availableIntermediateLogs.length > 0
              ? availableIntermediateLogs.length
              : 0,
            ...currentDayCreatedLogs,
          );

          // Handling violation valvulation between last duty status change and last intermediate
          const lastIntermediateLog =
            intermediateLogs[intermediateLogs.length - 1];
          if (
            JSON.parse(nextDutyStatus.totalVehicleMilesDutyStatus) -
              JSON.parse(lastIntermediateLog.totalVehicleMilesDutyStatus) >
            100
          ) {
            lastIntermediateLog['violation'] = true;
          }
          // calculating speed between last intermediate and change in duty status log
          const response = await betweenLatLongInfo(
            {
              latitude: lastIntermediateLog.eventLatitude,
              longitude: lastIntermediateLog.eventLongitude,
            },
            {
              latitude: nextDutyStatus.eventLatitude,
              longitude: nextDutyStatus.eventLongitude,
            },
          );

          // Speed for the log
          const timeForSpeed = await timeDifference(
            nextDutyStatus.eventTime,
            lastIntermediateLog.eventTime,
          );
          const speedMph = response.distance / timeForSpeed;
          lastIntermediateLog['speed'] = this.customRound(speedMph);
          speedMph > 100
            ? (lastIntermediateLog['speedViolation'] = true)
            : (lastIntermediateLog['speedViolation'] = false);

          global.globalIntermediatesArray = [initialDutyHours];
          global.globalIntermediatesArray.push(...intermediateLogs);

          finalCsv['eldEventListForDriversRecordOfDutyStatus'] = dutyHours;
          //Final value calculation of csv - authenticity maintained!
          finalCsv = this.checkDecimalValueOfCsvFile(finalCsv);
          logsOfSelectedDate[0].csv = finalCsv;
          await this.addToDB(logsOfSelectedDate[0], user);

          return {
            statusCode: 200,
            message: 'Normalizations executed successfully!',
            data: {},
            globalIntermediates: {
              object: globalIntermediates,
              array: global.globalIntermediatesArray,
            },
          };
        }
      }
    }

    if (!drAlertFlag) {
      globalIntermediates[nextDate] = {
        intermediatePlacingIndex: currentDrIndex + 1,
        removeAvailableintermediatesLength:
          availableIntermediateLogs.length > 0
            ? availableIntermediateLogs.length
            : 0,
        intermediateLogs: [],
      };
      nextDate = moment(nextDate).add(1, 'day');
      const response = await this.recursiveNormalizeManual(
        // get_logs_between_range,
        driverId,
        moment(nextDate).format('YYYY-MM-DD'),
        initialDutyHours,
        global.globalIntermediatesArray,
        user,
        speed,
        normalizationType,
      );
      if (response) {
        return response;
      }
    }
  };

  manuallyNormalizeDuty = async (
    logsOfSelectedDate,
    eventSequenceIdNumber,
    // get_logs_between_range,
    driverId,
    date,
    user,
    speed, // in Mph
    normalizationType,
  ) => {
    let finalCsv = logsOfSelectedDate[0].csv;
    const logsData = finalCsv['eldEventListForDriversRecordOfDutyStatus'];
    const indexes = [];
    let drAlertFlag = false;
    const inActiveLogs = [];
    let dutyHours = this.sortingDateTime(logsData);
    for (let i = 0; i < dutyHours.length; i++) {
      if (eventSequenceIdNumber == dutyHours[i].eventSequenceIdNumber) {
        indexes.push(i);
      }
    }

    let pureDutyHours = dutyHours;
    dutyHours = [];

    // Separating inActive logs
    pureDutyHours.forEach((element, index) => {
      if (element.eventRecordStatus == '2') {
        inActiveLogs.push(element);
      }
    });

    // Separating active logs
    pureDutyHours.forEach((element, index) => {
      if (element.eventRecordStatus == '1') {
        dutyHours.push(element); // active logs
      }
    });

    for (let i = indexes[0]; i < dutyHours.length; i++) {
      const availableIntermediateLogs = [];

      // Get a duty status for DR
      if (
        (dutyHours[i].eventType == '1' && dutyHours[i].eventCode == '3') ||
        (dutyHours[i].eventType == '3' && dutyHours[i].eventCode == '1')
      ) {
        // check next duty statuses; loop is to ignore intermediate logs and focus on status change
        for (let j = i + 1; j < dutyHours.length; j++) {
          // if any intermediate status found
          if (
            dutyHours[j].eventType == '2' &&
            (dutyHours[j].eventCode == '1' || dutyHours[j].eventCode == '2')
          ) {
            availableIntermediateLogs.push(dutyHours[j]);
          }

          // if status found other than DR
          else if (
            dutyHours[j].eventType == '1' &&
            dutyHours[j].eventCode !== '3'
          ) {
            drAlertFlag = true;
            const timeChangeStatus = moment(dutyHours[j].eventTime, 'HHmmss');
            const timeDrivingStatus = moment(dutyHours[i].eventTime, 'HHmmss');
            const diff = timeDrivingStatus.diff(timeChangeStatus);
            const diffSeconds = Math.abs(moment.duration(diff).asSeconds());
            const hoursBase = await getHours(
              dutyHours[i].eventTime,
              dutyHours[j].eventTime,
            );
            const nextDutyStatus = dutyHours[j];
            const hours = Math.floor(hoursBase);
            // If time difference less than hour
            if (diffSeconds < 3600) {
              return {
                statusCode: 200,
                message: 'Speed Added. Normalization is not required!', //if DR status found but time is less than hour
                data: {},
              };
            } else {
              const milesDiff =
                dutyHours[j].totalVehicleMilesDutyStatus -
                dutyHours[i].totalVehicleMilesDutyStatus;
              // If miles not covered, no intermediates would be created

              if (
                JSON.parse(dutyHours[j].totalVehicleMilesDutyStatus) <=
                JSON.parse(dutyHours[i].totalVehicleMilesDutyStatus)
              ) {
                return {
                  statusCode: 200,
                  message: `Invalid Duration of vehicle miles!`, //if DR status found but time is less than hour
                  data: {},
                };
              }
              if (
                dutyHours[j].eventLatitude == dutyHours[i].eventLatitude &&
                dutyHours[j].eventLongitude == dutyHours[i].eventLongitude
              ) {
                return {
                  statusCode: 200,
                  message: `Invalid Duration of lat long!`, //if DR status found but time is less than hour
                  data: {},
                };
              }
              if (milesDiff / hoursBase > 110 || milesDiff / hoursBase < 10) {
                return {
                  statusCode: 200,
                  message: `Invalid Duration of hours!`, //if DR status found but time is less than hour
                  data: {},
                };
              }

              // If miles covered, intermediates would be created
              // const hours = Math.floor(diffSeconds / 3600);
              // const minutes = Math.floor((diffSeconds % 3600) / 60);
              // const seconds = diffSeconds % 60;

              const engineHoursDiff =
                dutyHours[j].totalEngineHoursDutyStatus -
                dutyHours[i].totalEngineHoursDutyStatus;
              // if (
              //   dutyHours[j].totalEngineHoursDutyStatus <
              //     dutyHours[i].totalEngineHoursDutyStatus ||
              //   engineHoursDiff > hours + 1
              // ) {
              //   return {
              //     statusCode: 200,
              //     message: `Invalid Duration of  engine hours`, //if DR status found but time is less than hour
              //     data: {},
              //   };
              // }
              // Data holding / helping variables
              let updatedEventTime = moment(timeDrivingStatus, 'HHmmss');
              let engineHours = dutyHours[i].totalEngineHoursDutyStatus;
              let accumulatedEngineHours = dutyHours[i].accumulatedEngineHours;

              // variables
              let intermediateLogs;
              const createdIntermediateLogs = [];
              const spliceFlag = false;
              const violation = false;

              // Final and initial point lat long difference
              const initialLocation = {
                latitude: dutyHours[i].eventLatitude,
                longitude: dutyHours[i].eventLongitude,
              };
              const finalLocation = {
                latitude: dutyHours[j].eventLatitude,
                longitude: dutyHours[j].eventLongitude,
              };

              const intermediatePoints =
                await getIntermediateLocationsWithSpeed(
                  initialLocation,
                  finalLocation,
                  hoursBase,
                  speed,
                );
              if (intermediatePoints.length == 0) {
                return {
                  statusCode: 200,
                  message: `Invalid speed!`,
                  data: {},
                };
              }

              const loopLimit =
                intermediatePoints.length > hours
                  ? hours
                  : intermediatePoints.length;

              // Intermediate log is created after an hour; Created logs based on hour
              if (dutyHours[i].violation) delete dutyHours[i].violation;

              // Creating the intermediates
              for (let k = 0; k < loopLimit; k++) {
                // Creating log
                let log;
                log = { ...dutyHours[i] };

                // Global variables updations
                updatedEventTime = updatedEventTime.add(1, 'hours');
                engineHours = JSON.stringify(JSON.parse(engineHours) + 1);
                accumulatedEngineHours = JSON.stringify(
                  JSON.parse(accumulatedEngineHours) + 1,
                );
                const latLongInfo =
                  createdIntermediateLogs.length == 0
                    ? await betweenLatLongInfo(
                        {
                          latitude: dutyHours[i].eventLatitude,
                          longitude: dutyHours[i].eventLongitude,
                        },
                        {
                          latitude: intermediatePoints[k].latitude,
                          longitude: intermediatePoints[k].longitude,
                        },
                      )
                    : await betweenLatLongInfo(
                        {
                          latitude:
                            createdIntermediateLogs[k - 1].eventLatitude,
                          longitude:
                            createdIntermediateLogs[k - 1].eventLongitude,
                        },
                        {
                          latitude: intermediatePoints[k].latitude,
                          longitude: intermediatePoints[k].longitude,
                        },
                      );
                const distaneViaLatLon = latLongInfo.distance;

                // Log information added
                log.eventSequenceIdNumber = generateUniqueHexId();
                // log.address = latLongInfo.destinationAddress;
                log.address = await getLocationDescription(
                  intermediatePoints[k].latitude,
                  intermediatePoints[k].longitude,
                );
                if (normalizationType == 0) {
                  log.eventType = '2';
                  log.eventCode = '1';
                  log.intermediateType = '1'; // For DR > 1 | PC > 2 | YM > 3
                } else if (normalizationType == 1) {
                  log.eventType = '2';
                  log.eventCode = '2';
                  log.intermediateType = '2'; // For DR > 1 | PC > 2 | YM > 3
                }
                log.eventLatitude = JSON.stringify(
                  intermediatePoints[k].latitude,
                );
                log.eventLongitude = JSON.stringify(
                  intermediatePoints[k].longitude,
                );
                log.eventTime = updatedEventTime.format('HHmmss');
                log.totalEngineHoursDutyStatus = engineHours;

                log.totalVehicleMilesDutyStatus =
                  createdIntermediateLogs.length == 0
                    ? JSON.stringify(
                        Math.round(
                          JSON.parse(dutyHours[i].totalVehicleMilesDutyStatus) +
                            distaneViaLatLon,
                        ),
                      )
                    : JSON.stringify(
                        Math.round(
                          JSON.parse(
                            createdIntermediateLogs[k - 1]
                              .totalVehicleMilesDutyStatus,
                          ) + distaneViaLatLon,
                        ),
                      );
                log.accumulatedVehicleMiles = JSON.stringify(
                  Math.round(JSON.parse(distaneViaLatLon)),
                );
                log.accumulatedEngineHours = accumulatedEngineHours;

                // Speed for the log
                const timeForSpeed =
                  createdIntermediateLogs.length == 0
                    ? await timeDifference(
                        log.eventTime,
                        dutyHours[i].eventTime,
                      )
                    : await timeDifference(
                        log.eventTime,
                        createdIntermediateLogs[k - 1].eventTime,
                      );
                const speedMph =
                  createdIntermediateLogs.length == 0
                    ? speed
                    : latLongInfo.distance / timeForSpeed;

                // For first iteration add in duty status then to the intermediate log
                createdIntermediateLogs.length == 0
                  ? (dutyHours[i]['speed'] = this.customRound(speedMph))
                  : (log.speed = this.customRound(speedMph));
                createdIntermediateLogs.length == 1
                  ? (createdIntermediateLogs[k - 1].speed =
                      this.customRound(speedMph))
                  : '0';
                // Handling speed violations
                if (createdIntermediateLogs.length == 0) {
                  if (dutyHours[i]['speed'] > 100) {
                    dutyHours[i]['speedViolation'] = true;
                  } else {
                    dutyHours[i]['speedViolation'] = false;
                  }
                } else {
                  if (log['speed'] > 100) {
                    log['speedViolation'] = true;
                  } else {
                    log['speedViolation'] = false;
                  }
                }

                // // Handling violations
                if (createdIntermediateLogs.length == 0) {
                  if (
                    JSON.parse(log.totalVehicleMilesDutyStatus) -
                      JSON.parse(dutyHours[i].totalVehicleMilesDutyStatus) >
                    100
                  ) {
                    dutyHours[i]['violation'] = true;
                  }
                } else {
                  if (
                    JSON.parse(log.totalVehicleMilesDutyStatus) -
                      JSON.parse(
                        createdIntermediateLogs[
                          createdIntermediateLogs.length - 1
                        ].totalVehicleMilesDutyStatus,
                      ) >
                    100
                  ) {
                    createdIntermediateLogs[createdIntermediateLogs.length - 1][
                      'violation'
                    ] = true;
                  }
                }

                // Push in intermediate created logs array
                createdIntermediateLogs.push(log);
              }

              if (
                JSON.parse(dutyHours[i].totalVehicleMilesDutyStatus) >
                JSON.parse(dutyHours[j].totalVehicleMilesDutyStatus)
              ) {
                return {
                  statusCode: 200,
                  message:
                    'Invalid data! Total miles covered on driving status are greater than the onves covered on status change.',
                  data: {},
                };
              }

              intermediateLogs = [...createdIntermediateLogs];
              dutyHours.splice(
                i + 1,
                availableIntermediateLogs.length > 0
                  ? availableIntermediateLogs.length
                  : 0,
                ...intermediateLogs,
              );

              // Handling violation valvulation between last duty status change and last intermediate
              const lastIntermediateLog =
                intermediateLogs[intermediateLogs.length - 1];
              if (
                JSON.parse(nextDutyStatus.totalVehicleMilesDutyStatus) -
                  JSON.parse(lastIntermediateLog.totalVehicleMilesDutyStatus) >
                100
              ) {
                lastIntermediateLog['violation'] = true;
              }

              // calculating speed between last intermediate and change in duty status log
              const response = await betweenLatLongInfo(
                {
                  latitude: lastIntermediateLog.eventLatitude,
                  longitude: lastIntermediateLog.eventLongitude,
                },
                {
                  latitude: nextDutyStatus.eventLatitude,
                  longitude: nextDutyStatus.eventLongitude,
                },
              );

              // Speed for the log
              const timeForSpeed = await timeDifference(
                nextDutyStatus.eventTime,
                lastIntermediateLog.eventTime,
              );
              const speedMph = response.distance / timeForSpeed;
              lastIntermediateLog['speed'] = this.customRound(speedMph);
              speedMph > 100
                ? (lastIntermediateLog['speedViolation'] = true)
                : (lastIntermediateLog['speedViolation'] = false);

              pureDutyHours = [...dutyHours, ...inActiveLogs];

              // Sort the altered array
              pureDutyHours.sort((a, b) => {
                const timeA = parseInt(a.eventTime, 10);
                const timeB = parseInt(b.eventTime, 10);
                return timeA - timeB;
              });

              finalCsv['eldEventListForDriversRecordOfDutyStatus'] =
                pureDutyHours;

              //Final value calculation of csv - authenticity maintained!
              finalCsv = this.checkDecimalValueOfCsvFile(finalCsv);

              return {
                statusCode: 200,
                message: 'Normalizations executed successfully!',
                data: logsOfSelectedDate,
              };
            }
          }
        }

        if (!drAlertFlag) {
          const currentDrIndex = i;
          globalIntermediates[date] = {
            intermediatePlacingIndex: currentDrIndex + 1,
            removeAvailableintermediatesLength:
              availableIntermediateLogs.length > 0
                ? availableIntermediateLogs.length
                : 0,
            intermediateLogs: [],
          };
          const nextDate = moment(date).add(1, 'day');
          const response = await this.recursiveNormalizeManual(
            // this.get_logs_between_range,
            driverId,
            moment(nextDate).format('YYYY-MM-DD'),
            dutyHours[i],
            global.globalIntermediatesArray,
            user,
            speed,
            normalizationType,
          );
          if (response) {
            return response;
          }
        }
      }
    }

    return {
      statusCode: 200,
      message: 'eventSequenceIdNumber does not exist!', // if no DR status found
      data: {},
    };
  };
  customRound = (number) => {
    const integerPart = Math.floor(number);
    const decimalPart = number - integerPart;

    if (decimalPart >= 0.5) {
      return Math.ceil(number).toString();
    } else {
      return Math.floor(number).toString();
    }
  };
  /**
   * @description : The function creates red dotes on FE side to indicate the need of normalization
   */
  calculateMissingIntermediates = async (dutyStatuses) => {
    // copying array
    const dutyStatusArray = JSON.parse(JSON.stringify(dutyStatuses)); // Deep copy

    // separatting variables
    let initialLog;
    let finalLog;
    let initialLogIndex = 0;
    let finalLogIndex = 0;

    // Managing initial log
    // for (let i = 0; i < dutyStatusArray.length; i += finalLogIndex + 1) {
    let i = 0;
    if (dutyStatusArray.length > 1) {
      while (i < dutyStatusArray.length) {
        if (
          // inititalLogType.includes(dutyStatusArray[i].eventType) &&
          // initialLogCode.includes(dutyStatusArray[i].eventCode)
          (dutyStatusArray[i].eventType == '1' &&
            dutyStatusArray[i].eventCode == '3') || // check DR
          (dutyStatusArray[i].eventType == '3' &&
            (dutyStatusArray[i].eventCode == '1' ||
              dutyStatusArray[i].eventCode == '2')) // checks PC/YM
        ) {
          initialLog = dutyStatusArray[i];
          initialLogIndex = i;

          // Managing final log
          for (let j = initialLogIndex + 1; j < dutyStatusArray.length; j++) {
            if (
              // finalLogType.includes(dutyStatusArray[j].eventType) &&
              // finalLogCode.includes(dutyStatusArray[j].eventCode)
              (dutyStatusArray[j].eventType == '1' &&
                (dutyStatusArray[j].eventCode == '1' ||
                  dutyStatusArray[j].eventCode == '2' ||
                  dutyStatusArray[j].eventCode == '4')) || // checks normal duty statuses other than DR
              (dutyStatusArray[j].eventType == '3' &&
                (dutyStatusArray[j].eventCode == '1' ||
                  dutyStatusArray[j].eventCode == '2')) // checks PC/YM
            ) {
              // time difference
              const difference = this.timeDifference(
                dutyStatusArray[i],
                dutyStatusArray[j],
              ).difference; // checks hour difference greater than 1

              // If difference is valid
              if (difference) {
                finalLog = dutyStatusArray[j];
                finalLogIndex = j;
                i = j + 1;

                let createdMissingIntermediates =
                  await this.createMissingIntermediates(initialLog, finalLog);

                // Managing the duplication
                const slicedArr = dutyStatusArray.slice(
                  initialLogIndex + 1,
                  finalLogIndex,
                );
                createdMissingIntermediates = this.removeDuplicateIntermediates(
                  slicedArr,
                  createdMissingIntermediates,
                );

                // Place created missing intermediates to their respective locations
                dutyStatusArray.splice(
                  initialLogIndex + 1,
                  0,
                  ...createdMissingIntermediates,
                );

                // Sort the altered array
                dutyStatusArray.sort((a, b) => {
                  const timeA = parseInt(a.eventTime, 10);
                  const timeB = parseInt(b.eventTime, 10);
                  return timeA - timeB;
                });

                // copy and return
                dutyStatuses = dutyStatusArray;
                break;
              } else {
                finalLogIndex = j; // If time difference is less than hour, initiate initial log after this log
                i = j + 1;
                break;
              }
            }
          }
        } else {
          i += 1;
        }
      }
    }
    return dutyStatusArray;
  };

  removeDuplicateIntermediates = (
    dutyStatusesBetweenLogs,
    createdMissingIntermediates,
  ) => {
    // let duplicationRemovedIntermediates = [];

    for (let i = 0; i < createdMissingIntermediates.length; i++) {
      for (let j = 0; j < dutyStatusesBetweenLogs.length; j++) {
        if (
          createdMissingIntermediates[i]?.eventTime ==
          dutyStatusesBetweenLogs[j]?.eventTime
        ) {
          delete createdMissingIntermediates[i];
          // duplicationRemovedIntermediates.push(dutyStatusesBetweenLogs[j]);
        }
      }
    }

    // remove null indexes
    createdMissingIntermediates = createdMissingIntermediates.filter(
      (element) => element !== null,
    );

    return createdMissingIntermediates;
  };

  createMissingIntermediates = async (initialLog, finalLog) => {
    // Skeleton of missing intermediate log
    const skeleton = {
      CYCLE_START_DATE: 0,
      SHIFT_START_DATE: 0,
      accumulatedEngineHours: '0',
      accumulatedVehicleMiles: '0',
      address: '',
      correspondingCmvOrderNumber: '0',
      dataDiagnosticEventIndicatorForDriver: '0',
      distanceSinceLastValidCoordinates: '0',
      eventDataCheckValue: '0',
      eventEndTime: '',
      eventLatitude: '0.0',
      eventLongitude: '0.0',
      eventRecordOrigin: '0',
      eventRecordStatus: '1',
      lineDataCheckValue: '0',
      malfunctionIndicatorStatusForEld: '0',
      notes: '',
      state: '',
      totalEngineHoursDutyStatus: '0',
      totalVehicleMilesDutyStatus: '0',
      userOrderNumberForRecordOriginator: '0',
    };

    // local variables
    const intermediatesBetweenLogs = [];

    // Check time difference between two logs
    const intermediates = this.timeDifference(initialLog, finalLog);
    const hours = intermediates.hours;

    // creating temporary logs array
    for (let i = 0; i < hours; i++) {
      if (intermediatesBetweenLogs.length == 0) {
        intermediatesBetweenLogs.push({
          ...skeleton,
          eventType: '2',
          eventCode: '1',
          missing: true, // indicates separation from the created intermediate logs
          eventDate: initialLog.eventDate,
          eventSequenceIdNumber: await generateUniqueHexId(),
          intermediateType: this.getIntermediateType(initialLog), // For DR > 1 | PC > 2 | YM > 3
          eventTime: moment(initialLog.eventTime, 'HHmmss')
            .add(1, 'hours')
            .format('HHmmss'),
        });
      } else {
        intermediatesBetweenLogs.push({
          ...skeleton,
          eventType: '2',
          eventCode: '1',
          missing: true, // indicates separation from the created intermediate logs
          eventDate:
            intermediatesBetweenLogs[intermediatesBetweenLogs.length - 1]
              .eventDate,
          eventSequenceIdNumber: await generateUniqueHexId(),
          intermediateType:
            intermediatesBetweenLogs[intermediatesBetweenLogs.length - 1]
              .intermediateType, // For DR > 1 | PC > 2 | YM > 3
          eventTime: moment(
            intermediatesBetweenLogs[intermediatesBetweenLogs.length - 1]
              .eventTime,
            'HHmmss',
          )
            .add(1, 'hours')
            .format('HHmmss'),
        });
      }
    }

    return intermediatesBetweenLogs;
  };

  timeDifference = (initialLog, finalLog) => {
    const eventTime1 = initialLog.eventTime;
    const eventTime2 = finalLog.eventTime;

    // Parse the event times using Moment.js and convert them into valid time format
    const timeFormat = 'HHmmss';
    const startTime = moment(eventTime1, timeFormat);
    const endTime = moment(eventTime2, timeFormat);

    // Calculate the time difference
    const duration = moment.duration(endTime.diff(startTime));

    // You can extract the time difference in different units (e.g., hours, minutes, seconds)
    const hoursDifference = duration.hours();

    console.log({ hours: hoursDifference, difference: hoursDifference >= 1 });

    return { hours: hoursDifference, difference: hoursDifference >= 1 };
  };

  getIntermediateType = (log) => {
    // For DR > 1 | PC > 2 | YM > 3
    if (log.eventType == '1' && log.eventCode == '3') return '1';
    else if (log.eventType == '3' && log.eventCode == '1') return '2';
    else if (log.eventType == '3' && log.eventCode == '2') return '3';
  };
  /**
   * ################################### Normalization Wardrobe - END ####################################
   */

  updateMetaVariables = (latestCSV) => {
    const meta = latestCSV.meta;
    const csvObject = latestCSV?.csv;

    const currentDetails = csvObject.timePlaceLine;
    const address = currentDetails?.address;

    meta['lastActivity'] = {
      odoMeterMillage: currentDetails.totalVehicleMilesDutyStatus,
      engineHours: currentDetails.totalEngineHoursDutyStatus,
      currentTime: currentDetails.currentTime,
      currentDate: currentDetails.currentDate,
      latitude: currentDetails.currentLatitude,

      longitude: currentDetails.currentLongitude,
      address: currentDetails?.address,
      // {
      //   location: currentDetails?.address,
      //   time: currentDetails.currentTime,
      //   date: currentDetails.currentDate,
      // },
      currentEventCode: currentDetails?.currentEventCode || '1',
      currentEventType: currentDetails?.currentEventType,
      currentTotalEngineHours: currentDetails?.currentTotalEngineHours,
      currentTotalVehicleMiles: currentDetails?.currentTotalVehicleMiles,
      speed: currentDetails?.speed,
    };
    if (currentDetails?.address == '') {
      delete meta.lastActivity.address;
    }

    return meta;
  };

  inserDutyStatus = async (
    logsOfSelectedDate,
    driverId,
    date,
    startTime,
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
    notes,
    state,
    timezone,
  ) => {
    try {
      // if (Array.isArray(logsOfSelectedDate)) {
      //data available
      let dutyStatusLogs = Array.isArray(logsOfSelectedDate)
        ? JSON.parse(
            JSON.stringify(
              logsOfSelectedDate[0].csv
                .eldEventListForDriversRecordOfDutyStatus,
            ),
          )
        : logsOfSelectedDate.csv.eldEventListForDriversRecordOfDutyStatus;

      const inActiveLogs = dutyStatusLogs.filter((element) => {
        return element.eventRecordStatus == '2';
      });
      dutyStatusLogs = dutyStatusLogs.filter((element) => {
        return element.eventRecordStatus != '2';
      });
      // let { filterd, arr } = await getInBetweenLogs(
      //   dutyStatusLogs,
      //   startTime,
      //   endTime,
      // );
      // let addedLogs = JSON.parse(
      //   JSON.stringify(await addFirstandLast(dutyStatusLogs,startTime, endTime)),
      // );
      const newLog = await createNewLog(
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
        state,
      );
      let addedLogs = await insertLog(
        dutyStatusLogs,
        newLog,
        startTime,
        endTime,
      );
      addedLogs = addedLogs.sort((a, b) =>
        a.eventTime.localeCompare(b.eventTime),
      );
      function findLogIndexByEventTime(logs, eventTime) {
        for (let i = 0; i < logs.length; i++) {
          if (logs[i].eventTime === eventTime) {
            return i;
          }
        }
        return -1; // Return -1 if the log with the specified eventTime is not found
      }

      addedLogs.sort((a, b) => a.eventTime.localeCompare(b.eventTime));

      // const index = findLogIndexByEventTime(addedLogs, startTime)
      // if (index != addedLogs.length - 1) {
      //   addedLogs[index + 1].eventTime = endTime

      // }
      let finalLogs = await removeDuplicateConsecutiveLogs(addedLogs);
      finalLogs = [...finalLogs, ...inActiveLogs];
      addedLogs.sort((a, b) => a.eventTime.localeCompare(b.eventTime));
      const csv = JSON.parse(
        JSON.stringify(
          Array.isArray(logsOfSelectedDate)
            ? logsOfSelectedDate[0].csv
            : logsOfSelectedDate.csv,
        ),
      );
      csv.eldEventListForDriversRecordOfDutyStatus = finalLogs;
      const finalCsv = JSON.parse(JSON.stringify(csv));
      return csv;
      // }
    } catch (error) {
      throw error;
    }
  };
  getAddress = async (lat, long) => {
    try {
      return await getLocationDescription(lat, long);
    } catch (error) {
      throw error;
    }
  };
  addAndUpdateDriverRecord = async (data) => {
    try {
      const record = await this.recordTable.findOneAndUpdate(
        { driverId: data.driverId, date: data.date },
        { $set: data },
        { upsert: true, returnDocument: 'after' },
      );

      return record;
    } catch (error) {
      Logger.log(error);
      throw error;
    }
  };
  findByDriveAndDate = async (ids, queryParams) => {
    let records;
    const { date, search } = queryParams;
    const where = {
      date: {
        $in: [date, ''],
      },
      $or: [
        {
          driverName: {
            $regex: search,
            $options: 'i',
          },
        },

        {
          vehicleName: {
            $regex: search,
            $options: 'i',
          },
        },
      ],
    };
    const driverQuery = await this.recordTable.find(where).lean();
    if (isArray(driverQuery)) {
      records = { driverQuery };
    } else {
      records = driverQuery;
    }

    return records;
  };
  findByDriverID = async (ids, date) => {
    const records = [];
    const driverQuery = await this.recordTable.find({
      driverId: {
        $in: ids,
      },
      date: {
        $in: date,
      },
    }); //driver
    if (driverQuery.length > 0) {
      for (let i = 0; i < driverQuery.length; i++) {
        records.push(driverQuery[i]['_doc']);
      }
    }
    return records;
  };
  findByDriverIDWithDate = async (ids, startDate, endDate) => {
    const records = [];
    const driverQuery = await this.recordTable.find({
      driverId: {
        $in: ids,
      },
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });
    if (driverQuery.length > 0) {
      for (let i = 0; i < driverQuery.length; i++) {
        records.push(driverQuery[i]['_doc']);
      }
    }
    return records;
  };
  deleteDriverRecord = async (driverId, date) => {
    try {
      const result = await this.recordTable.deleteOne({ driverId, date });
      return result;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  };
}
