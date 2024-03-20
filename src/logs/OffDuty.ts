import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { BaseAbstractHOSStatusEntityCalculation } from './base/BaseAbstractHOSStatusEntityCalculation';
import { BaseHOSStatusEntity } from './base/BaseHOSStatusEntity';
import { LogActionType, MSToTimeReturnType } from './Enums';
import { HOSStatusInMemoryCalculatedStats } from './HOSStatusInMemoryCalculatedStats';
import { DutyType, LogEntry, OffDuty as OffDutyType } from './types';

@Injectable()
export class OffDuty
  extends BaseHOSStatusEntity
  implements BaseAbstractHOSStatusEntityCalculation<OffDuty>
{
  offDutyData: OffDutyType = {
    counter: 0,
    totalSecondsSpentSoFar: 0,
    isMinimumOffForResetSatisfied: false
  };

  constructor(private readonly hOSIMC: HOSStatusInMemoryCalculatedStats) {
    super();
  }

  restoreSelfDataFromInMemoryCalculationInstance = () => {
    let existingData = this.hOSIMC.statusesData.offDuty;
    let valuesToRestore = {};

    if (typeof existingData == 'object') {
      valuesToRestore = existingData;
    } else {
      valuesToRestore = (existingData as any)?.toObject();
    }

    if (valuesToRestore && Object.keys(valuesToRestore).length > 0) {
      Object.assign(this.offDutyData, valuesToRestore);
    }
  };

  saveSelfDataInInMemoryCalculationInstance = () => {
    this.hOSIMC.setStatusesData({
      offDuty: this.offDutyData,
    });
  };

  getTotalTimeSpent = () => {
    this.calculate();
    return this.offDutyData.totalSecondsSpentSoFar;
  };

  get totalCounter() {
    return this.offDutyData.counter;
  }

  // /**
  //  *
  //  * @param date
  //  * @description called when any other status is activated from any other class
  //  */
  // setLastStartedAt = (date: Date) => {
  //   // by default, the status is offDuty so  there will not be any data available in startedAt.
  //   if (!this.offDutyData.startedAt) {
  //     this.offDutyData.startedAt = date;
  //   }

  //   this.offDutyData.lastStartedAt = date;63dd139a639bbd2d08b14f87
  // }

  setStatus = (partialData?: Partial<LogEntry>) => {
    const currentDate = partialData.actionDate
    const dutyStatus: LogActionType = LogActionType.OFF_DUTY;
    const dutyData: OffDutyType = partialData.isApproved && partialData.updated ? partialData.updated[0]?.statusesData?.offDuty : partialData?.statusesData?.offDuty;

    // Setting current status if not set
    this.hOSIMC.currentStatusInstance = this.hOSIMC.currentStatusInstance ?? {
      actionDate: partialData.actionDate,
      actionType: partialData.actionType,
      startedAt: dutyData.startedAt
    };
    
    this.hOSIMC.currentStatusInstance.actionDate = partialData.actionDate;
    
    const prevLogEntryStatus = this.hOSIMC.createLogEntry(currentDate, dutyStatus, partialData);
    if (prevLogEntryStatus) {
      const currentData = {};
      const currentStatusesInstance = {};
      Object.assign(currentStatusesInstance, this.hOSIMC.currentStatusInstance);
      Object.assign(currentData, this.offDutyData);
      Object.assign(this.offDutyData, prevLogEntryStatus)
      this.hOSIMC.currentStatusInstance = {
        ...this.hOSIMC.currentStatusInstance,
        'actionDate': prevLogEntryStatus.lastStartedAt,
        'lastStartedAt': prevLogEntryStatus.lastStartedAt
      }
      this.calculate();
      Object.assign(this.offDutyData, currentData);
      
      this.hOSIMC.currentStatusInstance = { ...currentStatusesInstance };
      this.offDutyData.startedAt = prevLogEntryStatus.lastStartedAt;
      this.hOSIMC.currentStatusInstance.startedAt = prevLogEntryStatus.lastStartedAt;
    }


    if (this.hOSIMC.currentDutyStatus != dutyStatus) {
      if (this.hOSIMC.currentDutyStatus !== LogActionType.SLEEPER_BERTH) {
        this.hOSIMC.continuousOffTimeInSeconds = 0;
      }
      ++this.offDutyData.counter;
      this.hOSIMC.currentDutyStatus = dutyStatus;
    }

    if (dutyData?.startedAt) {
      this.offDutyData.startedAt = dutyData?.startedAt;
    }

    if (dutyData?.lastStartedAt) {
      this.offDutyData.lastStartedAt = dutyData?.lastStartedAt;
    } else {
      this.offDutyData.lastStartedAt = undefined;
      this.offDutyData.totalSecondsSpentSoFar = 0;
    }

    if (dutyData?.startedAt && dutyData?.lastStartedAt) {
      this.offDutyData.startedAt = dutyData?.startedAt;
      this.offDutyData.lastStartedAt = dutyData?.lastStartedAt;
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
    if(this.hOSIMC.continuousNonDriveTime + (partialData.actionDate - this.offDutyData.startedAt) >= secondsIn30Minutes) {
      (this.hOSIMC.continuousDriveTime = 0);
    }
  };

  calculate = (partialData?: Partial<LogEntry>) => {

    let dutyEndsAt = this.offDutyData.lastStartedAt || moment().unix();
    if (!dutyEndsAt) {
      // dutyEndsAt = new Date();
      this.saveSelfDataInInMemoryCalculationInstance();
      return;
    }

    // this.hOSIMC.updateSplitConditions(partialData);
    this.offDutyData.totalSecondsSpentSoFar = dutyEndsAt - this.offDutyData.startedAt
    this.hOSIMC.continuousOffTimeInSeconds += this.offDutyData.totalSecondsSpentSoFar;
    this.hOSIMC.continuousNonDriveTime += this.offDutyData.totalSecondsSpentSoFar;
    const secondsIn2Hours = this.msToTime(this.hoursToMilliSeconds(2), MSToTimeReturnType.Seconds);
    this.offDutyData.isMinimumOffForResetSatisfied = this.offDutyData.totalSecondsSpentSoFar > secondsIn2Hours

    if (this.offDutyData.isMinimumOffForResetSatisfied)
      this.offDutyData.qualifyingTimeSpentInSeconds = this.offDutyData.totalSecondsSpentSoFar

    this.saveSelfDataInInMemoryCalculationInstance();
    this.hOSIMC.addTimeInRecapArray(
      this.offDutyData.startedAt,
      this.offDutyData.totalSecondsSpentSoFar,
      'offDuty'
    );

    /* ALI */
    //Add time to shift array
    if (this.hOSIMC.isStarted) {
      this.hOSIMC.addTimeInShiftArray(this.offDutyData.lastStartedAt, this.offDutyData.totalSecondsSpentSoFar);
      // Add time to potential QP
      this.hOSIMC.isPotentialSatisfied ?
        this.hOSIMC.qualifyingPeriod.push(this.hOSIMC.shiftRecap.length - 1) :
        this.hOSIMC.potentialQualifyingPeriod.push(this.hOSIMC.shiftRecap.length - 1)
      this.hOSIMC.checkPotentialQP();

      this.hOSIMC.checkSplitConditions();
      this.hOSIMC.checkResetConditions(this.offDutyData.lastStartedAt)
      this.hOSIMC.check34hResetConditions(this.offDutyData.lastStartedAt)
    }
    else{
      this.hOSIMC.currentStatusInstance = undefined;
    }
  };

  calculateForLiveData = (partialData?: DutyType) => {
    let totalTimeSpent = partialData.totalSecondsSpentSoFar;
    if (!partialData.lastStartedAt) {
      totalTimeSpent += moment().unix() - partialData.startedAt;
    }
    return { ...partialData, totalSecondsSpentSoFar: totalTimeSpent };
  };
}
