import { getTimeZoneDateRangeForDay } from '@shafiqrathore/logeld-tenantbackend-common-future';
import moment from 'moment-timezone';
import LogsDocument from 'mongoDb/document/document';
import { BaseHOSStatusEntity } from './base/BaseHOSStatusEntity';
import { EventType, LogActionType, StatusKey, ViolationType } from './Enums';
import {
  LogEntry,
  DutyType,
  PartialStatusesType,
  statusKeys,
  GenericStatusTeller,
  ViolationTypeArr,
} from './types';

export class HOSStatusInMemoryCalculatedStats {
  shiftRecap: Array<Partial<GenericStatusTeller>> = [];
  currentStatusInstance: Partial<GenericStatusTeller> = undefined;
  shiftStartStatus: number = 0;
  qualifyingPeriod: Array<number> = [];
  prevQualifyingPeriod: Array<number> = [];
  potentialQualifyingPeriod: Array<number> = [];
  isPotentialSatisfied: boolean;
  continuousDriveTime = 0;
  continuousNonDriveTime = 0;
  isStarted = false;
  lastEntry = null;
  companyTimezone;
  // Pervious implementation
  statusesData: PartialStatusesType = {};

  private dutyStatus: LogActionType = LogActionType.OFF_DUTY;

  protected isActive: boolean;

  lastKnownLocation?: {
    longitude?: number;
    latitude?: number;
  } = {};

  secondLastKnownLocation?: {
    // the last known location of the unit
    longitude?: number;
    latitude?: number;
  } = {};

  shiftStartDate: number;
  shiftEndDate: number;

  calendarStartDate: number;
  calendarEndDate: number;

  recap: Array<PartialStatusesType> = [];

  // duty started at
  protected startOfDay = new Date();
  protected endOfDay = new Date();
  protected totalDriveTimeInSecondsSoFar = 0;
  protected totalDutyTimeInSecondsSoFar = 0;
  continuousOffTimeInSeconds = 0;



  logs: Array<LogEntry> = new Array<LogEntry>();

  constructor() {
    this.startOfDay.setHours(0, 0, 0, 0);
    this.endOfDay.setHours(23, 59, 59, 999);
  }

  get startOfTheDay() {
    return this.startOfDay.getTime();
  }

  get endOfTheDay() {
    return this.endOfDay.getTime();
  }

  set shiftStartDateTime(value: number) {
    this.shiftStartDate = value;
  }

  get shiftStartDateTime() {
    return this.shiftStartDate;
  }

  set shiftEndDateTime(value: number) {
    this.shiftEndDate = value;
  }

  get shiftEndDateTime() {
    return this.shiftEndDate;
  }

  set totalDriveTimeInSeconds(value: number) {
    this.totalDriveTimeInSecondsSoFar = value;
  }

  get totalDriveTimeInSeconds() {
    return this.totalDriveTimeInSecondsSoFar;
  }

  set totalDutyTimeInSeconds(value: number) {
    this.totalDutyTimeInSecondsSoFar = value;
  }

  get totalDutyTimeInSeconds() {
    return this.totalDutyTimeInSecondsSoFar;
  }

  set currentDutyStatus(value: LogActionType) {
    this.dutyStatus = value;
  }

  get currentDutyStatus() {
    return this.dutyStatus;
  }

  set setActiveCycle(isActive: boolean) {
    this.isActive = isActive;
  }

  get isActiveCycle() {
    return this.isActive;
  }

  getKeyValue = <U>(key: string) => this[key] as U;
  setKeyValue = <U>(key: string, value: U) => (this[key] = value);

  /**
   *
   * @param data
   * @description sets statuses data in class level variables
   */
  setStatusesData = (data: PartialStatusesType) => {
    let statusKeyName = Object.keys(data)[0]; // <=  onDuty, onDriving etc;
    let existingStatusData: DutyType = {
      ...(this.statusesData[statusKeyName] as DutyType),
    };
    let newStatusData = { ...(data[statusKeyName] as DutyType) };

    if (existingStatusData && existingStatusData.counter > 0) {
      existingStatusData.counter = newStatusData.counter;
      existingStatusData.totalSecondsSpentSoFar +=
        newStatusData.totalSecondsSpentSoFar;
      existingStatusData.lastStartedAt = newStatusData.lastStartedAt;
      existingStatusData.startedAt = newStatusData.startedAt;
    } else {
      existingStatusData = { ...newStatusData };
    }

    if (statusKeyName === 'onDuty') {
      this.totalDutyTimeInSecondsSoFar =
        existingStatusData.totalSecondsSpentSoFar;
    }
    else if (statusKeyName === 'onDriving') {
      this.totalDriveTimeInSecondsSoFar =
        existingStatusData.totalSecondsSpentSoFar;
    }

    this.statusesData[statusKeyName] = existingStatusData;
  };


