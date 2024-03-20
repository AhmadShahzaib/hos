import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { BaseAbstractHOSStatusEntityCalculation } from './base/BaseAbstractHOSStatusEntityCalculation';
import { BaseHOSStatusEntity } from './base/BaseHOSStatusEntity';
import { LogActionType, MSToTimeReturnType } from './Enums';
import { HOSStatusInMemoryCalculatedStats } from './HOSStatusInMemoryCalculatedStats';
import { DutyType, LogEntry, OnPersonalConveyance as PersonalConveyanceType } from './types';

@Injectable()
export class PersonalConveyance
  extends BaseHOSStatusEntity
  implements BaseAbstractHOSStatusEntityCalculation<PersonalConveyance>
{
  personalConveyanceData: PersonalConveyanceType = {
    counter: 0,
    totalSecondsSpentSoFar: 0,
  };

  constructor(private readonly hOSIMC: HOSStatusInMemoryCalculatedStats) {
    super();
  }

  restoreSelfDataFromInMemoryCalculationInstance = () => {
    let existingData = this.hOSIMC.statusesData.onPersonalConveyance;
    let valuesToRestore = {};

    if (typeof existingData == 'object') {
      valuesToRestore = existingData
    }
    else {
      valuesToRestore = (existingData as any)?.toObject();
    }

    if (valuesToRestore && Object.keys(valuesToRestore).length > 0) {
      Object.assign(this.personalConveyanceData, valuesToRestore);
    }
  };

  saveSelfDataInInMemoryCalculationInstance = () => {
    this.hOSIMC.setStatusesData({
      onPersonalConveyance: this.personalConveyanceData,
    });
  };

  getTotalTimeSpent = () => {
    this.calculate();

    return this.personalConveyanceData.totalSecondsSpentSoFar;
  };

  get totalCounter() {
    return this.personalConveyanceData.counter;
  }

  // /**
  //  * 
  //  * @param date 
  //  * @description called when any other status is activated from any other class
  //  */
  // setLastStartedAt = (date: Date) => {
  //   // by default, the status is personalConveyance so  there will not be any data available in startedAt.
  //   if (!this.personalConveyanceData.startedAt) {
  //     this.personalConveyanceData.startedAt = date;
  //   }

  //   this.personalConveyanceData.lastStartedAt = date;
  // }

  setStatus = (partialData?: Partial<LogEntry>) => {
    const currentDate = moment().unix();
    const dutyStatus: LogActionType = LogActionType.PERSONAL_CONVEYANCE;
    const dutyData: PersonalConveyanceType = partialData?.statusesData?.onPersonalConveyance;

    // Setting current status if not set
    this.hOSIMC.currentStatusInstance = this.hOSIMC.currentStatusInstance ?? {
      actionType: partialData.actionType,
      startedAt: dutyData.startedAt
    };

    const prevLogEntryStatus = this.hOSIMC.createLogEntry(currentDate, dutyStatus, partialData);
    if (prevLogEntryStatus) {
      const currentData = {};
      Object.assign(currentData, this.personalConveyanceData);
      Object.assign(this.personalConveyanceData, prevLogEntryStatus)
      this.calculate();
      Object.assign(this.personalConveyanceData, currentData)
    }

    // this.breakStartedAt = currentDate;

    if (this.hOSIMC.currentDutyStatus != dutyStatus) {
      ++this.personalConveyanceData.counter;
      this.hOSIMC.currentDutyStatus = dutyStatus;
    }

    if (dutyData?.startedAt) {
      this.personalConveyanceData.startedAt = dutyData?.startedAt;
    }

    if (dutyData?.lastStartedAt) {
      this.personalConveyanceData.lastStartedAt = dutyData?.lastStartedAt;
    } else {
      this.personalConveyanceData.lastStartedAt = undefined
      this.personalConveyanceData.totalSecondsSpentSoFar = 0
    }

    if (dutyData?.startedAt && dutyData?.lastStartedAt) {
      this.personalConveyanceData.startedAt = dutyData?.startedAt;
      this.personalConveyanceData.lastStartedAt = dutyData?.lastStartedAt;
    }

    if (partialData?.geoLocation?.latitude && partialData?.geoLocation?.longitude) {
      // this.hOSIMC.secondLastKnownLocation = Object.assign({}, this.hOSIMC.lastKnownLocation);
      this.hOSIMC.lastKnownLocation = Object.assign({}, partialData.geoLocation);
    }

  };

  calculate = () => {
    let dutyEndsAt = this.personalConveyanceData.lastStartedAt;
    if (!dutyEndsAt) {
      // dutyEndsAt = new Date();
      this.saveSelfDataInInMemoryCalculationInstance();
      return;
    }

    this.personalConveyanceData.totalSecondsSpentSoFar = this.personalConveyanceData.lastStartedAt - this.personalConveyanceData.startedAt;
    
    // this.hOSIMC.addTimeInRecapArray(
    //   this.sleeperBerthData.startedAt,
    //   this.sleeperBerthData.totalSecondsSpentSoFar,
    //   'onSleeperBerth',
    // );
    //this.hOSIMC.addTimeInShiftArray(this.personalConveyanceData.lastStartedAt, this.personalConveyanceData.totalSecondsSpentSoFar);

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
