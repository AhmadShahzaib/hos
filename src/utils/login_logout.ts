import { formateDate } from "./formateDate";
import { generateUniqueHexId } from "./generateEventSeqId";
import moment from "moment";

export function insert_Login_Logout(loginlogout, statusInfo, date, time,name,timezone) {
    const sqID = generateUniqueHexId()
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
const loginLogoutLog ={
        "eldUsername": name,
        "eventCode":statusInfo.eventCode,
        "eventDate":moment(date).tz(timezone).format('MMDDYY'),
        "eventSequenceIdNumber": generateUniqueHexId(),
        "eventTime": time,
        "eventTypeExtra": "5",
    "lineDataCheckValue": "1A",
         "loginLatitude": statusInfo.lat,
    "loginLongitude": statusInfo.long,
                     "address": statusInfo.address,
        "totalEngineHours": Ehours,
        "totalEngineHoursDutyStatus": statusInfo.engineHour,
        "totalVehicleMiles": odometer,
    "totalVehicleMilesDutyStatus": statusInfo.odometer,
    "notes": statusInfo?.notes,
      } 
          loginlogout.push(loginLogoutLog)
          loginlogout = loginlogout.sort((a, b) => a.eventTime - b.eventTime);
  }