  /**
   *
   * @param actionDate
   * @param actionType
   */
  createLogEntry = (
    actionDate: number,
    actionType: LogActionType,
    partialData?: Partial<LogEntry>
  ) => {
    // Getting status key
    const statusKey = StatusKey[actionType];
    const dutyData = partialData.statusesData[statusKey]
    const prevLogEntry = Array.isArray(this.lastEntry) ? this.lastEntry[0] : this.lastEntry;

    let doManualResolve = false;
    // TODO --> need to do according to the company time-zone
    if (prevLogEntry && prevLogEntry.actionType === actionType) {
      const prevStatusData = prevLogEntry.statusesData[StatusKey[prevLogEntry.actionType]];
      const endOfDay = moment.unix(dutyData?.startedAt).tz(this.companyTimezone).endOf('day').unix();
      if (partialData.actionDate > endOfDay) {
        if (!prevStatusData.lastStartedAt && prevLogEntry?.actionDate <= endOfDay) {
          const partialActionDate = moment.tz(moment.unix(partialData?.actionDate), this.companyTimezone).format('YYYY-MM-DD');
          const prevStatusDataStartDate = moment.tz(moment.unix(prevStatusData?.startedAt), this.companyTimezone).format('YYYY-MM-DD');
          const { start } = getTimeZoneDateRangeForDay(partialActionDate, this.companyTimezone);
          const { end: previousDayEnd } = getTimeZoneDateRangeForDay(prevStatusDataStartDate, this.companyTimezone);
          partialData.statusesData[StatusKey[partialData.actionType]].startedAt = start;
          prevLogEntry.statusesData[StatusKey[prevLogEntry.actionType]].lastStartedAt = previousDayEnd;
          doManualResolve = true
          this.logs.push(prevLogEntry);
          //Set total seconds spent so far to 0

        } else {
          const { start } = getTimeZoneDateRangeForDay(moment.unix(partialData?.actionDate).format('YYYY-MM-DD'), this.companyTimezone);
          partialData.statusesData[StatusKey[partialData.actionType]].startedAt = start;
          this.currentStatusInstance.startedAt = start;
        }
      }
    }

    // Converting last started at to utc
    partialData.statusesData[statusKey].lastStartedAt = partialData
      ?.statusesData?.[statusKey]?.lastStartedAt
      ? partialData.statusesData[statusKey].lastStartedAt
      : undefined;

    if (partialData?.eventType) {
      partialData.eventType = EventType[partialData.eventType];
    }
    this.logs.push({
      ...{
        driverId: partialData.driverId,
        tenantId: partialData.tenantId,
        serverDate: partialData.serverDate ? partialData.serverDate : moment().unix(),
        actionType,
        isViolation: false,
        violations: [],
        actionDate: partialData.actionDate,
        geoLocation: {
          longitude: 0.0,
          latitude: 0.0,
        },
        vehicleManualId: partialData.vehicleManualId,
        sequenceNumber: partialData.sequenceNumber,
      },
      ...partialData,
    });
    this.lastEntry = JSON.parse(JSON.stringify(this.logs[this.logs.length - 1]));
    if (doManualResolve) {
      return prevLogEntry.statusesData[StatusKey[prevLogEntry.actionType]]
    }
    // return this.lastEntry;
  };


  /**
   *
   * @param actionDate
   * @param actionType
   */
  createLogEntryAsEldEvent = (
    eventType: EventType,
    partialData?: Partial<LogEntry>
  ) => {
    partialData.eventType = EventType[partialData.eventType];
    this.logs.push({
      ...{
        driverId: partialData.driverId,
        tenantId: partialData.tenantId,
        serverDate: partialData.serverDate ? partialData.serverDate : moment().unix(),
        actionDate: partialData.actionDate,
        eventType: partialData.eventType,
        geoLocation: partialData.geoLocation,
        vehicleManualId: partialData.vehicleManualId,
        odoMeterSpeed: partialData.odoMeterSpeed,
        odoMeterMillage: partialData.odoMeterMillage,
        engineHours: partialData.engineHours,
        sequenceNumber: partialData.sequenceNumber,
      }
    });
  };

