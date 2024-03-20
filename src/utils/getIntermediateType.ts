export const getIntermediateType = (log) => {
  // For DR -> 1 | PC -> 2 | YM -> 3 | Off -> 4 | SB -> 5 | ON -> 6
  if (log.eventType == '1' && log.eventCode == '3') return '1';
  else if (log.eventType == '3' && log.eventCode == '1') return '2';
  else if (log.eventType == '3' && log.eventCode == '2') return '3';
  else if (log.eventType == '1' && (log.eventCode == '1' )) return '4';
  else if (log.eventType == '1' && ( log.eventCode == '2' )) return '5';
  else if (log.eventType == '1' && ( log.eventCode == '4')) return '6';



};
