import moment from "moment";

export function minToHourConverter(str) {
  // Parse the input duration "1 hour 37 min" using Moment.js
  const inputDuration = str;
  const durationParts = inputDuration.split(' ');

  let totalDuration = moment.duration(0);

  for (let i = 0; i < durationParts.length; i += 2) {
    const value = parseInt(durationParts[i]);
    const unit = durationParts[i + 1].toLowerCase();

    if (unit.includes('hour')) {
      totalDuration.add(value, 'hours');
    } else if (unit.includes('min')) {
      totalDuration.add(value, 'minutes');
    }
  }

  // Convert the total duration to hours
  const hours = totalDuration.asHours();

  return hours;
}
