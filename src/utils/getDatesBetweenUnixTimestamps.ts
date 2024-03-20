import moment from 'moment';
// export const getDatesBetweenUnixTimestamps = (startTimestamp, endTimestamp) => {
//   const dates = [];

//   // Convert Unix timestamps to milliseconds
//   const startDate = new Date(startTimestamp * 1000);
//   const endDate = new Date(endTimestamp * 1000);

//   // Set the start date to the next day to exclude it
//   if (startDate.toLocaleDateString() !== endDate.toLocaleDateString()) {
//     startDate.setDate(startDate.getDate() + 1);
//     if (startDate.getTime() !== endDate.getTime()) {
//       endDate.setDate(endDate.getDate() + 1);
//     }
//   }

//   // Loop through each day until the end date
//   while (startDate <= endDate) {
//     // Get the current date and add it to the dates array
//     const currentDate = new Date(startDate);
//     dates.push(currentDate.toISOString().slice(0, 10));

//     // Increment the date by 1 day
//     startDate.setDate(startDate.getDate() + 1);
//   }

//   return dates;
// };

export const getDatesBetweenUnixTimestamps = (
  startTimestamp,
  endTimestamp,
  timezone,
) => {
  const dates = [];

  // Convert Unix timestamps to moment objects
  const startDate = moment.unix(startTimestamp).tz(timezone);
  const endDate = moment.unix(endTimestamp).tz(timezone);

  // Set the start date to the next day to exclude it
  

  // Loop through each day until the end date
  while (startDate.isSameOrBefore(endDate, 'day')) {
    // Get the current date and add it to the dates array
    const currentDate = startDate.format('YYYY-MM-DD');
    dates.push(currentDate);

    // Increment the date by 1 day
    startDate.add(1, 'day');
  }

  return dates;
};

export const isSameDay = (startTimestamp, endTimestamp) => {
  const startDate = new Date(startTimestamp * 1000);
  const endDate = new Date(endTimestamp * 1000);
  if (startDate.toLocaleDateString() == endDate.toLocaleDateString()) {
    return true;
  } else return false;
};
export const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  const currentDate = moment(startDate);
  const lastDate = moment(endDate);

  while (currentDate <= lastDate) {
    dates.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'day');
  }

  return dates;
};
export const calculateTimeDifference = (startTime, endTime)=> {
  const format = 'HHmmss';
  const startTimeMoment = moment(startTime, format);
  const endTimeMoment = moment(endTime, format);

  const differenceInSeconds = endTimeMoment.diff(startTimeMoment, 'seconds');
  return differenceInSeconds;
}
