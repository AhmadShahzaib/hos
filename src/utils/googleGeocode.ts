const axios = require('axios');
import { ConfigurationService } from '@shafiqrathore/logeld-tenantbackend-common-future';

const configService = new ConfigurationService();

export async function googleGeocode(lat1, lon1, address) {
  let response;
  if (address == null) {
    response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          latlng: `${lat1},${lon1}`,
          // location_type: 'ROOFTOP',
          // result_type: 'street_address',
          key: configService.get('GOOGLE_API_KEY'),
        },
      },
    );
  } else {
    response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address: `${address}`,
          key: configService.get('GOOGLE_API_KEY'),
        },
      },
    );
  }
  return response.data.results[0];
}
