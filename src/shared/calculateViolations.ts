import moment from 'moment-timezone';

export const checkViolations = (
  params,
  companyTimeZone,
  nextLogEventDateTime,
  currentLogEventDateTime,
) => {
  let {
    BREAK_30_MIN,
    BREAK_ENABLE,
    BREAK_VERIFIED,
    BREAK_VIOLATION,
    CONSECUTIVE_DRIVING,
    CYCLE_START_DATE,
    DRIVING,
    powerUp,
    lastLogTime,
    DRIVING_ADDED,
    DRIVING_COUNTER,
    DRIVING_CYCLE,
    DRIVING_NOT_ALLOWED_IN_ONDUTY_VIOLATION,
    DRIVING_NOT_ALLOWED_IN_ONDUTY_WITH_OUT_SPLIT_VIOLATION,
    DRIVING_VIOLATION,
    DRIVING_WITH_OUT_ON_DUTY_ADDED,
    DRIVING_WITH_OUT_SPLIT,
    DVIR_CREATED,
    isRecap,
    SHIFT_START_DATE,
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
    engineStart,
    CURRENT_STATUS,
    CYCLE_START,
    HOURS_WORKED,
    CYCLE_DATA,
    CYCLE_DAY,
    RECAPE_STATUS,
    RECAPE_HOURS,
    violation,
  } = params;
  let endedAt = {
    eventDate: '',
    eventTime: '',
  };
  if (CURRENT_STATUS != 3 && violation.length > 0) {
    violation.forEach((element, index) => {
      if (element.endedAt.eventTime == '') {
        violation[index].endedAt = {
          eventDate: currentLogEventDateTime.eventDate,
          eventTime: currentLogEventDateTime.eventTime,
        };
      }
    });
  }
  // let violation = [];
  let duration;
  // Check 30 Minutes Break violation
  if (
    CONSECUTIVE_DRIVING > 8 * 60 * 60 &&
    CURRENT_STATUS == 3 &&
    SHIFT_STARTED == true
  ) {
    if (!BREAK_ENABLE || BREAK_VERIFIED) {
      duration = CONSECUTIVE_DRIVING - 8 * 60 * 60;
      if (currentLogEventDateTime.CURRENT_STATUS_TIME >= duration) {
        let result = subtractDurationFromDate(nextLogEventDateTime, duration);
        // if (result.newEventDate != currentLogEventDateTime.eventDate) {
        //   duration = currentLogEventDateTime.CURRENT_STATUS_TIME;
        // }
        // result = subtractDurationFromDate(nextLogEventDateTime, duration);
        let obj = {
          startedAt: {
            eventDate: result.newEventDate,
            eventTime: result.newEventTime,
          }, //formate of time
          type: 'EIGHT_HOUR_BREAK',
          endedAt: endedAt,
        };
        violation.push(obj);
      } else if (currentLogEventDateTime.CURRENT_STATUS_TIME < duration) {
        duration = currentLogEventDateTime.CURRENT_STATUS_TIME;
        const result = subtractDurationFromDate(nextLogEventDateTime, duration);
        let obj = {
          startedAt: {
            eventDate: result.newEventDate,
            eventTime: result.newEventTime,
          }, //formate of time
          type: 'EIGHT_HOUR_BREAK',
          endedAt: endedAt,
        };
        violation.push(obj);
      }
      BREAK_VIOLATION = true;
    }
  }

  // Check 11 hours driving violation
  if (
    DRIVING_WITH_OUT_ON_DUTY_ADDED > 11 * 60 * 60 &&
    CURRENT_STATUS == 3 &&
    SHIFT_STARTED == true
  ) {
    duration = DRIVING_WITH_OUT_ON_DUTY_ADDED - 11 * 60 * 60;

    if (currentLogEventDateTime.CURRENT_STATUS_TIME >= duration) {
      let result = subtractDurationFromDate(nextLogEventDateTime, duration);
      // if (result.newEventDate != currentLogEventDateTime.eventDate) {
      //   duration = currentLogEventDateTime.CURRENT_STATUS_TIME;
      // }
      // result = subtractDurationFromDate(nextLogEventDateTime, duration);

      let obj = {
        startedAt: {
          eventDate: result.newEventDate,
          eventTime: result.newEventTime,
        }, //formate of time
        type: 'ELEVEN_HOUR_DRIVE',
        endedAt: endedAt,
      };
      violation.push(obj);
    } else if (currentLogEventDateTime.CURRENT_STATUS_TIME < duration) {
      duration = currentLogEventDateTime.CURRENT_STATUS_TIME;
      const result = subtractDurationFromDate(nextLogEventDateTime, duration);
      let obj = {
        startedAt: {
          eventDate: result.newEventDate,
          eventTime: result.newEventTime,
        }, //formate of time
        type: 'ELEVEN_HOUR_DRIVE',
        endedAt: endedAt,
      };
      violation.push(obj);
    }

    DRIVING_VIOLATION = true;
  }

  // Check 14 hours shift violation
  // const totalOnDutyHours = TOTAL_SHIFT_COUNTER + ON_DUTY_ADDED;
  if (
    TOTAL_SHIFT_COUNTER > 14 * 60 * 60 &&
    CURRENT_STATUS == 3 &&
    SHIFT_STARTED == true
  ) {
    duration = TOTAL_SHIFT_COUNTER - 14 * 60 * 60;
    if (currentLogEventDateTime.CURRENT_STATUS_TIME >= duration) {
      let result = subtractDurationFromDate(nextLogEventDateTime, duration);
      // if (result.newEventDate != currentLogEventDateTime.eventDate) {
      //   duration = currentLogEventDateTime.CURRENT_STATUS_TIME;
      // }
      // result = subtractDurationFromDate(nextLogEventDateTime, duration);
      let obj = {
        startedAt: {
          eventDate: result.newEventDate,
          eventTime: result.newEventTime,
        }, //formate of time
        type: 'FOURTEEN_HOUR_SHIFT',
        endedAt: endedAt,
      };
      violation.push(obj);
    } else if (currentLogEventDateTime.CURRENT_STATUS_TIME < duration) {
      duration = currentLogEventDateTime.CURRENT_STATUS_TIME;
      DRIVING_NOT_ALLOWED_IN_ONDUTY_WITH_OUT_SPLIT_VIOLATION = true;
      const result = subtractDurationFromDate(nextLogEventDateTime, duration);
      let obj = {
        startedAt: {
          eventDate: result.newEventDate,
          eventTime: result.newEventTime,
        }, //formate of time
        type: 'FOURTEEN_HOUR_SHIFT',
        endedAt: endedAt,
      };
      violation.push(obj);
    }
  }

  if (CURRENT_STATUS == 3 && ON_DUTY_NOT_DRIVING_CYCLE > 70 * 60 * 60) {
    duration = ON_DUTY_NOT_DRIVING_CYCLE - 70 * 60 * 60;
    if (currentLogEventDateTime.CURRENT_STATUS_TIME >= duration) {
      let result = subtractDurationFromDate(nextLogEventDateTime, duration);
      // if (result.newEventDate != currentLogEventDateTime.eventDate) {
      //   duration = currentLogEventDateTime.CURRENT_STATUS_TIME;
      // }
      // result = subtractDurationFromDate(nextLogEventDateTime, duration);
      let obj = {
        startedAt: {
          eventDate: result.newEventDate,
          eventTime: result.newEventTime,
        }, //formate of time
        type: 'SEVENTY_HOUR_CYCLE',
        endedAt: endedAt,
      };
      violation.push(obj);
    } else if (currentLogEventDateTime.CURRENT_STATUS_TIME < duration) {
      duration = currentLogEventDateTime.CURRENT_STATUS_TIME;
      const result = subtractDurationFromDate(nextLogEventDateTime, duration);
      let obj = {
        startedAt: {
          eventDate: result.newEventDate,
          eventTime: result.newEventTime,
        }, //formate of time
        type: 'SEVENTY_HOUR_CYCLE',
        endedAt: endedAt,
      };
      violation.push(obj);
    }
    ON_DUTY_MAX_HOURS = true;
  }

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
    lastLogTime,
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
    isRecap,
    ON_DUTY_ADDED,
    ON_DUTY_COUNTER,
    ON_DUTY_MAX_HOURS,
    ON_DUTY_NOT_DRIVING,
    CYCLE_START,
    HOURS_WORKED,
    CYCLE_DATA,
    CYCLE_DAY,
    RECAPE_STATUS,
    RECAPE_HOURS,
    ON_DUTY_NOT_DRIVING_CHUNK,
    ON_DUTY_NOT_DRIVING_CYCLE,
    CYCLE_TIME_DUPLICATE,
    ON_DUTY_NOT_DRIVING_WITHOUT_DRIVE,
    ON_DUTY_NOT_DRIVING_WITH_OUT_SPLIT,
    ON_DUTY_CURRENT_TIME,
    QUALIFY_ENABLE,
    SB_COUNTER,
    SHIFT_START_DATE,
    SHIFT_STARTED,
    powerUp,
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
    engineStart,
    violation,
  };
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
