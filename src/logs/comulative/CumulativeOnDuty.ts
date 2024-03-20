import { Injectable } from '@nestjs/common';
import LogsDocument from 'mongoDb/document/document';
import { BaseAbstractHOSStatusEntityCalculation } from '../base/BaseAbstractHOSStatusEntityCalculation';
import { BaseHOSStatusEntity } from '../base/BaseHOSStatusEntity';
import { LogActionType, MSToTimeReturnType } from '../Enums';
import { HOSStatusInMemoryCalculatedStats } from '../HOSStatusInMemoryCalculatedStats';
import { LogEntry, OnDuty as OnDutyType } from '../types';

@Injectable()
export class CumulativeOnDuty
  extends BaseHOSStatusEntity {
  onDutyData: OnDutyType = {
    counter: 0,
    totalSecondsSpentSoFar: 0
  }

  constructor(private readonly hOSIMC: HOSStatusInMemoryCalculatedStats) {
    super();
  }

  restoreSelfDataFromInMemoryCalculationInstance = () => {
    const valuesToRestore = this.hOSIMC.statusesData.onDuty;
    Object.assign(this.onDutyData, valuesToRestore);
  };

  saveSelfDataInInMemoryCalculationInstance = () => {
    this.hOSIMC.setStatusesData({
      onDuty: this.onDutyData
    });
  };




}
