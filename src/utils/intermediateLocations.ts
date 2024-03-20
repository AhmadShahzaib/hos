const polyline = require('@mapbox/polyline');
import { googleDirections } from './googleDirections';
import { distanceToMilesConverter } from './distanceToMilesConverter';

export async function getIntermediateLocations(
  initialLocation,
  finalLocation,
  numPoints,
) {
  const intermediateLocations = [];

  // Fetch the directions from Google Maps Directions API
  const response = await googleDirections(initialLocation, finalLocation);

  const data = response.data;

  // Extract the polyline points from the response
  const points = data?.routes[0]?.overview_polyline.points;

  // Decode the polyline points to latitude and longitude coordinates
  const decodedPoints = points ? polyline.decode(points) : [];
  const decodedPointsLength = decodedPoints.length - 1;

  // Calculate the interval based on the number of intermediate points
  const interval = Math.floor(decodedPointsLength / numPoints);

  // Extract the distance value from the response
  let distance = data?.routes[0]?.legs[0]?.distance?.text; // Distance in textual format (e.g., "5.3 km")
  distance = distanceToMilesConverter(distance || '0 mi');

  //Avergae speed
  const avgSpeed = Math.floor(distance / numPoints);
  if (interval < 0 || interval == 0 || avgSpeed > 120)
    return intermediateLocations;

  for (let i = interval; i < decodedPoints.length; i += interval) {
    const point = decodedPoints[i];
    const latitude = point[0];
    const longitude = point[1];
    intermediateLocations.push({ latitude, longitude });
  }

  return intermediateLocations;
}

export async function getIntermediateLocationsWithSpeed(
  initialLocation,
  finalLocation,
  numPoints,
  speedMph,
) {
  const intermediateLocations = [];

  // Fetch the directions from Google Maps Directions API
  const response = await googleDirections(initialLocation, finalLocation);

  const data = response.data;

  // Extract the polyline points from the response
  const points = data?.routes[0]?.overview_polyline.points;

  // Extract the distance value from the response
  let distance = data?.routes[0]?.legs[0]?.distance?.text; // Distance in textual format (e.g., "5.3 km")
  distance = distanceToMilesConverter(distance || '0 mi');

  const avgSpeed = Math.floor(distance / numPoints);
  if (
    avgSpeed < 0 ||
    avgSpeed == 0 ||
    avgSpeed > 110 ||
    avgSpeed - 15 >= speedMph
    // ||    avgSpeed <= speedMph
  )
    return intermediateLocations;

  // Decode the polyline points to latitude and longitude coordinates
  const decodedPoints = points ? polyline.decode(points) : [];

  let point1 = [];
  let point2 = [];
  let accumulatedDistance = 0;
  let distanceBetweenPoints = 0;
  let desiredDistance = speedMph;

  for (let i = 0; i < decodedPoints.length - 1; i++) {
    point1 =
      i == 0
        ? [initialLocation.latitude, initialLocation.longitude]
        : [decodedPoints[i][0], decodedPoints[i][1]];
    point2 = [decodedPoints[i + 1][0], decodedPoints[i + 1][1]];

    distanceBetweenPoints = calculateDistance(point1, point2);
    accumulatedDistance += distanceBetweenPoints;
    if (accumulatedDistance >= desiredDistance) {
      intermediateLocations.push({
        latitude: decodedPoints[i][0],
        longitude: decodedPoints[i][1],
      });
      accumulatedDistance = 0;
    }
  }

  return intermediateLocations;
}

function calculateDistance(point1, point2) {
  const earthRadius = 6371; // Radius of the Earth in kilometers

  const lat1 = point1[0];
  const lon1 = point1[1];
  const lat2 = point2[0];
  const lon2 = point2[1];

  const dLat = (lat2 - lat1) * (Math.PI / 180); // Difference in latitude converted to radians
  const dLon = (lon2 - lon1) * (Math.PI / 180); // Difference in longitude converted to radians

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let distance = earthRadius * c; // Distance in kilometers
  // Convert distance to miles
  distance = distance * 0.621371;

  return distance;
}
