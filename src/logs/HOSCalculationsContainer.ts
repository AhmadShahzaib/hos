// import { OnDuty } from './OnDuty';
// import { OnDriving } from './OnDriving';
// import { OnBreak } from './OnBreak';
// import { OffDuty } from './OffDuty';
// import { LogEntry } from './types';
// import { MSToTimeReturnType } from './enums';
// import { HOSStatusInMemoryCalculatedStats } from './HOSStatusInMemoryCalculatedStats';

// export class HOSCalculationsContainer {
//   hOSStatusInMemoryCalculatedStats: HOSStatusInMemoryCalculatedStats =
//     new HOSStatusInMemoryCalculatedStats();

//   onDuty: OnDuty = new OnDuty(this.hOSStatusInMemoryCalculatedStats);
//   onDriving: OnDriving = new OnDriving(this.hOSStatusInMemoryCalculatedStats);
//   onBreak: OnBreak = new OnBreak(this.hOSStatusInMemoryCalculatedStats);
//   offDuty: OffDuty = new OffDuty(this.hOSStatusInMemoryCalculatedStats);

//   falseWait = async (ms: number) => {
//     return new Promise((res) => {
//       setTimeout(() => {
//         res(true);
//       }, ms);
//     });
//   };

//   generatePartialLogEntryForDriving = () => {
//     const logEntry: Partial<LogEntry> = {
//       odoMeterMillage: new Date().getMilliseconds(),
//       odoMeterSpeed: new Date().getMinutes(),
//       engineHours: new Date().getHours(),
//       engineRPMs: Math.abs(new Date().getMinutes() / 2),
//     };

//     return logEntry;
//   };

//   generateDummyData = async () => {
//     this.onDuty.setOnDuty();
//     await this.falseWait(1000);

//     this.onDriving.setOnDriving(this.generatePartialLogEntryForDriving());
//     await this.falseWait(1000);

//     this.onBreak.setOnBreak();
//     await this.falseWait(6000);

//     this.onDriving.setOnDriving();
//     await this.falseWait(4000);

//     this.offDuty.setOffDuty();
//     await this.falseWait(4000);

//     this.onDuty.setOnDuty();
//     await this.falseWait(this.msToTime(1));

//     this.onDriving.setOnDriving(this.generatePartialLogEntryForDriving());
//     await this.falseWait(this.msToTime(2));

//     this.onBreak.setOnBreak();
//     await this.falseWait(6000);

//     this.onDriving.setOnDriving();
//     await this.falseWait(4000);

//     this.offDuty.setOffDuty();

//     /// repeats
//     // await this.falseWait(4000);
//     // this.onDuty.setOnDuty();
//     // await this.falseWait(2000);

//     // this.onDriving.setOnDriving(logEntry);
//     // await this.falseWait(4000);

//     // this.onBreak.setOnBreak();
//     // await this.falseWait(6000);

//     // this.onDriving.setOnDriving();
//     // await this.falseWait(4000);

//     // this.offDuty.setOffDuty();

//     // this.calculateStatistics();
//   };

//   msToTime = (howManyMinutes: number) =>
//     parseFloat((howManyMinutes * (1000 * 60)).toFixed(1));

//   calculateStatistics = () => {
//     // this.onDuty.calculate();
//     // this.onDriving.calculate();
//     // this.onBreak.calculate();
//     // this.offDuty.calculate();

//     console.groupCollapsed('Total On Duty Time');
//     console.log(
//       this.onDuty.getTotalTimeSpent() + this.onDriving.getTotalTimeSpent(),
//     );
//     console.log(this.onDuty.totalCounter);
//     console.groupEnd();

//     console.groupCollapsed('Total Break');
//     console.log(this.onBreak.getTotalTimeSpent());
//     console.log(this.onBreak.totalCounter);
//     console.groupEnd();

//     console.groupCollapsed('On Driving');
//     console.log(this.onDuty.getTotalTimeSpent());
//     console.log(this.onDuty.totalCounter);
//     console.groupEnd();

//     console.groupCollapsed('14 hours');
//     const TotalHoursAllowed = this.onDuty.hoursToMilliSeconds(14);
//     const DutyStartedAt =
//       this.hOSStatusInMemoryCalculatedStats.dutyLog[0].actionDate.getTime();

//     const TotalOnDutyAndOnDriving =
//       this.onDuty.getTotalTimeSpent() + this.onDriving.getTotalTimeSpent();

//     // console.log(this.hOSStatusInMemoryCalculatedStats.startOfTheDay - );

//     console.log(TotalHoursAllowed);
//     console.log(TotalOnDutyAndOnDriving);
//     console.log('total: ', TotalHoursAllowed - TotalOnDutyAndOnDriving);
//     console.log(
//       'total available hours: ',
//       this.onDuty.msToTime(
//         TotalHoursAllowed - TotalOnDutyAndOnDriving,
//         MSToTimeReturnType.Hours,
//       ),
//     );
//     console.groupEnd();

//     //onDuty: OnDuty = new OnDuty(this.hOSStatusInMemoryCalculatedStats);

//     // this.onDuty.saveSelfDataInInMemoryCalculationInstance(
//     //   this.hOSStatusInMemoryCalculatedStats,
//     // );

//     // this.onDuty.restoreSelfDataFromInMemoryCalculationInstance(
//     //   this.hOSStatusInMemoryCalculatedStats,
//     // );

//     // let stringifed = JSON.stringify(this.hOSStatusInMemoryCalculatedStats);
//     // console.log(stringifed)
//     // this.hOSStatusInMemoryCalculatedStats = JSON.parse(stringifed);
//     // console.log(this.hOSStatusInMemoryCalculatedStats["OnDuty"])
//   };
// }
