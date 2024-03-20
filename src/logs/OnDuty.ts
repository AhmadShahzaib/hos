import { Injectable } from '@nestjs/common';
import moment from 'moment';
import LogsDocument from 'mongoDb/document/document';
import { BaseAbstractHOSStatusEntityCalculation } from './base/BaseAbstractHOSStatusEntityCalculation';
import { BaseHOSStatusEntity } from './base/BaseHOSStatusEntity';
import { LogActionType, MSToTimeReturnType, StatusKey, ViolationType } from './Enums';
import { HOSStatusInMemoryCalculatedStats } from './HOSStatusInMemoryCalculatedStats';
import { DutyType, GenericStatusTeller, LogEntry, OnDuty as OnDutyType } from './types';

@Injectable()
export class OnDuty
  extends BaseHOSStatusEntity
  implements BaseAbstractHOSStatusEntityCalculation<OnDuty>
{
  onDutyData: OnDutyType = {
    counter: 0,
    totalSecondsSpentSoFar: 0,
  };

  constructor(private readonly hOSIMC: HOSStatusInMemoryCalculatedStats) {
    super();
  }

  restoreSelfDataFromInMemoryCalculationInstance = () => {
    let existingData = this.hOSIMC.statusesData.onDuty;
    let valuesToRestore = {};

    if (typeof existingData == 'object') {
      valuesToRestore = existingData;
    } else {
      valuesToRestore = (existingData as any)?.toObject();
    }

    if (valuesToRestore && Object.keys(valuesToRestore).length > 0) {
      Object.assign(this.onDutyData, valuesToRestore);
    }
  };

  saveSelfDataInInMemoryCalculationInstance = () => {
    this.hOSIMC.setStatusesData({
      onDuty: this.onDutyData,
    });
  };

  /**
   * @Obsolete following function (canResumeDuty) will be deleted in future as it is not required anymore because the flow is completed by setViolations function in HOSIMC
   * @description takes the start of the duty and the current date, get their difference
   * @returns returns true if there is some time left in 14 hours, otherwise false
   */
  canResumeOnDuty = (): boolean => {
    // const secondsSinceDutyStartedAt = this.msToTime(this.onDutyData.startedAt?.getTime() ?? new Date().getTime(), MSToTimeReturnType.Seconds);
    // const secondsTillNow = this.msToTime(new Date().getTime(), MSToTimeReturnType.Seconds);
    const secondsMaxShiftSize = this.hoursToMilliSeconds(14);

    // let differenceTillNoWRTDutyStart = secondsTillNow - secondsSinceDutyStartedAt;

    const totalDutySecondsSpent =
      this.hOSIMC.statusesData?.onDuty?.totalSecondsSpentSoFar ?? 0;
    const totalDriveSecondsSpent =
      this.hOSIMC.statusesData?.onDriving?.totalSecondsSpentSoFar ?? 0;

    return (
      totalDutySecondsSpent + totalDriveSecondsSpent <= secondsMaxShiftSize
    );
  };

  getTotalTimeSpent = () => {
    this.calculate();
    return this.onDutyData.totalSecondsSpentSoFar;
  };

  get totalCounter() {
    return this.onDutyData.counter;
  }

  setStatus = (partialData?: Partial<LogEntry>) => {
    this.hOSIMC.isStarted = true;
    const currentDate = partialData.actionDate
    const dutyStatus: LogActionType =
      LogActionType.ON_DUTY_NOT_DRIVING as LogActionType;
    const dutyData: OnDutyType = partialData.isApproved && partialData.updated ? partialData.updated[0]?.statusesData?.onDuty : partialData?.statusesData?.onDuty;

    // Setting current status if not set
    this.hOSIMC.currentStatusInstance = this.hOSIMC.currentStatusInstance ?? {
      actionDate: partialData.actionDate,
      actionType: partialData.actionType,
      startedAt: dutyData.startedAt
    };    
    this.hOSIMC.currentStatusInstance.actionDate = partialData.actionDate;

    // Setting shift start time if shift has not started yet.
    this.hOSIMC.shiftStartDateTime = this.hOSIMC.shiftStartDateTime
      ? this.hOSIMC.shiftStartDateTime
      : partialData.actionDate;

    // Setting violations if any.
    //this.hOSIMC.setViolations(this, partialData);
    //partialData.isViolation = partialData?.violations?.length > 0;

    const prevLogEntryStatus = this.hOSIMC.createLogEntry(currentDate, dutyStatus, partialData);

    if (prevLogEntryStatus) {
      const currentData = {};
      const currentStatusesInstance = {};
      Object.assign(currentStatusesInstance, this.hOSIMC.currentStatusInstance);
      
      Object.assign(currentData, this.onDutyData);
      Object.assign(this.onDutyData, prevLogEntryStatus);
      this.hOSIMC.currentStatusInstance = {
        ...this.hOSIMC.currentStatusInstance,
        'actionDate': prevLogEntryStatus.lastStartedAt,
        'lastStartedAt': prevLogEntryStatus.lastStartedAt
      };
      this.calculate();
      Object.assign(this.onDutyData, currentData);
      
      this.hOSIMC.currentStatusInstance = { ...currentStatusesInstance };
      this.onDutyData.startedAt = prevLogEntryStatus.lastStartedAt;
      this.hOSIMC.currentStatusInstance.startedAt = prevLogEntryStatus.lastStartedAt;
    }

    if (this.hOSIMC.currentDutyStatus != dutyStatus) {
      ++this.onDutyData.counter;
      this.hOSIMC.currentDutyStatus = dutyStatus;
      this.hOSIMC.currentStatusInstance.actionType = dutyStatus;
      /* ALI */
      this.hOSIMC.checkPotentialQP(true);
    }


    if (dutyData?.startedAt) {
      this.onDutyData.startedAt = dutyData?.startedAt;
    }

    if (dutyData?.lastStartedAt) {
      this.onDutyData.lastStartedAt = dutyData?.lastStartedAt;
    } else {
      this.onDutyData.lastStartedAt = undefined;
      this.onDutyData.totalSecondsSpentSoFar = 0;
    }

    if (dutyData?.startedAt && dutyData?.lastStartedAt) {
      this.onDutyData.startedAt = dutyData.startedAt;
      this.onDutyData.lastStartedAt = dutyData.lastStartedAt;
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
    const secondsIn30Minutes = this.msToTime(this.hoursToMilliSeconds(0.5), MSToTimeReturnType.Seconds);
    if(this.hOSIMC.continuousNonDriveTime + (partialData.actionDate - this.onDutyData.startedAt) >= secondsIn30Minutes){
      (this.hOSIMC.continuousDriveTime = 0);
    }
      
  };

  // setLastStartedAt = (date: Date) => {
  //   this.onDutyData.lastStartedAt = date;
  // }

  calculate = () => {
    /**
     * current status may still be on duty, if so, lets consider that the current on duty has ended but not assign this date to onDutyData
     * because it will be saved in the db otherwise.
     */
    
    let dutyEndsAt = this.onDutyData.lastStartedAt;
    if (!dutyEndsAt) {
      this.saveSelfDataInInMemoryCalculationInstance();
      return;
    }

    /** 
     * Status Changes and the required Steps to be taked
    **/


    // Calculate time spent in current status
    this.onDutyData.totalSecondsSpentSoFar =
      this.onDutyData.lastStartedAt - this.onDutyData.startedAt;
    this.hOSIMC.continuousNonDriveTime += this.onDutyData.totalSecondsSpentSoFar;

    // Update stats in HOS-IMC 
    this.saveSelfDataInInMemoryCalculationInstance();

    // Push the data to the recap/shift/ array
    this.hOSIMC.addTimeInRecapArray(
      this.onDutyData.startedAt,
      this.onDutyData.totalSecondsSpentSoFar,
      'onDuty',
    );
    this.hOSIMC.addTimeInShiftArray(this.onDutyData.lastStartedAt, this.onDutyData.totalSecondsSpentSoFar);
  };

  calculateForLiveData = (partialData?: DutyType) => {
    let totalTimeSpent = partialData.totalSecondsSpentSoFar;
    if (!partialData.lastStartedAt) {
      totalTimeSpent += moment().unix() - partialData.startedAt;
    }
    return { ...partialData, totalSecondsSpentSoFar: totalTimeSpent };
  };
}
