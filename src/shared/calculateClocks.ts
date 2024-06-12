import { Logger } from '@nestjs/common';
import moment from 'moment';
interface UpdateVariablesParams {
  //  #### BREAK VARIABLES ####
  BREAK_30_MIN: number; // represents break time in seconds
  BREAK_ENABLE: boolean; // represents wheather the break is taken or not
  BREAK_VERIFIED: boolean; // represents that the 30 min break is taken and is verified
  BREAK_VIOLATION: boolean; // key denotes 30 min break is not taken

  // Represents only the consecutive driving status (eventType = 1, eventCode = 3), time is in seconds
  CONSECUTIVE_DRIVING: number;

  // this object stores eventDate (MMDDYY) and eventTime (HHMMSS) when the cycle is started
  CYCLE_START_DATE: any;

  // #### DRIVING VARIABLES ####
  DRIVING: number; // Time in seconds for driving
  DRIVING_ADDED: number;
  DRIVING_COUNTER: number;
  DRIVING_CYCLE: number;
  DRIVING_NOT_ALLOWED_IN_ONDUTY_VIOLATION: boolean;
  DRIVING_NOT_ALLOWED_IN_ONDUTY_WITH_OUT_SPLIT_VIOLATION: boolean;
  DRIVING_VIOLATION: boolean;
  DRIVING_WITH_OUT_ON_DUTY_ADDED: number;
  DRIVING_WITH_OUT_SPLIT: number;

  DVIR_CREATED: boolean;
  FIRST_QUALIFY_ENABLE: boolean;

  OFF_DUTY: number;
  OFF_DUTY_CONSECUTIVE: number;
  OFF_DUTY_COUNTER: number;
  OFF_DUTY_CYCLE: number;
  OFF_DUTY_SLEEPER_BERTH: number;
  CYCLE_TIME_DUPLICATE: number;
  SHIFT_START_DATE: any;
  isRecap: boolean;
  ON_DRIVING_CHUNK: number;
  ON_DUTY_ADDED: number;
  ON_DUTY_COUNTER: number;
  ON_DUTY_MAX_HOURS: boolean;
  ON_DUTY_NOT_DRIVING: number;
  ON_DUTY_NOT_DRIVING_CHUNK: number;
  ON_DUTY_NOT_DRIVING_CYCLE: number;
  ON_DUTY_NOT_DRIVING_WITHOUT_DRIVE: number;
  ON_DUTY_NOT_DRIVING_WITH_OUT_SPLIT: number;
  ON_DUTY_CURRENT_TIME: number;

  QUALIFY_ENABLE: boolean;
  SB_COUNTER: number;
  SHIFT_STARTED: boolean;

  // ### SLEEPER BERTH VARIABLES ###
  SLEEPER_BERTH: number;
  SLEEPER_BERTH_34_HOURS: number;
  SLEEPER_BERTH_CONSECUTIVE: number;
  SLEEPER_BERTH_CYCLE: number;
  SLEEPER_SPLIT_CHUNK: number;

  // boolean representing day split
  SPLIT_ACTIVE: boolean;

  // time in seconds counting seconds of shift
  TOTAL_SHIFT_COUNTER: number;
  RECAPE_STATUS: boolean;
  RECAPE_HOURS: number;
  // represents number of shifts
  NUMBER_SHIFTS: number;
  CYCLE_START: any;
  HOURS_WORKED: number;
  CYCLE_DAY: number;
  CYCLE_DATA: Array<any>;
  // unix time representing when divice has last synced
  LAST_SYNC_TIME: any;

  // Object representing current eventDate and eventTime
  currentDateTime: any;
  lastLogTime: any;
  // representing engine is started or not
  engineStart: any;
  powerUp: any;
  // represents the currently active log of driver and stores only eventCode of log (eventType = 1, eventCode = 1 || 2 || 3 || 4). In case of PC/YM (eventType = 3, eventCode = 2 ? 4 : 1)
  CURRENT_STATUS: number;

  // array holding violations occuring
  violation: any;

  timeDifferenceInSeconds: number;
}

