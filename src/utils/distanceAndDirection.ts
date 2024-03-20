export function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371; // Radius of the Earth in kilometers

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

export function getDirection(fromLat, fromLng, toLat, toLng) {
  const angle = getAngle(fromLat, fromLng, toLat, toLng);
  if (angle >= 0 && angle <= 22.5) {
    return 'N';
  } else if (angle > 22.5 && angle <= 67.5) {
    return 'NE';
  } else if (angle > 67.5 && angle <= 112.5) {
    return 'E';
  } else if (angle > 112.5 && angle <= 157.5) {
    return 'SE';
  } else if (angle > 157.5 && angle <= 202.5) {
    return 'S';
  } else if (angle > 202.5 && angle <= 247.5) {
    return 'SW';
  } else if (angle > 247.5 && angle <= 292.5) {
    return 'W';
  } else if (angle > 292.5 && angle <= 337.5) {
    return 'NW';
  } else {
    return 'N';
  }
}

function getAngle(fromLat, fromLng, toLat, toLng) {
  const dLon = toLng - fromLng;
  const y = Math.sin(toRadians(dLon)) * Math.cos(toRadians(toLat));
  const x =
    Math.cos(toRadians(fromLat)) * Math.sin(toRadians(toLat)) -
    Math.sin(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.cos(toRadians(dLon));
  let angle = toDegrees(Math.atan2(y, x));
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}

function toRadians(degree) {
  return degree * (Math.PI / 180);
}

function toDegrees(radians) {
  return radians * (180 / Math.PI);
}
