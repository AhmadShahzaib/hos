const axios = require('axios');
import { ConfigurationService } from '@shafiqrathore/logeld-tenantbackend-common-future';

const configService = new ConfigurationService();

export async function googleDirections(initialLocation, finalLocation) {
  console.log(`call ------- `);
  
  // Fetch the directions from Google Maps Directions API
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/directions/json`,
    {
      params: {
        origin: `${initialLocation.latitude},${initialLocation.longitude}`,
        destination: `${finalLocation.latitude},${finalLocation.longitude}`,
        key: configService.get('GOOGLE_API_KEY'),
      },
    },
  );

  return response;
}
