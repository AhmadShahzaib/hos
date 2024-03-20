import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { BaseAbstractHOSStatusEntityCalculation } from './base/BaseAbstractHOSStatusEntityCalculation';
import { BaseHOSStatusEntity } from './base/BaseHOSStatusEntity';
import { EventType, LogActionType, MSToTimeReturnType } from './Enums';
import { HOSStatusInMemoryCalculatedStats } from './HOSStatusInMemoryCalculatedStats';
import { DutyType, LogEntry, OffDuty as OffDutyType } from './types';

@Injectable()
export class EldEvents
  extends BaseHOSStatusEntity
// implements BaseAbstractHOSStatusEntityCalculation<EldEvents>
{
  constructor(private readonly hOSIMC: HOSStatusInMemoryCalculatedStats) {
    super();
  }

  addEvent = (partialData?: Partial<LogEntry>) => {

    const dutyStatus = partialData.eventType;

    this.hOSIMC.createLogEntryAsEldEvent(dutyStatus as EventType, partialData);


  };

}
