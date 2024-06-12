import { lineCheckData } from './lineCheckData';

export const checkSum = (str) => {
  try {
    let checkSumVal = 0;
    for (const letter of str) {
      checkSumVal += checkSumChar(letter);
    }
    const checkLineData = lineCheckData(checkSumVal);
    const xoredValue = parseInt(checkLineData, 2) ^ parseInt('10010110', 2);
    
    const hexaString = xoredValue.toString(16).toUpperCase();
    let xored = hexaString;
    if (xored.length < 2) {
      const len = 2 - xored.length;
      for (let i = 0; i < len; i++) {
        xored = '0' + xored;
      }
    }
    return { lineData: xoredValue, hexa: xored };
  } catch (err) {}
};
export const eventCheckSum = (lineStr:string) => {
  try {
    let checkSumVal = 0;
    for (const letter of lineStr) {
     

        checkSumVal += checkSumChar(letter);
     
    }
    const checkLineData = lineCheckData(checkSumVal);
    const xoredValue = parseInt(checkLineData, 2) ^ parseInt('11000011', 2);
    const hexaString = xoredValue.toString(16).toUpperCase();
    let xored = hexaString;
    if (xored.length < 2) {
      const len = 2 - xored.length;
      for (let i = 0; i < len; i++) {
        xored = '0' + xored;
      }
    }
    return { lineData: checkLineData, hexa: xored };
  } catch (err) {}
};
export const checkSumChar = (str:any) => {
  try {
    let temp:number = 0;
    switch (str) {
      case '1':
        temp = 1;
        break;
      case '2':
        temp = 2;
        break;
      case '3':
        temp = 3;
        break;
      case '4':
        temp = 4;
        break;
      case '5':
        temp = 5;
        break;
      case '6':
        temp = 6;
        break;
      case '7':
        temp = 7;
        break;
      case '8':
        temp = 8;
        break;
      case '9':
        temp = 9;
        break;
      case 'A':
        temp = 17;
        break;
      case 'B':
        temp = 18;
        break;
      case 'C':
        temp = 19;
        break;
      case 'D':
        temp = 20;
        break;
      case 'E':
        temp = 21;
        break;
      case 'F':
        temp = 22;
        break;
      case 'G':
        temp = 23;
        break;
      case 'H':
        temp = 24;
        break;
      case 'I':
        temp = 25;
        break;
      case 'J':
        temp = 26;
        break;
      case 'K':
        temp = 27;
        break;
      case 'L':
        temp = 28;
        break;
      case 'M':
        temp = 29;
        break;
      case 'N':
        temp = 30;
        break;
      case 'O':
        temp = 31;
        break;

      case 'P':
        temp = 32;
        break;
      case 'Q':
        temp = 33;
        break;
      case 'R':
        temp = 34;
        break;
      case 'S':
        temp = 35;
        break;
      case 'T':
        temp = 36;
        break;
      case 'U':
        temp = 37;
        break;
      case 'V':
        temp = 38;
        break;

      case 'W':
        temp = 39;
        break;
      case 'X':
        temp = 40;
        break;
      case 'Y':
        temp = 41;
        break;
      case 'Z':
        temp = 42;
        break;
      case 'a':
        temp = 49;
        break;
      case 'b':
        temp = 50;
        break;
      case 'c':
        temp = 51;
        break;
      case 'd':
        temp = 52;
        break;
      case 'e':
        temp = 53;
        break;
      case 'f':
        temp = 54;
        break;
      case 'g':
        temp = 55;
        break;
      case 'h':
        temp = 56;
        break;
      case 'i':
        temp = 57;
        break;
      case 'j':
        temp = 58;
        break;
      case 'k':
        temp = 59;
        break;
      case 'l':
        temp = 60;
        break;
      case 'm':
        temp = 61;
        break;
      case 'n':
        temp = 62;
        break;
      case 'o':
        temp = 63;
        break;

      case 'p':
        temp = 64;
        break;
      case 'q':
        temp = 65;
        break;
      case 'r':
        temp = 66;
        break;
      case 's':
        temp = 67;
        break;
      case 't':
        temp = 68;
        break;
      case 'u':
        temp = 69;
        break;
      case 'v':
        temp = 70;
        break;

      case 'w':
        temp = 71;
        break;
      case 'x':
        temp = 72;
        break;
      case 'y':
        temp = 73;
        break;
      case 'z':
        temp = 74;
        break;
      default:
        temp = 0;
        break;
      // code block
    }
    return temp;
  } catch (err) {
    return err;
  }
};