  /**
   *
   * @param actionDate
   * @param actionType
   */
  createLogEntryAsManual = (
    partialData?: Partial<LogEntry>
  ) => {
    this.logs.push({
      ...{
        driverId: partialData.driverId,
        tenantId: partialData.tenantId,
        serverDate: partialData.serverDate ? partialData.serverDate : moment().unix(),
        actionDate: partialData.actionDate,
        eventType: partialData.eventType,
        geoLocation: {
          longitude: 0.0,
          latitude: 0.0,
        },
        vehicleManualId: partialData.vehicleManualId,
        odoMeterSpeed: partialData.odoMeterSpeed,
        odoMeterMillage: partialData.odoMeterMillage,
        engineHours: partialData.engineHours,
        sequenceNumber: partialData.sequenceNumber,
      },
      ...partialData,
    });
  };
  /**
   *
   * @description This function is used when a log entry for a driver is already created for current date in the database and further
   *  calculations are to be based off of that data.
   */
  setInstanceData = (lastEntryFound: LogsDocument) => {
    this.dutyStatus = lastEntryFound.dutyStatus;
    this.logs = (lastEntryFound.get('logs') as Array<LogEntry>) ?? [];
    this.statusesData = lastEntryFound.get('statusesData')?.toJSON() ?? {};
    // if (lastEntryFound.totalDriveTimeInSecondsSoFar) {
    this.totalDriveTimeInSecondsSoFar = lastEntryFound.totalDriveTimeInSecondsSoFar;
    // }
    // else {
    //   let totalTimeInSecondsForLastEntry = lastEntryFound.statusesData?.onDriving ? currentTime- lastEntryFound.statusesData.onDriving?.startedAt : 0;
    //   this.totalDriveTimeInSecondsSoFar = totalTimeInSecondsForLastEntry
    // }

    this.totalDutyTimeInSecondsSoFar = lastEntryFound.totalDutyTimeInSecondsSoFar;
    // following property is internally returning the dutyStatus, we need to remove this and start using dutyStatus
    this.currentDutyStatus = lastEntryFound.dutyStatus;
    this.shiftStartDate = lastEntryFound.shiftStartDate;
    this.shiftEndDate = lastEntryFound.shiftEndDate;
    this.calendarStartDate = lastEntryFound.calendarStartDate;
    this.calendarEndDate = lastEntryFound.calendarEndDate;
    this.continuousOffTimeInSeconds = lastEntryFound.continuousOffTimeInSeconds;
    this.continuousDriveTime = lastEntryFound.continuousDriveTime;
    this.isActive = lastEntryFound.isActive;
    this.recap = (lastEntryFound.recap.map(recapObj => recapObj.toJSON()) as Array<PartialStatusesType>) ?? [];
    // New additions
    this.currentStatusInstance = lastEntryFound.currentStatusInstance ?? undefined;
    this.shiftRecap = (lastEntryFound.shiftRecap.map(shiftRecapObj => shiftRecapObj) as Array<Partial<GenericStatusTeller>>) ?? [];
    this.shiftStartStatus = lastEntryFound.shiftStartStatus ?? 0;

    this.potentialQualifyingPeriod = (lastEntryFound?.potentialQualifyingPeriod.map(pqp => pqp)) as Array<number> ?? [];
    this.prevQualifyingPeriod = (lastEntryFound?.prevQualifyingPeriod.map(pqp => pqp)) as Array<number> ?? [];
    this.qualifyingPeriod = (lastEntryFound?.qualifyingPeriod.map(pqp => pqp)) as Array<number> ?? [];
    this.isPotentialSatisfied = lastEntryFound?.isPotentialSatisfied ?? false;
    this.continuousNonDriveTime = lastEntryFound?.continuousNonDriveTime ?? 0;
    this.isStarted = lastEntryFound.isStarted;
    this.lastEntry = lastEntryFound.lastEntry;
  };

  setCompanyTimeZone(timezone: string) {
    this.companyTimezone = timezone || moment.tz.guess();
  }

