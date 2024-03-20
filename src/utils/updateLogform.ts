import { firstValueFrom } from 'rxjs';
export async function updateLogform(reportClient,ship, signature, driverId, date, companyTimeZone,trailerNumber) { 
     const logform = await firstValueFrom(
              reportClient.send(
                { cmd: 'update_logform' }
                , { from:"",to:"",ship,signature,driverId,date,companyTimeZone,trailerNumber}
              ),
            );
return true
}