export const updateVariables = (
  params: UpdateVariablesParams,
  timezone,
  nextLogEventDateTime,
  currentLogEventDateTime,
) => {
  let {
    BREAK_30_MIN,
    powerUp,
    BREAK_ENABLE,
    BREAK_VERIFIED,
    BREAK_VIOLATION,
    CONSECUTIVE_DRIVING,
    CYCLE_START_DATE,
    CYCLE_START,
    HOURS_WORKED,
    CYCLE_DATA,
    CYCLE_DAY,
    RECAPE_STATUS,
    RECAPE_HOURS,
    DRIVING,
    engineStart,
    lastLogTime,
    DRIVING_ADDED,
    DRIVING_COUNTER,
    SHIFT_START_DATE,
    isRecap,
    DRIVING_CYCLE,
    DRIVING_NOT_ALLOWED_IN_ONDUTY_VIOLATION,
    DRIVING_NOT_ALLOWED_IN_ONDUTY_WITH_OUT_SPLIT_VIOLATION,
    DRIVING_VIOLATION,
    DRIVING_WITH_OUT_ON_DUTY_ADDED,
    DRIVING_WITH_OUT_SPLIT,
    DVIR_CREATED,
    FIRST_QUALIFY_ENABLE,
    OFF_DUTY,
    OFF_DUTY_CONSECUTIVE,
    OFF_DUTY_COUNTER,
    OFF_DUTY_CYCLE,
    OFF_DUTY_SLEEPER_BERTH,
    ON_DRIVING_CHUNK,
    ON_DUTY_ADDED,
    ON_DUTY_COUNTER,
    ON_DUTY_MAX_HOURS,
    ON_DUTY_NOT_DRIVING,
    ON_DUTY_NOT_DRIVING_CHUNK,
    ON_DUTY_NOT_DRIVING_CYCLE,
    CYCLE_TIME_DUPLICATE,
    ON_DUTY_NOT_DRIVING_WITHOUT_DRIVE,
    ON_DUTY_NOT_DRIVING_WITH_OUT_SPLIT,
    QUALIFY_ENABLE,
    ON_DUTY_CURRENT_TIME,
    SB_COUNTER,
    SHIFT_STARTED,
    SLEEPER_BERTH,
    SLEEPER_BERTH_34_HOURS,
    SLEEPER_BERTH_CONSECUTIVE,
    SLEEPER_BERTH_CYCLE,
    SLEEPER_SPLIT_CHUNK,
    SPLIT_ACTIVE,
    TOTAL_SHIFT_COUNTER,
    NUMBER_SHIFTS,
    LAST_SYNC_TIME,
    currentDateTime,
    CURRENT_STATUS,
    violation,
    timeDifferenceInSeconds,
  } = params;

  // Assuming currentDateTime and lastSyncTime are moment objects

  if (CURRENT_STATUS == 4 || CURRENT_STATUS == 3) {
    if (SHIFT_STARTED != true) {
      const SHIFT_START_DATE_TIME = {
        eventDate: currentLogEventDateTime.eventDate,
        eventTime: currentLogEventDateTime.eventTime,
      };
      SHIFT_START_DATE.push(SHIFT_START_DATE_TIME);
      engineStart = false;
      if (CURRENT_STATUS == 3) {
        engineStart = true;
      }
    }
    SHIFT_STARTED = true;
    if (NUMBER_SHIFTS < 1) {
      CYCLE_START = {
        eventDate: currentLogEventDateTime.eventDate,
        eventTime: currentLogEventDateTime.eventTime,
      };
      CYCLE_DAY = 1;
    }
    NUMBER_SHIFTS += 1;
  }

  /* TAG # BREAK VIOLATION */
  if (
    CURRENT_STATUS != 3 &&
    SHIFT_STARTED == true &&
    BREAK_VERIFIED == false &&
    CONSECUTIVE_DRIVING > 0
  ) {
    BREAK_30_MIN += timeDifferenceInSeconds;
    if (BREAK_30_MIN >= 30 * 60) {
      BREAK_VIOLATION = false;

      BREAK_VERIFIED = true;
      BREAK_ENABLE = false;
      CONSECUTIVE_DRIVING = 0;
      // BREAK_30_MIN=0
    } else {
      BREAK_VERIFIED = false;
    }
  } else {
    BREAK_30_MIN = 0;
    BREAK_VERIFIED = false;
  }
  // Update BREAK_30_MIN

  // i removed && BREAK_VERIFIED == true from below condition

  // Update CONSECUTIVE_DRIVING
  // Update DRIVING

  // TAG # DRIVING STATUS
  if (CURRENT_STATUS == 3) {
    CONSECUTIVE_DRIVING += timeDifferenceInSeconds;
    DRIVING += timeDifferenceInSeconds;
    OFF_DUTY_CONSECUTIVE = 0;
    OFF_DUTY_SLEEPER_BERTH = 0;
  }
  if (CURRENT_STATUS == 3 || CURRENT_STATUS == 4) {
    HOURS_WORKED += timeDifferenceInSeconds;
  }
  // if (CURRENT_STATUS == 3  ) {
  //     DRIVING += timeDifferenceInSeconds;

  // }
  currentLogEventDateTime.CURRENT_STATUS_TIME += timeDifferenceInSeconds;
  // TAG # SHIFT IN PROGRESS
  // Update ON_DUTY_NOT_DRIVING
  if (SHIFT_STARTED == true) {
    ON_DUTY_NOT_DRIVING += timeDifferenceInSeconds;
  }
  ON_DUTY_CURRENT_TIME += timeDifferenceInSeconds;

  // Update DRIVING_CYCLE
  // Update DRIVING_WITH_OUT_ON_DUTY_ADDED
  // Update DRIVING_WITH_OUT_SPLIT added

  // TAG # DRIVING STATUS UPDATE
  if (CURRENT_STATUS == 3) {
    DRIVING_CYCLE += timeDifferenceInSeconds;
    DRIVING_WITH_OUT_ON_DUTY_ADDED += timeDifferenceInSeconds;
    DRIVING_WITH_OUT_SPLIT += timeDifferenceInSeconds;
    SLEEPER_BERTH_34_HOURS = 0;
    SLEEPER_BERTH_CONSECUTIVE = 0;
  }

  // Update DRIVING_WITH_OUT_ON_DUTY_ADDED
  //   if (CURRENT_STATUS == 3) {
  //   DRIVING_WITH_OUT_ON_DUTY_ADDED += timeDifferenceInSeconds;
  // }

  // Update DRIVING_WITH_OUT_SPLIT
  //   if (CURRENT_STATUS == 3) {
  //   DRIVING_WITH_OUT_SPLIT += timeDifferenceInSeconds;
  // }

  // Update OFF_DUTY
  // Update OFF_DUTY_CYCLE

  // TAG # OFF DUTY DURING SHIFT
  if (CURRENT_STATUS == 1 && SHIFT_STARTED == true) {
    OFF_DUTY += timeDifferenceInSeconds;
    OFF_DUTY_CYCLE += timeDifferenceInSeconds;
  }

  // TAG # OFF DUTY STATUS DURATION
  // Update OFF_DUTY_CONSECUTIVE
  if (CURRENT_STATUS == 1) {
    OFF_DUTY_CONSECUTIVE += timeDifferenceInSeconds;
  }
  // || CURRENT_STATUS == 2
  // Update OFF_DUTY_CYCLE

  // else if ( CURRENT_STATUS == 2 && timeDifferenceInSeconds >= 10*60*60) {

  //     OFF_DUTY_CYCLE += timeDifferenceInSeconds;
  //   }

  // TAG # OFF DUTY AND SLEEPER BERTH DURATION
  // Update OFF_DUTY_SLEEPER_BERTH
  if (CURRENT_STATUS == 1 || CURRENT_STATUS == 2) {
    OFF_DUTY_SLEEPER_BERTH += timeDifferenceInSeconds;
  }

  // Update ON_DUTY_ADDED
  //   if (CURRENT_STATUS == 4 || CURRENT_STATUS == 3) {

  //   ON_DUTY_ADDED += timeDifferenceInSeconds;

  // }

  // TAG # ON DUTY STATUS WITHOUT DRIVING
  // Update ON_DUTY_NOT_DRIVING_CYCLE
  if (CURRENT_STATUS == 4 || CURRENT_STATUS == 3) {
    ON_DUTY_NOT_DRIVING_CYCLE += timeDifferenceInSeconds;
    CYCLE_TIME_DUPLICATE += timeDifferenceInSeconds;
    // ON_DUTY_NOT_DRIVING_WITHOUT_DRIVE += timeDifferenceInSeconds;
    ON_DUTY_NOT_DRIVING_WITH_OUT_SPLIT += timeDifferenceInSeconds;
  }

  // TAG # ON DUTY STATUS WITHOUT DRIVING UPDATE
  if (SHIFT_STARTED == true && CURRENT_STATUS != 3 && DRIVING < 1) {
    ON_DUTY_NOT_DRIVING_WITHOUT_DRIVE += timeDifferenceInSeconds;
  }

  // TAG # OFF DUTY AND SLEEPER BERTH METRICS
  // Update ON_DUTY_NOT_DRIVING_WITH_OUT_SPLIT
  if (CURRENT_STATUS == 4) {
    OFF_DUTY_CONSECUTIVE = 0;
    OFF_DUTY_SLEEPER_BERTH = 0;
    SLEEPER_BERTH_34_HOURS = 0;
    SLEEPER_BERTH_CONSECUTIVE = 0;
  }

  // TAG # SLEEPER BERTH STATUS DURATION
  // Update SLEEPER_BERTH
  if (CURRENT_STATUS == 2) {
    SLEEPER_BERTH += timeDifferenceInSeconds;
  }

  // TAG # SLEEPER BERTH DURATION ( INCLUDING 34-HOUR RESTART )
  // Update SLEEPER_BERTH_34_HOURS
  if (CURRENT_STATUS == 2 || CURRENT_STATUS == 1) {
    SLEEPER_BERTH_34_HOURS += timeDifferenceInSeconds;
  }

  // Update SLEEPER_BERTH_CONSECUTIVE
  if (CURRENT_STATUS == 2) {
    SLEEPER_BERTH_CONSECUTIVE += timeDifferenceInSeconds;
  }

  // Update SLEEPER_BERTH_CYCLE
  if (CURRENT_STATUS == 2) {
    SLEEPER_BERTH_CYCLE += timeDifferenceInSeconds;
  }
  // Update TOTAL_SHIFT_COUNTER
  //  if ((CURRENT_STATUS == 2 || CURRENT_STATUS == 1 && SHIFT_STARTED && timeDifferenceInSeconds <= 10*60*60  )|| CURRENT_STATUS == 3 || CURRENT_STATUS == 4) {
  if (SHIFT_STARTED == true) {
    TOTAL_SHIFT_COUNTER += timeDifferenceInSeconds;
  }
  // }
  // All rules will be implemented here.

  // Apply reset rules
  if (
    OFF_DUTY_CONSECUTIVE >= 10 * 60 * 60 ||
    SLEEPER_BERTH_CONSECUTIVE >= 10 * 60 * 60 ||
    OFF_DUTY_SLEEPER_BERTH >= 10 * 60 * 60
  ) {
    engineStart = false;
    // Reset BREAK_30_MIN, CONSECUTIVE_DRIVING, and DRIVING if the driver has taken a sufficient off-duty or sleeper berth time or the current status is offDuty
    BREAK_30_MIN = 0;
    BREAK_VERIFIED = false;
    CONSECUTIVE_DRIVING = 0;
    DRIVING = 0;
    DRIVING_ADDED = 0;
    DRIVING_WITH_OUT_ON_DUTY_ADDED = 0;
    DRIVING_WITH_OUT_SPLIT = 0;
    SLEEPER_BERTH = 0;
    SLEEPER_BERTH_CONSECUTIVE = 0;
    OFF_DUTY = 0;
    DRIVING_VIOLATION = false;
    DRIVING_NOT_ALLOWED_IN_ONDUTY_WITH_OUT_SPLIT_VIOLATION = false;
    OFF_DUTY_CONSECUTIVE = 0;
    OFF_DUTY_SLEEPER_BERTH = 0;
    TOTAL_SHIFT_COUNTER = 0;
    SHIFT_STARTED = false;
    BREAK_VIOLATION = false;
    ON_DUTY_NOT_DRIVING = 0;
    ON_DUTY_NOT_DRIVING_WITH_OUT_SPLIT = 0;
    ON_DUTY_NOT_DRIVING_WITHOUT_DRIVE = 0;
  }

  if (SLEEPER_BERTH_34_HOURS >= 34 * 60 * 60) {
    // Reset CYCLE_START_DATE and DRIVING_CYCLE if the driver has taken a sufficient off-duty or sleeper berth time or the current status is offDuty
    if (NUMBER_SHIFTS > 0) {
      const duration = SLEEPER_BERTH_34_HOURS - 34 * 60 * 60;
      const result = subtractDurationFromDate(nextLogEventDateTime, duration);
      CYCLE_START_DATE = {
        eventDate: result.newEventDate,
        eventTime: result.newEventTime,
      };
    }
    RECAPE_STATUS = false;
    RECAPE_HOURS = 0;
    CYCLE_DATA = [];
    CYCLE_DAY = 0;
    BREAK_30_MIN = 0;
    DRIVING_NOT_ALLOWED_IN_ONDUTY_WITH_OUT_SPLIT_VIOLATION = false;
    BREAK_VERIFIED = false;
    CONSECUTIVE_DRIVING = 0;
    DRIVING = 0;
    DRIVING_ADDED = 0;
    DRIVING_WITH_OUT_ON_DUTY_ADDED = 0;
    DRIVING_WITH_OUT_SPLIT = 0;
    BREAK_VIOLATION = false;
    DRIVING_VIOLATION = false;
    SLEEPER_BERTH = 0;
    SLEEPER_BERTH_CONSECUTIVE = 0;
    OFF_DUTY = 0;
    OFF_DUTY_CONSECUTIVE = 0;
    OFF_DUTY_SLEEPER_BERTH = 0;
    TOTAL_SHIFT_COUNTER = 0;
    NUMBER_SHIFTS = 0;
    SHIFT_STARTED = false;
    ON_DUTY_NOT_DRIVING = 0;
    ON_DUTY_NOT_DRIVING_WITH_OUT_SPLIT = 0;
    ON_DUTY_NOT_DRIVING_WITHOUT_DRIVE = 0;

    DRIVING_CYCLE = 0;
    ON_DUTY_MAX_HOURS = false;
    SLEEPER_BERTH_34_HOURS = 0;
    DRIVING_CYCLE = 0;
    OFF_DUTY_CYCLE = 0;
    ON_DUTY_NOT_DRIVING_CYCLE = 0;
    CYCLE_TIME_DUPLICATE = 0;
    SLEEPER_BERTH_CYCLE = 0;
  }

  LAST_SYNC_TIME = convertToUnixTimestamp(currentDateTime, timezone);
  //  moment().tz(timezone);
  return {
    BREAK_30_MIN,
    BREAK_ENABLE,
    BREAK_VERIFIED,
    BREAK_VIOLATION,
    CONSECUTIVE_DRIVING,
    CYCLE_START_DATE,

    DRIVING,

    DRIVING_ADDED,
    DRIVING_COUNTER,
    DRIVING_CYCLE,

    DRIVING_NOT_ALLOWED_IN_ONDUTY_VIOLATION,
    DRIVING_NOT_ALLOWED_IN_ONDUTY_WITH_OUT_SPLIT_VIOLATION,
    DRIVING_VIOLATION,
    DRIVING_WITH_OUT_ON_DUTY_ADDED,
    CYCLE_START,
    HOURS_WORKED,
    CYCLE_DATA,
    CYCLE_DAY,
    DRIVING_WITH_OUT_SPLIT,
    isRecap,
    DVIR_CREATED,
    FIRST_QUALIFY_ENABLE,
    OFF_DUTY,
    OFF_DUTY_CONSECUTIVE,
    OFF_DUTY_COUNTER,
    OFF_DUTY_CYCLE,
    OFF_DUTY_SLEEPER_BERTH,
    ON_DRIVING_CHUNK,
    lastLogTime,
    RECAPE_STATUS,
    RECAPE_HOURS,
    ON_DUTY_ADDED,
    ON_DUTY_COUNTER,
    ON_DUTY_MAX_HOURS,
    ON_DUTY_NOT_DRIVING,
    engineStart,
    ON_DUTY_NOT_DRIVING_CHUNK,
    ON_DUTY_NOT_DRIVING_CYCLE,
    CYCLE_TIME_DUPLICATE,
    ON_DUTY_NOT_DRIVING_WITHOUT_DRIVE,
    ON_DUTY_NOT_DRIVING_WITH_OUT_SPLIT,
    ON_DUTY_CURRENT_TIME,
    QUALIFY_ENABLE,
    SB_COUNTER,
    powerUp,
    SHIFT_STARTED,
    SLEEPER_BERTH,
    SLEEPER_BERTH_34_HOURS,
    SLEEPER_BERTH_CONSECUTIVE,
    SLEEPER_BERTH_CYCLE,
    SLEEPER_SPLIT_CHUNK,
    SHIFT_START_DATE,
    SPLIT_ACTIVE,
    TOTAL_SHIFT_COUNTER,
    NUMBER_SHIFTS,
    LAST_SYNC_TIME,
    currentDateTime,
    CURRENT_STATUS,
    violation,
  };
};

const convertToUnixTimestamp = (dateTimeString, timeZone) => {
  const inputFormat = 'MMDDYYHHmmss';
  const dateTime = moment.tz(dateTimeString, inputFormat, timeZone);
  const unixTimestamp = dateTime.valueOf(); // Returns the Unix timestamp

  return unixTimestamp / 1000;
};

const subtractDurationFromDate = (nextLogEventDateTime, duration) => {
  // Parse eventDate and eventTime into Date object
  const dateObj = moment(
    nextLogEventDateTime.eventDate + nextLogEventDateTime.eventTime,
    'MMDDYYHHmmss',
  );

  // Subtract duration from the Date object
  dateObj.subtract(duration, 'seconds');

  // Extract the new eventDate and eventTime
  const newEventDate = dateObj.format('MMDDYY');
  const newEventTime = dateObj.format('HHmmss');
  return {
    newEventDate,
    newEventTime,
  };
};
