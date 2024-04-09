import { formateDate } from "./formateDate";
import { generateUniqueHexId } from "./generateEventSeqId";
import moment from "moment";

export function insert_powerup_powerdown(poweruppowerdown, statusInfo, date, time, cmvPowerUnitNumber, cmvVin, timezone) {
    let odometer
    let Ehours
    if (statusInfo.odometer > Number('9999999')) {
        odometer = '9999999'
    } else { 
        odometer = statusInfo.odometer

    }
              if (statusInfo.engineHour > Number('99999.9')) { 
              Ehours= '99999.9'
              } else {
                  Ehours = statusInfo.engineHour
            }
    let sqID = generateUniqueHexId()
const powerup_powerdown ={
                    "address": statusInfo.address,
                    "cmvPowerUnitNumber": cmvPowerUnitNumber,
                    "cmvVin": cmvVin,
                    "eventCode": statusInfo.eventCode,
                    "eventDate":moment(date).tz(timezone).format('MMDDYY'),
                    "eventLatitude": statusInfo.lat,
                    "eventLongitude": statusInfo.long,
                    "eventSequenceIdNumber": generateUniqueHexId(),
                    "eventTime": time,
                    "eventTypeExtra": statusInfo.eventType,
                    "lineDataCheckValue": "BC",
                    "shippingDocumentNumber": "0",
                    "totalEngineHours": Ehours,
    "totalEngineHoursDutyStatus": statusInfo.engineHour,
                    "totalVehicleMilesDutyStatus": statusInfo.odometer,
                    "totalVehicleMiles": odometer,
    
                    "notes": statusInfo?.notes,
                    "trailerNumber": ""
                }
          poweruppowerdown.push(powerup_powerdown)
          poweruppowerdown = poweruppowerdown.sort((a, b) => a.eventTime - b.eventTime);
  }