import { calculateDistance, getDirection } from './distanceAndDirection';
import { googleGeocode } from './googleGeocode';

export async function getLocationDescription(latitude, longitude) {
  try {
    const geoCoded = await googleGeocode(latitude, longitude, null);

    let sublocality;
    let administrative_area_level;
    if (Object.keys(geoCoded).length > 0) {
      const address_components = geoCoded.address_components;
      for (let i = 0; i < address_components.length; i++) {
        if (address_components[i].types.includes('sublocality')) {
          sublocality = address_components[i].short_name
            ? address_components[i].short_name
            : '';
        }
        if (address_components[i].types.includes('locality')) {
          sublocality = address_components[i].short_name
            ? address_components[i].short_name
            : '';
        }
        if (
          address_components[i].types.includes('administrative_area_level_1')
        ) {
          administrative_area_level = address_components[i].short_name
            ? address_components[i].short_name
            : '';
        }
        if (
          address_components[i].types.includes('administrative_area_level_2')
        ) {
          administrative_area_level = address_components[i].short_name
            ? address_components[i].short_name
            : '';
        }
      }
      const locationName = `${sublocality}, ${administrative_area_level}`;

      let latitudeNear = geoCoded['geometry'].location.lat;
      let longitudeNear = geoCoded['geometry'].location.lng;

      const loc = locationName;

      // const addressesNearest = await geocoder.geocode(loc, 1);
      const addressesNearest = await googleGeocode(latitude, longitude, loc);

      if (Object.keys(addressesNearest).length > 0) {
        const locationNear = addressesNearest['geometry'].location;
        latitudeNear = locationNear.lat;
        longitudeNear = locationNear.lng;
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        latitudeNear,
        longitudeNear,
      );
      const direction = getDirection(
        latitude,
        longitude,
        latitudeNear,
        longitudeNear,
      );
      const location = `${distance.toFixed(
        2,
      )} mi ${direction} of ${locationName}`;

      return location;
    } else {
      return '';
    }
  } catch (e) {
    return '';
  }
}
