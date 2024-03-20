/**
 * @description : distance returned would be in miles but it can also be in ft (foot), the function handles the conversion
 */
export function distanceToMilesConverter(str) {
  const convertibleDigit = JSON.parse(str.split(' ')[0]);
  const convertibleUnit = str.split(' ')[1];

  if (convertibleUnit == 'mi') return convertibleDigit; // returning miles
  else if (convertibleUnit == 'ft') return convertibleDigit / 5280; // converting ft to miles
  else if (convertibleUnit == 'km') return convertibleDigit / 1.6; // converting ft to miles

}
