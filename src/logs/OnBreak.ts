import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { BaseAbstractHOSStatusEntityCalculation } from './base/BaseAbstractHOSStatusEntityCalculation';
import { BaseHOSStatusEntity } from './base/BaseHOSStatusEntity';
import { LogActionType, MSToTimeReturnType } from './Enums';
import { HOSStatusInMemoryCalculatedStats } from './HOSStatusInMemoryCalculatedStats';
import { LogEntry, OnBreak as OnBreakType, PartialStatusesType } from './types';

/**
 * @description This class is being used to track last 30 minutes break, this is internal to backend. 
 */
@Injectable()
export class OnBreak
  extends BaseHOSStatusEntity
  implements BaseAbstractHOSStatusEntityCalculation<OnBreak>
{
  initialBreakData = {
    counter: 0,
    totalSecondsSpentSoFar: 0,
    is30OrMoreMinutesHasBeen: false
  };

  onBreakData: OnBreakType = this.initialBreakData;

  constructor(private readonly hOSIMC: HOSStatusInMemoryCalculatedStats) {
    super();
  }

  resetBreakData = () => (this.onBreakData = { ...this.initialBreakData });

  getTotalTimeSpent = () => {
    throw new Error("Method not implemented")
  };

  /**
   * set 30 mins break start and end time 
   * @param driverId id of the driver for which status is being set
   * @param partialData status data
   * @rule The 30-minute break required by § 395.3(a)(3)(ii) may be taken either on duty, off duty, or in the sleeper berth. 
   */
  setStatus = (partialData?: Partial<LogEntry>) => {
    let { statusesData } = partialData ?? {};


    let breakStartsAt = statusesData?.offDuty?.startedAt ?? statusesData?.onSleeperBerth?.startedAt ?? statusesData?.onDuty?.startedAt;
    if (breakStartsAt) {
      this.onBreakData.startedAt = breakStartsAt;
    }

    // break ends at when the driver goes on onDutyNotDriving or starts driving 
    let breakEndsAt = statusesData?.offDuty?.lastStartedAt ?? statusesData?.onSleeperBerth?.lastStartedAt ?? statusesData?.onDuty?.lastStartedAt;
    if (breakEndsAt && breakStartsAt <= breakEndsAt) {
      this.onBreakData.lastStartedAt = breakEndsAt;
    }

    if (partialData?.geoLocation?.latitude && partialData?.geoLocation?.longitude) {
      // this.hOSIMC.secondLastKnownLocation = Object.assign({}, this.hOSIMC.lastKnownLocation);
      this.hOSIMC.lastKnownLocation = Object.assign({}, partialData.geoLocation);
    }

  }

  restoreSelfDataFromInMemoryCalculationInstance = () => {
    let existingData = this.hOSIMC.statusesData.onBreak;
    let valuesToRestore = {};

    if (typeof existingData == 'object') {
      valuesToRestore = existingData
    }
    else {
      valuesToRestore = (existingData as any)?.toObject();
    }

    if (valuesToRestore && Object.keys(valuesToRestore).length > 0) {
      Object.assign(this.onBreakData, valuesToRestore);
    }
  };

  saveSelfDataInInMemoryCalculationInstance = () => {
    this.hOSIMC.setStatusesData({
      onBreak: this.onBreakData,
    });
  };

  get is30MinsBreakSatisfied() {
    this.calculate();
    return this.onBreakData.is30OrMoreMinutesHasBeen;
  }

  calculate = () => {
    if (!this.onBreakData.lastStartedAt) return;

    // this.onBreakData.lastStartedAt = new Date();

    // const timeDiffInMilliSeconds = this.dateDiffInMs(
    //   this.onBreakData.startedAt as Date,
    //   this.onBreakData.lastStartedAt as Date,
    // );

    this.onBreakData.totalSecondsSpentSoFar = this.onBreakData.lastStartedAt - this.onBreakData.startedAt;

    const secondsIn30Minutes = this.msToTime(this.hoursToMilliSeconds(0.5), MSToTimeReturnType.Seconds);

    this.onBreakData.is30OrMoreMinutesHasBeen = this.onBreakData.totalSecondsSpentSoFar >= secondsIn30Minutes

    if (this.onBreakData.is30OrMoreMinutesHasBeen) {
      this.hOSIMC.totalDriveTimeInSeconds = 0;
    }

    this.saveSelfDataInInMemoryCalculationInstance();
  };
}
