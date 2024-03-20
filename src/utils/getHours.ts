// Import the Moment.js library
const moment = require('moment');

export const getHours = (t1, t2) => {
  // Get the current date
  const currentDate = moment().format('YYYY-MM-DD');

  // Combine the date with the time values
  const dateTime1 = moment(`${currentDate} ${t1}`, 'YYYY-MM-DD HHmmss');
  const dateTime2 = moment(`${currentDate} ${t2}`, 'YYYY-MM-DD HHmmss');

  // Adjust dateTime2 if it's before dateTime1 to handle crossing over to the next day
  if (dateTime2.isBefore(dateTime1)) {
    dateTime2.add(1, 'day');
  }

  // Calculate the difference in hours
  const diffHours = dateTime2.diff(dateTime1, 'hours', true);

  return diffHours;
};
