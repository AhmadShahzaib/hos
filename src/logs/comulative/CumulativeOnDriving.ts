import { Inject, Injectable } from '@nestjs/common';
import { AppService } from 'services/app.service';
import { BaseAbstractHOSStatusEntityCalculation } from '../base/BaseAbstractHOSStatusEntityCalculation';
import { BaseHOSStatusEntity } from '../base/BaseHOSStatusEntity';
import { LogActionType, MSToTimeReturnType } from '../Enums';
import { HOSStatusInMemoryCalculatedStats } from '../HOSStatusInMemoryCalculatedStats';
import { LogEntry, OnDriving as OnDrivingType } from '../types';

@Injectable()
export class cumulativeOnDriving
  extends BaseHOSStatusEntity {
  onDrivingData: OnDrivingType = {
    counter: 0,
    totalSecondsSpentSoFar: 0
  }

  constructor(
    private readonly hOSIMC: HOSStatusInMemoryCalculatedStats
    // @Inject() private readonly appService: AppService,
  ) {
    super();
  }

  restoreSelfDataFromInMemoryCalculationInstance = () => {
    const valuesToRestore = this.hOSIMC.statusesData.onDriving
    Object.assign(this.onDrivingData, valuesToRestore);
  };

  saveSelfDataInInMemoryCalculationInstance = () => {
    this.hOSIMC.setStatusesData({
      onDriving: this.onDrivingData
    });
  };

}
