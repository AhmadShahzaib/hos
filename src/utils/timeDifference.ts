const moment = require('moment');

export async function timeDifference(time1, time2): Promise<number> {
  // Convert the times to Moment.js objects
  const momentTime1 = moment(time1, 'HHmmss');
  const momentTime2 = moment(time2, 'HHmmss');

  // Calculate the difference in seconds
  const timeDifferenceInSeconds = momentTime1.diff(momentTime2, 'seconds');

  // Convert the difference to hours with decimal fractions
  const timeDifferenceInHours = timeDifferenceInSeconds / 3600;

  return timeDifferenceInHours;
}
