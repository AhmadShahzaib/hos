import { Logger } from "@nestjs/common";

interface Clocks {
  breakSeconds: number;
  cycleSeconds: number;
  driveSeconds: number;
  driveSecondsSplit: number;
  shiftDutySecond: number;
  shiftDutySecondsSplit: number;
  recapeClock: number;
}

interface ClockParams {
  CONSECUTIVE_DRIVING: number;
  DRIVING_WITH_OUT_SPLIT: number;
  ON_DUTY_NOT_DRIVING_CYCLE: number;
  TOTAL_SHIFT_COUNTER: number;
  SHIFT_STARTED: any;
  CURRENT_STATUS: number;
  RECAPE_HOURS: number;
  RECAPE_STATUS: boolean;
}

export const calculateClocks = (params: ClockParams): Clocks => {
  let {
    CONSECUTIVE_DRIVING,
    DRIVING_WITH_OUT_SPLIT,
    ON_DUTY_NOT_DRIVING_CYCLE,
    TOTAL_SHIFT_COUNTER,
    SHIFT_STARTED,
    CURRENT_STATUS,
    RECAPE_HOURS,
    RECAPE_STATUS,
  } = params;

  let clocks: Clocks = {
    breakSeconds: 0,
    cycleSeconds: 0,
    driveSeconds: 0,
    driveSecondsSplit: 0,
    shiftDutySecond: 0,
    shiftDutySecondsSplit: 0,
    recapeClock: 0,
  };
  let DRIVING_WITH_OUT_split;
  let remainingDriving = 11 * 60 * 60 - DRIVING_WITH_OUT_SPLIT;
  let remainingCycle = 70 * 60 * 60 - ON_DUTY_NOT_DRIVING_CYCLE;

  DRIVING_WITH_OUT_split = DRIVING_WITH_OUT_SPLIT;
  if (remainingDriving >= remainingCycle) {
    DRIVING_WITH_OUT_split = ON_DUTY_NOT_DRIVING_CYCLE - 59 * 60 * 60;
  }
  let remainingShift = 14 * 60 * 60 - TOTAL_SHIFT_COUNTER;
  if (SHIFT_STARTED == true) {
    if (remainingDriving >= remainingShift) {
      let drive = TOTAL_SHIFT_COUNTER - 3 * 60 * 60;

      DRIVING_WITH_OUT_split = drive;
    }
  }

  if (remainingDriving >= remainingCycle && remainingShift >= remainingCycle) {
    DRIVING_WITH_OUT_split = ON_DUTY_NOT_DRIVING_CYCLE - 59 * 60 * 60;
  }
let cycleTime= 252000;
  clocks.breakSeconds = CONSECUTIVE_DRIVING;
  clocks.cycleSeconds = ON_DUTY_NOT_DRIVING_CYCLE;
  clocks.driveSeconds = DRIVING_WITH_OUT_split;
  clocks.driveSecondsSplit = DRIVING_WITH_OUT_split; // as we are not entertaining slip
  clocks.shiftDutySecond = TOTAL_SHIFT_COUNTER;
  clocks.shiftDutySecondsSplit = TOTAL_SHIFT_COUNTER; // as we are not entertaining slip
  if (RECAPE_STATUS) {
    Logger.log("This is the recape time"+ RECAPE_HOURS)
    Logger.log("This is the recape minus",cycleTime- RECAPE_HOURS)

    clocks.recapeClock = cycleTime - RECAPE_HOURS;
  }

  return clocks;
};
