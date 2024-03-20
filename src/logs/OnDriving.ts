import { Inject, Injectable } from '@nestjs/common';
import { AppService } from 'services/app.service';
import { BaseAbstractHOSStatusEntityCalculation } from './base/BaseAbstractHOSStatusEntityCalculation';
import { BaseHOSStatusEntity } from './base/BaseHOSStatusEntity';
import { LogActionType, MSToTimeReturnType, ViolationType } from './Enums';
import { HOSStatusInMemoryCalculatedStats } from './HOSStatusInMemoryCalculatedStats';
import { OnBreak } from './OnBreak';
import { DutyType, LogEntry, OnDriving as OnDrivingType } from './types';
import { Document, Schema } from 'mongoose';
import moment from 'moment';

@Injectable()
export class OnDriving
  extends BaseHOSStatusEntity
  implements BaseAbstractHOSStatusEntityCalculation<OnDriving>
{
  onDrivingData: OnDrivingType = {
    counter: 0,
    totalSecondsSpentSoFar: 0,
  };

  constructor(
    private readonly hOSIMC: HOSStatusInMemoryCalculatedStats,
    private readonly resetBreakData: Function,
    private readonly canResumeDuty: Function, // @Obsolete Will remove this injection in near future.,
  ) {
    super();
  }

  restoreSelfDataFromInMemoryCalculationInstance = () => {
    let existingData = this.hOSIMC.statusesData.onDriving;
    let valuesToRestore = {};

    if (typeof existingData == 'object') {
      valuesToRestore = existingData;
    } else {
      valuesToRestore = (existingData as any)?.toObject();
    }

    if (valuesToRestore && Object.keys(valuesToRestore).length > 0) {
      Object.assign(this.onDrivingData, valuesToRestore);
    }
  };

  saveSelfDataInInMemoryCalculationInstance = () => {
    this.hOSIMC.setStatusesData({
      onDriving: this.onDrivingData,
    });
  };

  getTotalTimeSpent = () => {
    this.calculate();

    // return this.totalDrivingSecondsSpentSoFar;
    return this.hOSIMC.totalDriveTimeInSeconds;
  };

  getTotalCounter = () => this.onDrivingData.counter;

  setStatus = (partialData?: Partial<LogEntry>) => {
    this.hOSIMC.isStarted = true;
    //Set continuous non-driving seconds to 0
    this.hOSIMC.continuousNonDriveTime = 0;
    // TODO: currently on duty or duty hours are left
    // const canResumeDrive = this.canResumeDrive(driverId);
    const dutyStatus: LogActionType = LogActionType.DRIVING;
    const dutyData: OnDrivingType = partialData?.statusesData?.onDriving;

    // Setting current status
    this.hOSIMC.currentStatusInstance =  this.hOSIMC.currentStatusInstance ?? {
      actionDate: partialData.actionDate,
      actionType: partialData.actionType,
      startedAt: dutyData.startedAt
    };
    this.hOSIMC.currentStatusInstance.actionDate = partialData.actionDate;


    this.hOSIMC.setViolations(this, partialData);
    partialData.isViolation = partialData?.violations?.length > 0;
    const currentDate = partialData.actionDate
    const prevLogEntryStatus = this.hOSIMC.createLogEntry(currentDate, dutyStatus, partialData);
    if (prevLogEntryStatus) {
      const currentData = {};
      const currentStatusesInstance = {};
      Object.assign(currentStatusesInstance, this.hOSIMC.currentStatusInstance);
      Object.assign(currentData, this.onDrivingData);
      Object.assign(this.onDrivingData, prevLogEntryStatus)
      this.hOSIMC.currentStatusInstance = {
        ...this.hOSIMC.currentStatusInstance,
        'actionDate': prevLogEntryStatus.lastStartedAt,
        'lastStartedAt': prevLogEntryStatus.lastStartedAt
      }

      this.calculate(partialData);
      Object.assign(this.onDrivingData, currentData)

      this.hOSIMC.currentStatusInstance = { ...currentStatusesInstance };
      this.onDrivingData.startedAt = prevLogEntryStatus.lastStartedAt;
      this.hOSIMC.currentStatusInstance.startedAt = prevLogEntryStatus.lastStartedAt;
    }

    if (this.hOSIMC.currentDutyStatus != dutyStatus) {
      ++this.onDrivingData.counter;
      this.hOSIMC.currentDutyStatus = dutyStatus;
      /* ALI */
      this.hOSIMC.checkPotentialQP(true);

    }

    if (dutyData?.startedAt) {
      this.onDrivingData.startedAt = dutyData?.startedAt;
    }

    if (dutyData?.lastStartedAt) {
      this.onDrivingData.lastStartedAt = dutyData?.lastStartedAt;
    } else {
      this.onDrivingData.lastStartedAt = undefined;
      this.onDrivingData.totalSecondsSpentSoFar = 0;
    }

    // if (dutyData?.startedAt && dutyData?.lastStartedAt) {
    //   this.onDrivingData.startedAt = dutyData.startedAt;
    //   this.onDrivingData.lastStartedAt = dutyData.lastStartedAt;
    // }

    if (
      partialData?.geoLocation?.latitude &&
      partialData?.geoLocation?.longitude
    ) {
      this.hOSIMC.secondLastKnownLocation = Object.assign(
        {},
        this.hOSIMC.lastKnownLocation,
      );
      this.hOSIMC.lastKnownLocation = Object.assign(
        {},
        partialData.geoLocation,
      );
    }
  };

  calculate = (partialData?: Partial<LogEntry>) => {
    let driveEndsAt = this.onDrivingData.lastStartedAt;
    if (!driveEndsAt) {
      // dutyEndsAt = new Date();  
      this.saveSelfDataInInMemoryCalculationInstance();
      return;
    }


    this.onDrivingData.totalSecondsSpentSoFar =
      this.onDrivingData.lastStartedAt - this.onDrivingData.startedAt;

    this.hOSIMC.continuousDriveTime += this.onDrivingData.totalSecondsSpentSoFar;

    this.saveSelfDataInInMemoryCalculationInstance();
    this.hOSIMC.addTimeInRecapArray(
      this.onDrivingData.startedAt,
      this.onDrivingData.totalSecondsSpentSoFar,
      'onDriving',
    );
    this.hOSIMC.addTimeInShiftArray(this.onDrivingData.lastStartedAt, this.onDrivingData.totalSecondsSpentSoFar);
  };

  calculateForLiveData = (partialData?: DutyType) => {
    let totalTimeSpent = partialData.totalSecondsSpentSoFar;
    if (!partialData.lastStartedAt) {
      totalTimeSpent += moment().unix() - partialData.startedAt;
    }
    return { ...partialData, totalSecondsSpentSoFar: totalTimeSpent };
  };
}
