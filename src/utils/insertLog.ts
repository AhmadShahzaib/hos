import { generateUniqueHexId } from "./generateEventSeqId";
import { Length } from '../../../logEld-TenantBackendMicroservices-Assets-Future/src/models/length.model';

export async function insertLog(logs, newLog, startTime, endTime) {
    let updatedLogs = [...logs];
    let newArray
    if (updatedLogs.length == 1) { 
        
         updatedLogs.push(newLog)
        let log = JSON.parse(JSON.stringify(updatedLogs[0]))
        log.eventSequenceIdNumber = generateUniqueHexId()
        updatedLogs.push(log)
        updatedLogs[2].eventTime = endTime
        newArray=updatedLogs
        if (startTime == '000000' && endTime == '235959') { 
            newArray = []
            newArray.push(newLog)
        }
        if (startTime == '000000' && endTime != '235959') { 
            newArray = []
            newArray.push(newLog)
            log.eventTime = endTime
            newArray.push(log)
        }
    }
    
    else {
        
    let beforeIndex = 0
        for (let i = 0; i < logs.length; i++) {
            const stime = logs[i].eventTime;
            let etime 
            if (logs.length - 1 == i) {
                etime = '235900'
                
            } else { 
                etime = logs[i+1].eventTime;
            }

            if ((stime <= startTime && etime >= startTime)) {
                // arr = JSON.parse(JSON.stringify(logs[i]))
                beforeIndex = i
                break
            }
            if (i == logs.length-1) { 
               
                // arr = JSON.parse(JSON.stringify(logs[i]))
                beforeIndex = i
            
            }
        }
        let afterIndex = logs.length-1
        for (let i = beforeIndex; i < logs.length; i++) {
            let stime = logs[i].eventTime;
            // if (i == logs.length - 1) { 
            //          stime = '240000';
            // }
            
            // const etime = logs[i+1].eventTime;

            if (stime>=endTime) {
                // arr = JSON.parse(JSON.stringify(logs[i]))
                afterIndex = i-1
                break
            }
            // if (stime>=endTime && i== logs.length-1) {
            //     // arr = JSON.parse(JSON.stringify(logs[i]))
            //     afterIndex = i
            //     break
            // }
            
        }
        const array1 = logs.slice(0, beforeIndex + 1); // Slicing from the beginning to index1 (inclusive)
        const array2 = logs.slice(afterIndex);
        let flag = true
        if (array1.length > 1 && array2.length == 1) {
            const last = JSON.parse(JSON.stringify(array2[0]))
            last.eventTime = endTime
            last.eventSequenceIdNumber = generateUniqueHexId()
            newArray = [...array1, newLog, last]
            flag=false
        }
         if (array1.length == 1 && array2.length > 1 && (array1[0].eventTime == array2[0].eventTime)){ 
            const first = JSON.parse(JSON.stringify(array2.splice(0, 1)[0]))
             first.eventTime = endTime
             first.eventSequenceIdNumber = generateUniqueHexId()
             if (startTime != '000000') {
                 newArray = [...array1, newLog, first, ...array2]
             } else {
                  newArray = [ newLog, first, ...array2]
             }
             flag=false
         }
        if (array1[array1.length - 1].eventTime == array2[0].eventTime) { 
            let last = JSON.parse(JSON.stringify(array2.splice(0, 1)[0]))
            const first = array1.pop();
            last.eventTime = endTime 
            last.eventSequenceIdNumber = generateUniqueHexId()
             newArray = [...array1,first, newLog, last,...array2]
             flag=false
        }
        if (array1.length == 1 && startTime == '000000') { 
            newArray =[]
            // const a = logs.slice(0, beforeIndex + 1); // Slicing from the beginning to index1 (inclusive)
            const b = logs.slice(afterIndex,logs.length);
            let last = JSON.parse(JSON.stringify(b.splice(0, 1)[0]))
            last.eventTime = endTime
            newLog.eventTime = startTime

            newArray = [newLog, last, ...b]
            flag=false
        }
        if(flag){
     array2[0].eventTime = endTime
        newArray = [...array1, newLog, ...array2]
        }
        
   
        // updatedLogs=newArray
        // let beforeLog = JSON.parse(JSON.stringify(updatedLogs[]))
        // if (beforeIndex == logs.length) {
        













        

        //         let foundedLog = copyLogs.splice(beforeIndex, 1);
        // foundedLog = JSON.parse(JSON.stringify(foundedLog))
        // let afterLog;
        // // if (afterIndex != -1) {
        // afterLog = updatedLogs.splice(afterIndex, 1);
        // updatedLogs.splice(beforeIndex, 1)[0];
        //     afterLog = JSON.parse(JSON.stringify(afterLog))
        //     afterLog.eventTime = endTime
        //     afterLog.eventSequenceIdNumber = generateUniqueHexId()


        //     foundedLog.eventSequenceIdNumber = generateUniqueHexId()
        // updatedLogs.push(foundedLog)
        //     updatedLogs.push(newLog)
        // updatedLogs.push(afterLog)
        
























        // console.log("c");
        
        // }
        // let foundedLog = updatedLogs.splice(index, 1)[0];
        // foundedLog = JSON.parse(JSON.stringify(foundedLog))
        // foundedLog.eventTime = startTime
        // foundedLog.eventSequenceIdNumber = generateUniqueHexId()
        // updatedLogs.push(newLog)
        // updatedLogs.push(foundedLog)
        // console.log("c");
        
    }
// updatedLogs[index-1].eventTime = newLog.event

    newArray = newArray.sort((a, b) => a.eventTime.localeCompare(b.eventTime));
    if (endTime == '235959') {
        newArray.pop()
    }
  return newArray;
}
