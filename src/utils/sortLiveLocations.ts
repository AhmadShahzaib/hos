export async function sortLiveLocations(liveLocations) {
    return liveLocations.sort((a, b) => {
      const dateA = a.date;
      const timeA = a.time;
      const dateB = b.date;
      const timeB = b.time;
  
      const dateTimeA = new Date(`20${dateA.slice(4, 6)}-${dateA.slice(0, 2)}-${dateA.slice(2, 4)}T${timeA.slice(0, 2)}:${timeA.slice(2, 4)}:${timeA.slice(4, 6)}`).getTime();
      const dateTimeB = new Date(`20${dateB.slice(4, 6)}-${dateB.slice(0, 2)}-${dateB.slice(2, 4)}T${timeB.slice(0, 2)}:${timeB.slice(2, 4)}:${timeB.slice(4, 6)}`).getTime();
  
      return dateTimeA - dateTimeB;
    });
  }