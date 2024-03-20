export const fileCheckData = (num:number) => {
    try {
      let binary = num.toString(2);
  
      if (binary.length < 16) {
        let len = 16 - binary.length;
        for (let i = 0; i < len; i++) {
          binary = '0' + binary;
        }
      }
      //   return binary
      let half = binary.length / 2;
  
      let temBinary = binary;
      let fistByte = temBinary.slice(0, half);
  
      let secByte = temBinary.slice(half, binary.length);
  
      let res1 = arrayRotate(fistByte.split('')).join('');
      let res2 = arrayRotate(secByte.split('')).join('');
      let res = res1 + res2;
  
      let xoredValue = parseInt(res, 2) ^ parseInt('1001011010011100', 2);
      let xored = xoredValue.toString(16).toUpperCase();
      if (xored.length < 4) {
        let len = 4 - xored.length;
        for (let i = 0; i < len; i++) {
          xored = '0' + xored;
        }
      }
  
      return xored;
    } catch (err) {}
  };
  function arrayRotate(arr) {
    for (let i = 0; i < 3; i++) {
      arr.push(arr.shift());
    }
  
    return arr;
  }
  