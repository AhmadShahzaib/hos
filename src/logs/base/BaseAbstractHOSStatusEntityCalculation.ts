import { BaseHOSStatusEntity } from './BaseHOSStatusEntity';
import { HOSStatusInMemoryCalculatedStats } from '../HOSStatusInMemoryCalculatedStats';
import { LogEntry, PartialStatusesType } from 'logs/types';

export abstract class BaseAbstractHOSStatusEntityCalculation<
  T extends BaseHOSStatusEntity,
  > {
  // [index: string]: any;
  abstract calculate: () => number | string | any;
  abstract getTotalTimeSpent: () => number;
  abstract saveSelfDataInInMemoryCalculationInstance: (
  ) => void;
  abstract restoreSelfDataFromInMemoryCalculationInstance: (
  ) => void;
  abstract setStatus: (partialData?: Partial<LogEntry> | PartialStatusesType) => void;

}
