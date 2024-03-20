import moment from 'moment';
import { googleDirections } from './googleDirections';
import { distanceToMilesConverter } from './distanceToMilesConverter';
import { minToHourConverter } from './minToHourConverter';

/**
 * @description : The function provides information between two points.
 */
export async function betweenLatLongInfo(initialLocation, finalLocation) {
  // Fetch the directions from Google Maps Directions API
  const response = await googleDirections(initialLocation, finalLocation);
  const data = response.data;

  // Extract the address of the destination location
  const destinationAddress = data.routes[0]?.legs[0]?.end_address; // Address of the final location

  // Extract the duration value from the response
  let duration = data.routes[0]?.legs[0]?.duration?.text; // Duration in textual format (e.g., "15 mins")
  duration = JSON.parse(
    await minToHourConverter(duration || '0 mi').toFixed(2),
  );
  // Extract hours using string manipulation
  // const hoursIndex = duration.indexOf('hours');
  // const hoursSubstring = duration.substring(0, hoursIndex).trim();
  // duration = parseInt(hoursSubstring);

  // Extract the distance value from the response
  let distance = data.routes[0]?.legs[0]?.distance?.text; // Distance in textual format (e.g., "5.3 km")
  distance = distanceToMilesConverter(distance);
  // distance = distance / 1.609; // converted in miles

  const obj = {
    destinationAddress,
    distance,
    duration,
  };

  return obj;
}