  isQPCheck = (i) => {
    const secondsIn2Hours = moment.duration(2, 'hours').asSeconds();
    const onGoingSeconds = (this.currentStatusInstance?.actionType && (this.currentStatusInstance.actionType === LogActionType.OFF_DUTY || this.currentStatusInstance.actionType === LogActionType.SLEEPER_BERTH)) ?
      this.currentStatusInstance.actionDate - this.currentStatusInstance.startedAt : 0;
    return (this.secondsInQP(this.potentialQualifyingPeriod) + onGoingSeconds >= secondsIn2Hours) ?
      this.potentialQualifyingPeriod.includes(i) :
      this.qualifyingPeriod.includes(i);
  }

  setViolations = (
    caller: BaseHOSStatusEntity,
    partialData?: Partial<LogEntry>,
  ) => {
    if (partialData) {
      partialData.violations = [];
      const statusKeyName = Object.keys(partialData.statusesData)[0]; // <=  onDuty, onDriving etc;
      const onDriveStatus = this.statusesData.onDriving;
      const onDutyStatus = this.statusesData.onDuty;
      const onYardMoveStatus = this.statusesData.onYardMove;

      // Calculating max limits of rules.
      const secondsIn8Hours = moment.duration(8, 'hours').asSeconds();
      const secondsIn11Hours = moment.duration(11, 'hours').asSeconds();
      const secondsIn14Hours = moment.duration(14, 'hours').asSeconds();
      /* ALI */
      // Calculating seconds spent so far in this driving chunk
      const chunkStart = parseInt(partialData.statusesData[statusKeyName].startedAt);
      const chunkEnd = parseInt(partialData.statusesData[statusKeyName].lastStartedAt ?? partialData.actionDate);

      const secondsSpentInThisChunk = chunkEnd - chunkStart;

      // Checking for 30 min break violation
      if (
        this.continuousDriveTime +
        (partialData.actionType === LogActionType.DRIVING
          ? secondsSpentInThisChunk
          : 0) >
        secondsIn8Hours // break ended less than 8 hours ago
      ) {
        // check if any exception with 30 minutes inserted and the startedAt time is exactly the one of its containing log entry
        this.pushInViolations(partialData, secondsIn8Hours, statusKeyName, ViolationType.THIRTY_MINUTES_BREAK, chunkStart, chunkEnd, this.continuousDriveTime, secondsSpentInThisChunk);
      }

      let statusesThatMatter = this.shiftRecap.filter((_, i) => (i >= this.shiftStartStatus) && (!this.isQPCheck(i)));

      // Checking for 11 Hour drive violation
      let drivingStatuses = (statusesThatMatter.filter(s => s.actionType == LogActionType.DRIVING));
      let drivingTimeOfShiftBeforeNow = drivingStatuses.reduce((prev, { totalSecondsSpentSoFar }) => prev + totalSecondsSpentSoFar, 0);
      let drivingTimeOfShiftAccumulative = drivingTimeOfShiftBeforeNow + (partialData.actionType === LogActionType.DRIVING ? secondsSpentInThisChunk : 0);
      if (drivingTimeOfShiftAccumulative > secondsIn11Hours) {
        this.pushInViolations(partialData, secondsIn11Hours, statusKeyName, ViolationType.ELEVEN_HOURS_DRIVE, chunkStart, chunkEnd, drivingTimeOfShiftBeforeNow, secondsSpentInThisChunk);
      }

      // Checking for 14 Hour duty violation
      let dutyTimeBeforeNow = statusesThatMatter.reduce((prev, { totalSecondsSpentSoFar }) => prev + totalSecondsSpentSoFar, 0);
      let dutyTimeAccumulative = dutyTimeBeforeNow + (partialData.actionType === LogActionType.DRIVING ? secondsSpentInThisChunk : 0);
      if (dutyTimeAccumulative > secondsIn14Hours) {
        this.pushInViolations(partialData, secondsIn14Hours, statusKeyName, ViolationType.FOURTEEN_HOURS_SHIFT, chunkStart, chunkEnd, drivingTimeOfShiftAccumulative);
      }

      // Checking for 70/8 violation
      const currentDate = moment().tz(this.companyTimezone);
      const eighthDayStart = currentDate.subtract(7, 'days').startOf('day').unix();
      const last8DaysData = this.recap.filter(
        (recapObj) => recapObj.calendarStartDate >= eighthDayStart,
      );
      const secondsWorkedInLast8Days = last8DaysData.reduce((acc, curr) => {
        return (
          acc + curr.onDuty?.totalSecondsSpentSoFar ??
          0 + curr.onDriving?.totalSecondsSpentSoFar ??
          0 + curr.onYardMove?.totalSecondsSpentSoFar ??
          0
        );
      }, 0);
      const secondsIn70Hours = moment.duration(70, 'hours').asSeconds();
      if (
        secondsWorkedInLast8Days > secondsIn70Hours &&
        partialData.actionType === LogActionType.DRIVING
      ) {
        this.pushInViolations(partialData, secondsIn70Hours, statusKeyName, ViolationType.SEVENTY_BY_EIGHT_VIOLATION, chunkStart, chunkEnd, secondsWorkedInLast8Days);
      }
      return partialData;
    }
  };

