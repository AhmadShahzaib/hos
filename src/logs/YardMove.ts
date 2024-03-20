import { Injectable } from '@nestjs/common';
import moment from 'moment';
import LogsDocument from 'mongoDb/document/document';
import { BaseAbstractHOSStatusEntityCalculation } from './base/BaseAbstractHOSStatusEntityCalculation';
import { BaseHOSStatusEntity } from './base/BaseHOSStatusEntity';
import { LogActionType, MSToTimeReturnType, ViolationType } from './Enums';
import { HOSStatusInMemoryCalculatedStats } from './HOSStatusInMemoryCalculatedStats';
import { DutyType, LogEntry, OnYardMove as YardMoveType } from './types';

@Injectable()
export class YardMove
  extends BaseHOSStatusEntity
  implements BaseAbstractHOSStatusEntityCalculation<YardMove>
{
  onYardMoveData: YardMoveType = {
    counter: 0,
    totalSecondsSpentSoFar: 0,
  };

  constructor(private readonly hOSIMC: HOSStatusInMemoryCalculatedStats) {
    super();
  }

  restoreSelfDataFromInMemoryCalculationInstance = () => {
    let existingData = this.hOSIMC.statusesData.onYardMove;
    let valuesToRestore = {};

    if (typeof existingData == 'object') {
      valuesToRestore = existingData;
    } else {
      valuesToRestore = (existingData as any)?.toObject();
    }

    if (valuesToRestore && Object.keys(valuesToRestore).length > 0) {
      Object.assign(this.onYardMoveData, valuesToRestore);
    }
  };

  saveSelfDataInInMemoryCalculationInstance = () => {
    this.hOSIMC.setStatusesData({
      onYardMove: this.onYardMoveData,
    });
  };

  /**
   * @Obsolete following function (canResumeDuty) will be deleted in future as it is not required anymore because the flow is completed by setViolations function in HOSIMC
   * @description takes the start of the duty and the current date, get their difference
   * @returns returns true if there is some time left in 14 hours, otherwise false
   */
  canResumeYardMove = (): boolean => {
    // const secondsSinceDutyStartedAt = this.msToTime(this.onYardMoveData.startedAt?.getTime() ?? new Date().getTime(), MSToTimeReturnType.Seconds);
    // const secondsTillNow = this.msToTime(new Date().getTime(), MSToTimeReturnType.Seconds);
    const secondsMaxShiftSize = this.hoursToMilliSeconds(14);

    // let differenceTillNoWRTDutyStart = secondsTillNow - secondsSinceDutyStartedAt;

    const totalDutySecondsSpent =
      this.hOSIMC.statusesData?.onYardMove?.totalSecondsSpentSoFar ?? 0;
    const totalDriveSecondsSpent =
      this.hOSIMC.statusesData?.onDriving?.totalSecondsSpentSoFar ?? 0;

    return (
      totalDutySecondsSpent + totalDriveSecondsSpent <= secondsMaxShiftSize
    );
  };

  getTotalTimeSpent = () => {
    this.calculate();
    return this.onYardMoveData.totalSecondsSpentSoFar;
  };

  get totalCounter() {
    return this.onYardMoveData.counter;
  }

  setStatus = (partialData?: Partial<LogEntry>) => {
    const currentDate = moment().unix();
    const dutyStatus: LogActionType =
      LogActionType.YARD_MOVE as LogActionType;
    const dutyData: YardMoveType = partialData?.statusesData?.onYardMove;
  
    // Setting shift start time if shift has not started yet.
    this.hOSIMC.shiftStartDateTime = this.hOSIMC.shiftStartDateTime
      ? this.hOSIMC.shiftStartDateTime
      : moment(partialData.actionDate).unix();

    // Setting violations if any.
    this.hOSIMC.setViolations(this, partialData);
    partialData.isViolation = partialData?.violations?.length > 0;

    const prevLogEntryStatus = this.hOSIMC.createLogEntry(currentDate, dutyStatus, partialData);
    if (prevLogEntryStatus) {
      const currentData = {};
      Object.assign(currentData, this.onYardMoveData);
      Object.assign(this.onYardMoveData, prevLogEntryStatus)
      this.calculate();
      Object.assign(this.onYardMoveData, currentData)
    }

    if (this.hOSIMC.currentDutyStatus != dutyStatus) {
      ++this.onYardMoveData.counter;
      this.hOSIMC.currentDutyStatus = dutyStatus;
    }

    if (dutyData?.startedAt) {
      this.onYardMoveData.startedAt = dutyData?.startedAt;
    }

    if (dutyData?.lastStartedAt) {
      this.onYardMoveData.lastStartedAt = dutyData?.lastStartedAt;
    } else {
      this.onYardMoveData.lastStartedAt = undefined;
      this.onYardMoveData.totalSecondsSpentSoFar = 0;
    }

    if (dutyData?.startedAt && dutyData?.lastStartedAt) {
      this.onYardMoveData.startedAt = dutyData.startedAt;
      this.onYardMoveData.lastStartedAt = dutyData.lastStartedAt;
    }

    if (
      partialData?.geoLocation?.latitude &&
      partialData?.geoLocation?.longitude
    ) {
      // this.hOSIMC.secondLastKnownLocation = Object.assign({}, this.hOSIMC.lastKnownLocation);
      this.hOSIMC.lastKnownLocation = Object.assign(
        {},
        partialData.geoLocation,
      );
    }
  };

  // setLastStartedAt = (date: Date) => {
  //   this.onYardMoveData.lastStartedAt = date;
  // }

  calculate = () => {
    /**
     * current status may still be on duty, if so, lets consider that the current on duty has ended but not assign this date to onYardMoveData
     * because it will be saved in the db otherwise.
     */
    let dutyEndsAt = this.onYardMoveData.lastStartedAt;
    if (!dutyEndsAt) {
      // dutyEndsAt = new Date();
      this.saveSelfDataInInMemoryCalculationInstance();
      return;
    }

    this.onYardMoveData.totalSecondsSpentSoFar = this.onYardMoveData.lastStartedAt - this.onYardMoveData.startedAt;

    this.saveSelfDataInInMemoryCalculationInstance();
  };

  calculateForLiveData = (partialData?: DutyType) => {
    let totalTimeSpent = partialData.totalSecondsSpentSoFar
    if (!partialData.lastStartedAt) {
      totalTimeSpent += moment().unix() - partialData.startedAt
    }
    return { ...partialData, totalSecondsSpentSoFar: totalTimeSpent }
  };
}
