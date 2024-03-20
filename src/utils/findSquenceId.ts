export async function findSqID(logs) { 
 const ids = logs.map(log => parseInt(log.eventSequenceIdNumber, 10));
  ids.sort((a, b) => a - b);

  let missingId = 1;
  for (const id of ids) {
    if (id === missingId) {
      missingId++;
    } else {
      break;
    }
  }

  return missingId;

}