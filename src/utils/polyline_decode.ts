/**
 * @input encrypted string
 * @description The function is based on Polyline Algorithm. The decoder is used to decode the latitudes and longitudes
 * @returns decoded latitudes and logitudes
 */

function decodePolyline(polyline) {
  var index = 0;
  var lat = 0;
  var lng = 0;
  var coordinates = [];

  while (index < polyline.length) {
    var shift = 0;
    var result = 0;
    var byte;
    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    var deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    var deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}