  /**
   * 
   * @param partialData The logEntry which is being sent by the client.
   * @param secondsX Seconds within hours, value changes based on 30 mins, 8, 11, and 14 hours.
   * @param statusKeyName The status which is being processed from the logEntry.
   * @param violationType The type of the violation e.g 30 mins, 11 hours and so on.
   * @param chunkStart The start time of the logEntry
   * @param chunkEnd The end time of the logEntry, if the lastStartedAt is not present, this must be actionDate than
   * @param totalSecondsWRTViolation The seconds which marks the violation
   * @param secondsInThisChunk The seconds in logEntry
   * @description determine that start and end time of the respective violation based on its parameters
   */
  pushInViolations = (partialData: Partial<LogEntry>, secondsX: number, statusKeyName: string,
    violationType: ViolationType, chunkStart: number, chunkEnd: number, totalSecondsWRTViolation: number = 0,
    secondsInThisChunk: number = 0): void => {

    const existingViolations = (this.lastEntry?.violations as Array<ViolationTypeArr>)?.filter(x => x.statusStartedAt == chunkStart && x.type === violationType);

    let existingViolation = null;
    //Violation to be pushed
    let violationToBeInserted: ViolationTypeArr;

    if (existingViolations?.length > 0 && partialData.statusesData[statusKeyName]?.lastStartedAt > 0) {
      existingViolation = existingViolations[0];
      existingViolation.endedAt = chunkEnd;
      violationToBeInserted = { ...JSON.parse(JSON.stringify(existingViolation)) };
    } else {
      // since start and end time may not be present in this data or that may come with chunks, 
      // lets start from end to determine violation time rather using start time to determine
      let violationStartTime = chunkEnd - Math.min((((totalSecondsWRTViolation + secondsInThisChunk) - secondsX)), secondsInThisChunk);

      // special if to ignore 14+ hours in on duty not driving case. 
      if (totalSecondsWRTViolation + secondsInThisChunk <= secondsX)
        violationStartTime = chunkStart
      else if (totalSecondsWRTViolation > secondsX && secondsInThisChunk <= 0) {
        violationStartTime = chunkEnd - (totalSecondsWRTViolation - secondsX)
      }



      violationToBeInserted = {
        statusStartedAt: chunkStart, startedAt: violationStartTime, type: violationType
      };

      if (chunkEnd > 0) {
        violationToBeInserted.endedAt = chunkEnd;
      }
    }
    // Pushing violation to HOSIMC
    partialData.violations.push(violationToBeInserted);
  }

  check34hResetConditions = (lastStartedAt: number) => {
    const secondsIn34Hours = moment.duration(34, 'hours').asSeconds();
    if (this.continuousOffTimeInSeconds >= secondsIn34Hours) {
      this.isActive = false;
      this.calendarEndDate = lastStartedAt;
    }
  };
  secondsInQP = (qpArray: Array<number>): number => qpArray.reduce((prev, qp) => prev + this.shiftRecap[qp].totalSecondsSpentSoFar, 0);

  resetPotentialQP = () => {
    this.potentialQualifyingPeriod = []
    this.isPotentialSatisfied = false;
  }
  checkPotentialQP = (reset = false) => {
    const secondsIn2Hours = moment.duration(2, 'hours').asSeconds();
    (this.secondsInQP(this.potentialQualifyingPeriod) >= secondsIn2Hours) && this.potentialToQP();
    reset && this.resetPotentialQP();
  }

  potentialToQP = () => {
    this.isPotentialSatisfied = true;
    this.prevQualifyingPeriod = this.qualifyingPeriod;
    this.qualifyingPeriod = this.potentialQualifyingPeriod
    this.potentialQualifyingPeriod = [];
  }
  updateSplitConditions = (partialData: Partial<LogEntry>) => {
    const secondsIn2Hours = moment.duration(2, 'hours').asSeconds();
    let secondsOfOngoing = partialData.actionDate - partialData.statusesData[StatusKey[partialData.actionType]].startedAt;
    if (this.continuousOffTimeInSeconds + secondsOfOngoing >= secondsIn2Hours) {
      this.prevQualifyingPeriod = this.qualifyingPeriod.map(i => i);
      this.qualifyingPeriod = [this.shiftRecap.length];
    }
  }

