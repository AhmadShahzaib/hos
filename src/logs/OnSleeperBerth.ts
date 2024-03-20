import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { BaseAbstractHOSStatusEntityCalculation } from './base/BaseAbstractHOSStatusEntityCalculation';
import { BaseHOSStatusEntity } from './base/BaseHOSStatusEntity';
import { LogActionType, MSToTimeReturnType, StatusKey } from './Enums';
import { HOSStatusInMemoryCalculatedStats } from './HOSStatusInMemoryCalculatedStats';
import {
  DutyType,
  LogEntry,
  OnSleeperBerth as SleeperBerthType,
} from './types';

@Injectable()
export class onSleeperBerth
  extends BaseHOSStatusEntity
  implements BaseAbstractHOSStatusEntityCalculation<onSleeperBerth>
{
  sleeperBerthData: SleeperBerthType = {
    counter: 0,
    totalSecondsSpentSoFar: 0,
    isMinimumSleeperSatisfied: false,
  };

  constructor(private readonly hOSIMC: HOSStatusInMemoryCalculatedStats) {
    super();
  }

  restoreSelfDataFromInMemoryCalculationInstance = () => {
    let existingData = this.hOSIMC.statusesData.onSleeperBerth;
    let valuesToRestore = {};

    if (typeof existingData == 'object') {
      valuesToRestore = existingData;
    } else {
      valuesToRestore = (existingData as any)?.toObject();
    }

    if (valuesToRestore && Object.keys(valuesToRestore).length > 0) {
      Object.assign(this.sleeperBerthData, valuesToRestore);
    }
  };

  saveSelfDataInInMemoryCalculationInstance = () => {
    this.hOSIMC.setStatusesData({
      onSleeperBerth: this.sleeperBerthData,
    });
  };

  getTotalTimeSpent = () => {
    this.calculate();
    return this.sleeperBerthData.totalSecondsSpentSoFar;
  };

  get totalCounter() {
    return this.sleeperBerthData.counter;
  }

  setStatus = (partialData?: Partial<LogEntry>) => {
    this.hOSIMC.isStarted = true;
    //Set continuous non-driving seconds to 0
    const dutyStatus: LogActionType =
      LogActionType.SLEEPER_BERTH as LogActionType;
    const dutyData: SleeperBerthType =
      partialData?.statusesData?.onSleeperBerth;

    // Setting current status if not set
    this.hOSIMC.currentStatusInstance = this.hOSIMC.currentStatusInstance ?? {
      actionDate: partialData.actionDate,
      actionType: partialData.actionType,
      startedAt: dutyData.startedAt
    };
    this.hOSIMC.currentStatusInstance.actionDate = partialData.actionDate;
    

    const currentDate = partialData.actionDate
    const prevLogEntryStatus = this.hOSIMC.createLogEntry(currentDate, dutyStatus, partialData);
    if (prevLogEntryStatus) {
      const currentData = {};
      const currentStatusesInstance = {};
      Object.assign(currentStatusesInstance, this.hOSIMC.currentStatusInstance);
      
      Object.assign(currentData, this.sleeperBerthData);
      Object.assign(this.sleeperBerthData, prevLogEntryStatus);
      this.hOSIMC.currentStatusInstance = {
        ...this.hOSIMC.currentStatusInstance,
        'actionDate': prevLogEntryStatus.lastStartedAt,
        'lastStartedAt': prevLogEntryStatus.lastStartedAt
      };
      this.calculate();
      Object.assign(this.sleeperBerthData, currentData);
      
      this.hOSIMC.currentStatusInstance = { ...currentStatusesInstance };
      this.sleeperBerthData.startedAt = prevLogEntryStatus.lastStartedAt;
      this.hOSIMC.currentStatusInstance.startedAt = prevLogEntryStatus.lastStartedAt;
    }

    // this.breakStartedAt = currentDate;
    if (this.hOSIMC.currentDutyStatus != dutyStatus) {
      if (this.hOSIMC.currentDutyStatus !== LogActionType.OFF_DUTY) {
        this.hOSIMC.continuousOffTimeInSeconds = 0
      }
      ++this.sleeperBerthData.counter;
      this.hOSIMC.currentDutyStatus = dutyStatus;
    }

    if (dutyData?.startedAt) {
      this.sleeperBerthData.startedAt = dutyData?.startedAt;
    }

    if (dutyData?.lastStartedAt) {
      this.sleeperBerthData.lastStartedAt = dutyData?.lastStartedAt;
    } else {
      this.sleeperBerthData.lastStartedAt = undefined;
      this.sleeperBerthData.totalSecondsSpentSoFar = 0;
    }

    if (dutyData?.startedAt && dutyData?.lastStartedAt) {
      this.sleeperBerthData.startedAt = dutyData.startedAt;
      this.sleeperBerthData.lastStartedAt = dutyData.lastStartedAt;
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
    if(this.hOSIMC.continuousNonDriveTime + (partialData.actionDate - this.sleeperBerthData.startedAt) >= secondsIn30Minutes){
      (this.hOSIMC.continuousDriveTime = 0);
    }
  };

  calculate = (partialData?: Partial<LogEntry>) => {
    //Update split conditions
    let sleeperBerthEndsAt = this.sleeperBerthData.lastStartedAt;
    if (!sleeperBerthEndsAt) {
      // dutyEndsAt = new Date();
      this.saveSelfDataInInMemoryCalculationInstance();
      return;
    }

    // this.hOSIMC.updateSplitConditions(partialData);

    this.sleeperBerthData.totalSecondsSpentSoFar =
      this.sleeperBerthData.lastStartedAt - this.sleeperBerthData.startedAt;
    this.hOSIMC.continuousNonDriveTime += this.sleeperBerthData.totalSecondsSpentSoFar;
    const secondsIn7Hours = this.msToTime(
      this.hoursToMilliSeconds(7),
      MSToTimeReturnType.Seconds,
    );


    this.sleeperBerthData.isMinimumSleeperSatisfied =
      this.sleeperBerthData.totalSecondsSpentSoFar >= secondsIn7Hours;
    this.hOSIMC.continuousOffTimeInSeconds +=
      this.sleeperBerthData.totalSecondsSpentSoFar;

    this.saveSelfDataInInMemoryCalculationInstance();
    this.hOSIMC.addTimeInRecapArray(
      this.sleeperBerthData.startedAt,
      this.sleeperBerthData.totalSecondsSpentSoFar,
      'onSleeperBerth',
    );

    /* ALI */
    if (this.hOSIMC.isStarted) {
      // Push time to shift array
      this.hOSIMC.addTimeInShiftArray(this.sleeperBerthData.lastStartedAt, this.sleeperBerthData.totalSecondsSpentSoFar);
      // Add time to potential QP
      this.hOSIMC.isPotentialSatisfied ?
        this.hOSIMC.qualifyingPeriod.push(this.hOSIMC.shiftRecap.length - 1) :
        this.hOSIMC.potentialQualifyingPeriod.push(this.hOSIMC.shiftRecap.length - 1)
      this.hOSIMC.checkPotentialQP();

      this.hOSIMC.checkSplitConditions();
      this.hOSIMC.checkResetConditions(this.sleeperBerthData.lastStartedAt)
      this.hOSIMC.check34hResetConditions(this.sleeperBerthData.lastStartedAt)
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
