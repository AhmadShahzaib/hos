import { ConfigurationService } from '@shafiqrathore/logeld-tenantbackend-common-future';
import LogsDocument from "mongoDb/document/document";
import NodeGeocoder from "node-geocoder";

const configService = new ConfigurationService()
const options = {
    provider: 'google',
    apiKey: configService.get('GOOGLE_API_KEY'),
    formatter: null
};
const geocoder = NodeGeocoder(options);

export async function getAddress(data: LogsDocument) {
    const updateAddressObject = {};
    if (isLatitude(data.lastKnownLocation.latitude) && isLongitude(data.lastKnownLocation.longitude)) {
        updateAddressObject['lastKnownLocation.address'] = await getAddressForCoordinates(data.lastKnownLocation.latitude, data.lastKnownLocation.longitude);
    }
    if (isLatitude(data.secondLastKnownLocation.latitude) && isLongitude(data.secondLastKnownLocation.longitude)) {
        updateAddressObject['secondLastKnownLocation.address'] = await getAddressForCoordinates(data.secondLastKnownLocation.latitude, data.secondLastKnownLocation.longitude);
    }
    if (updateAddressObject) {
        await data?.updateOne({ $set: updateAddressObject });
    }
    for (let index = 0; index < data.logs.length; index++) {
        const element = data.logs[index];
        if (!element.address && isLatitude(element.geoLocation.latitude) && isLongitude(element.geoLocation.longitude)) {
            const address = await getAddressForCoordinates(element.geoLocation.latitude, element.geoLocation.longitude);
            await data?.updateOne(
                { $set: { "logs.$[outer].address": address } },
                { "arrayFilters": [{ "outer._id": `${element._id}` }] })
        }
    }
}

async function getAddressForCoordinates(lat: number, lon: number) {
    let response;
    try {
        if (lat === 0 && lon === 0) {
            return response = '';
        }
        const apiResponse = await geocoder.reverse({ lat: lat, lon: lon });
        response = apiResponse[0]?.formattedAddress || '';
        return response;
    } catch (error) {
        console.log(error);
        response = "";
        return response;
    }
}

const isLatitude = num => isFinite(num) && Math.abs(num) <= 90;
const isLongitude = num => isFinite(num) && Math.abs(num) <= 180;