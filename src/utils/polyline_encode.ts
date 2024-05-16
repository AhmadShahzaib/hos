/**
 *  * @input list of latitudes and longitudes
 * @description The function is based on Polyline Algorithm. The encoder is used to encode the latitudes and longitudes
 * @returns encoded string
 */

export function encodePolyline(coordinates) {
  function encodeValue(value) {
    value = Math.round(value * 1e5);
    value = value << 1;
    if (value < 0) {
      value = ~value;
    }
    var encoded = '';
    while (value >= 0x20) {
      encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    encoded += String.fromCharCode(value + 63);
    return encoded;
  }

  var encodedPolyline = '';
  var prevLat = 0;
  var prevLng = 0;

  coordinates.forEach(function (coordinate) {
    var lat = coordinate[0];
    var lng = coordinate[1];
    encodedPolyline += encodeValue(lat - prevLat);
    encodedPolyline += encodeValue(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  });

  return encodedPolyline;
}
