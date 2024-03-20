import { MSToTimeReturnType } from '../Enums';

export class BaseHOSStatusEntity extends Object {
  // [index: string]: any;

  constructor() {
    super();
  }

  /**
   * @param ms milliseconds
   * @param mSToDimeReturnType
   * @returns string | number
   * @description converts milliseconds into seconds, minutes or hours 
   */
  msToTime<T extends MSToTimeReturnType>(
    ms: number,
    mSToDimeReturnType: T,
  ): number {
    const seconds = (ms / 1000).toFixed(1);
    const minutes = (ms / (1000 * 60)).toFixed(1);
    const hours = (ms / (1000 * 60 * 60)).toFixed(1);
    // const days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);

    if (mSToDimeReturnType === MSToTimeReturnType.Seconds) {
      return parseFloat(seconds);
    } else if (mSToDimeReturnType === MSToTimeReturnType.Minutes) {
      return parseFloat(minutes);
    } else if (mSToDimeReturnType === MSToTimeReturnType.Hours) {
      return parseFloat(hours);
    }
    return 0;
  }

  /**
   * 
   * @param hours 
   * @returns convert hours into milliseconds.
   */
  hoursToMilliSeconds = (hours: number) => hours * 60 * 60 * 1000;

  /**
   * @param date1 date instance
   * @param date2 should be greater than date1
   * @returns milliseconds
   */
  dateDiffInMs = <T extends Date>(date1?: T, date2?: T): number => {
    if (typeof date1 === 'string' || typeof date2 === 'string') {
      return (new Date(date2).getTime() ?? 0) - (new Date(date1).getTime() ?? 0);
    }
    else return (date2.getTime() ?? 0) - (date1.getTime() ?? 0);
  }
}