  slideWindowSplit = () => {
    this.shiftStartStatus = this.prevQualifyingPeriod[this.prevQualifyingPeriod.length - 1] + 1;
    this.prevQualifyingPeriod = [];
  }

  checkSplitConditions = () => {
    let checkASleeper = (indexQP: number) =>
      (this.shiftRecap[indexQP].actionType === LogActionType.SLEEPER_BERTH) &&
      (this.shiftRecap[indexQP].totalSecondsSpentSoFar >= moment.duration(7, 'hours').asSeconds())

    const secondsIn10Hours = moment.duration(10, 'hours').asSeconds();
    //Check if current is a QP
    if (this.qualifyingPeriod.includes(this.shiftRecap.length - 1)) {
      //Check if it pairs
      let secondsOfQPPair = 0;
      this.qualifyingPeriod.forEach(qp => { secondsOfQPPair += this.shiftRecap[qp]?.totalSecondsSpentSoFar ?? 0 });
      this.prevQualifyingPeriod.forEach(qp => { secondsOfQPPair += this.shiftRecap[qp].totalSecondsSpentSoFar });

      //Check is valid sleeper is verified
      let isSleeperValid = this.qualifyingPeriod.reduce((prev, qp) => prev || checkASleeper(qp), false);
      isSleeperValid = isSleeperValid || this.prevQualifyingPeriod.reduce((prev, qp) => prev || checkASleeper(qp), false);

      //Check if both of the above conditions are met
      //Hit window slide IF yes
      if (secondsOfQPPair >= secondsIn10Hours && isSleeperValid) {
        this.slideWindowSplit();
      }
    }
  }

  addTimeInShiftArray = (
    lastStartedAt: number,
    secondsToAdd: number
  ) => {
    this.currentStatusInstance.lastStartedAt = lastStartedAt;
    this.currentStatusInstance.totalSecondsSpentSoFar = secondsToAdd;
    this.shiftRecap.push(this.currentStatusInstance);
    this.currentStatusInstance = undefined;
  };

  addTimeInRecapArray = (
    startedAt: number,
    secondsToAdd: number,
    statusKey: statusKeys,
  ) => {
    const lastLogEntryViolations = this.logs[this.logs.length - 1].violations;
    startedAt = +startedAt;
    const startOfDate = moment.unix(startedAt).tz(this.companyTimezone).startOf('day').unix();
    const endOfDate = moment.unix(startedAt).tz(this.companyTimezone).endOf('day').unix();
    // const { start: startOfDate, end: endOfDate } = getTimeZoneDateRangeForDay(moment(), this.companyTimezone);
    const foundObjRecap = this.recap.find((recapObject) => {
      return recapObject.calendarStartDate === startOfDate;
    });
    if (foundObjRecap) {
      foundObjRecap[statusKey] = foundObjRecap[statusKey]
        ? foundObjRecap[statusKey]
        : { totalSecondsSpentSoFar: 0 };
      if (startedAt + secondsToAdd > endOfDate) {
        foundObjRecap[statusKey].totalSecondsSpentSoFar +=
          secondsToAdd - (startedAt + secondsToAdd - endOfDate);
        const newStatusObject: PartialStatusesType = {
          calendarStartDate: moment
            .unix(startedAt)
            .add(1, 'day')
            .startOf('day')
            .unix(),
          calendarEndDate: moment
            .unix(startedAt)
            .add(1, 'day')
            .endOf('day')
            .unix(),
          violations: []
        };
        newStatusObject[statusKey] = { totalSecondsSpentSoFar: 0 };
        newStatusObject[statusKey].totalSecondsSpentSoFar +=
          startedAt + secondsToAdd - endOfDate;
        this.recap.push(newStatusObject);

      } else {
        foundObjRecap[statusKey].totalSecondsSpentSoFar += secondsToAdd;
      }
      lastLogEntryViolations.forEach((violation) => {
        const violationObjFound = foundObjRecap.violations.find(
          (violationObj) => violationObj.type === violation.type,
        );

        if (violationObjFound) {
          violationObjFound.count += 1;
        } else {
          foundObjRecap.violations.push({
            type: violation.type,
            count: 1,
          });
        }
      });
    } else {
      const pervDayStatusObj: PartialStatusesType = {
        calendarStartDate: startOfDate,
        calendarEndDate: endOfDate,
        violations: []
      };
      pervDayStatusObj[statusKey] = { totalSecondsSpentSoFar: 0 };
      if (startedAt + secondsToAdd > endOfDate) {
        pervDayStatusObj[statusKey].totalSecondsSpentSoFar +=
          secondsToAdd - (startedAt + secondsToAdd - endOfDate);
        const nextDayStatusObj: PartialStatusesType = {
          calendarStartDate: moment
            .unix(startedAt)
            .add(1, 'day')
            .startOf('day')
            .unix(),
          calendarEndDate: moment
            .unix(startedAt)
            .add(1, 'day')
            .endOf('day')
            .unix(),
          violations: []
        };
        nextDayStatusObj[statusKey] = { totalSecondsSpentSoFar: 0 };
        nextDayStatusObj[statusKey].totalSecondsSpentSoFar +=
          startedAt + secondsToAdd - endOfDate;

        this.recap.push(pervDayStatusObj);
        this.recap.push(nextDayStatusObj);
      } else {
        pervDayStatusObj[statusKey].totalSecondsSpentSoFar += secondsToAdd;
        this.recap.push(pervDayStatusObj);
      }

      lastLogEntryViolations.forEach((violation) => {
        const violationObjFound = pervDayStatusObj.violations.find(
          (violationObj) => violationObj.type === violation.type,
        );

        if (violationObjFound) {
          violationObjFound.count += 1;
        } else {
          pervDayStatusObj.violations.push({
            type: violation.type,
            count: 1,
          });
        }
      });
    }
  };

  resetShift = (lastStartedAt: number) => {
    this.totalDriveTimeInSecondsSoFar = 0;
    this.totalDutyTimeInSecondsSoFar = 0;
    // const shiftEndTime = moment.unix(this.shiftStartDate).add(24, 'h').unix();
    this.statusesData = {};
    this.shiftEndDate = lastStartedAt;
    this.prevQualifyingPeriod = [];
    this.qualifyingPeriod = [];
    this.shiftRecap = [];
    this.currentStatusInstance = undefined;
    this.shiftStartStatus = 0;
  };

  checkResetConditions = (lastStartedAt: number) => {
    const secondsIn10Hours = moment.duration(10, 'hours').asSeconds();
    const { offDuty, onSleeperBerth } = this.statusesData;

    /**
     * Checks for continuous 10 Hours on Sleeper Berth and Off Duty
     */
    if (this.continuousOffTimeInSeconds >= secondsIn10Hours) {
      return this.resetShift(lastStartedAt);
    }
  };

  clockData = () => {
    /** BREAK SECONDS CALCULATION: START**/
    // Time Left Before a 30 minute break is required
    let breakSeconds = this.continuousDriveTime ?? 0;
    breakSeconds += this.currentStatusInstance?.actionType === LogActionType.DRIVING &&
      (moment().tz("America/Chicago").unix()
      -this.currentStatusInstance.actionDate )
    /** BREAK SECONDS CALCULATION: END**/


    let statusesThatMatter = this.shiftRecap.filter((_, i) => (i >= this.shiftStartStatus) && (!this.isQPCheck(i)));
    /** TOTAL DRIVING SECONDS CALCULATION: START**/
    /** SPLIT**/
    // Total driving seconds spent in split shift
    let drivingStatusesSplit = statusesThatMatter.filter(s => s.actionType == LogActionType.DRIVING);
    let drivingTimeOfShiftBeforeNowSplit = drivingStatusesSplit.reduce((prev, { totalSecondsSpentSoFar }) => prev + totalSecondsSpentSoFar, 0);
    let secondsSpentInThisChunkSplit = this.currentStatusInstance?.actionType === LogActionType.DRIVING ? (moment().unix() - this.currentStatusInstance.actionDate) : 0;
    let drivingTimeOfShiftAccumulativeSplit = drivingTimeOfShiftBeforeNowSplit + secondsSpentInThisChunkSplit;
    // Return param
    let driveSecondsSplit = drivingTimeOfShiftAccumulativeSplit;
    /** REGULAR **/
    // Total driving seconds spent in shift
    let drivingStatuses = this.shiftRecap.filter(s => s.actionType == LogActionType.DRIVING);
    let drivingTimeOfShiftBeforeNow = drivingStatuses.reduce((prev, { totalSecondsSpentSoFar }) => prev + totalSecondsSpentSoFar, 0);
    let secondsSpentInThisChunk = this.currentStatusInstance?.actionType === LogActionType.DRIVING ? (moment().tz("America/Chicago").unix()-    this.currentStatusInstance.actionDate  ) : 0;
    let drivingTimeOfShiftAccumulative = drivingTimeOfShiftBeforeNow + secondsSpentInThisChunk;
    // Return param
    let driveSecondsRegular = drivingTimeOfShiftAccumulative;

    /** SPLIT **/
    // Total duty Seconds spent in the 14 hour shift
    const secondsIn2Hours = moment.duration(2, 'hours').asSeconds();
    let dutyTimeBeforeNow = statusesThatMatter.reduce((prev, { totalSecondsSpentSoFar }) => prev + totalSecondsSpentSoFar, 0);
    let dutyTimePQP = (this.secondsInQP(this.potentialQualifyingPeriod));
    let dutyTimeInCurrentStatus = this.currentStatusInstance?.startedAt ? (moment().tz("America/Chicago").unix() -   this.currentStatusInstance.actionDate)  : 0;
    let dutyTimeCurrentStatus = dutyTimeInCurrentStatus;
    if (this.currentStatusInstance?.actionType === LogActionType.OFF_DUTY
      || this.currentStatusInstance?.actionType === LogActionType.SLEEPER_BERTH)
      dutyTimeCurrentStatus = (this.isStarted && (dutyTimePQP + dutyTimeInCurrentStatus) < secondsIn2Hours) ? dutyTimeInCurrentStatus : 0;

    let dutyTimeAccumulative = dutyTimeBeforeNow + dutyTimeCurrentStatus;
    // Return param
    let shiftDutySecondsSplit = dutyTimeAccumulative;

    /** REGULAR **/
    let shiftDutySecondsRegular = this.shiftRecap.length ? (this.shiftRecap[(this.shiftRecap.length - 1)]?.lastStartedAt - this.shiftRecap[0]?.startedAt) : 0;

    shiftDutySecondsRegular += dutyTimeInCurrentStatus
    //Total duty time spent in weekly shift
    const eighthDayStart = moment().subtract(7, 'days').startOf('day').unix();
    const last8DaysData = this.recap.filter(
      (recapObj) => recapObj.calendarStartDate >= eighthDayStart,
    );
    let secondsWorkedInLast8Days = last8DaysData.reduce((acc, curr) => {
      acc += curr.onDuty?.totalSecondsSpentSoFar ?? 0;
      acc += curr.onDriving?.totalSecondsSpentSoFar ?? 0;
      acc += curr.onYardMove?.totalSecondsSpentSoFar ?? 0;
      return acc;
    }, 0);
    if (this.currentStatusInstance &&
      (this.currentStatusInstance.actionType === LogActionType.DRIVING || this.currentStatusInstance.actionType === LogActionType.ON_DUTY_NOT_DRIVING)) {
      secondsWorkedInLast8Days +=  (moment().tz("America/Chicago").unix() -this.currentStatusInstance.actionDate )
    }

    let weekDutySeconds = secondsWorkedInLast8Days;
    /** TOTAL CYCLE SECONDS CALCULATION: START**/

    let secondsIn11Hours = moment.duration(11, 'hours').asSeconds();
    let secondsIn14Hours = moment.duration(14, 'hours').asSeconds();
    let secondsIn3Hours = moment.duration(3, 'hours').asSeconds();

    return {
      "breakSeconds": breakSeconds,
      "driveSecondsSplit": (secondsIn11Hours - driveSecondsSplit) > (secondsIn14Hours - shiftDutySecondsSplit) ? (shiftDutySecondsSplit - secondsIn3Hours) : driveSecondsSplit,
      "shiftDutySecondsSplit": shiftDutySecondsSplit,
      "driveSeconds": (secondsIn11Hours - driveSecondsRegular) > (secondsIn14Hours - shiftDutySecondsRegular) ? (shiftDutySecondsRegular - secondsIn3Hours) : driveSecondsRegular,
      "shiftDutySecond": shiftDutySecondsRegular,
      "cycleSeconds": weekDutySeconds
    };
  }
}
