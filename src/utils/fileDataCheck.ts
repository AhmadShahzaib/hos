export const fileCheckData = (num:number) => {
    try {
      let binary = num.toString(2);
  
      if (binary.length < 16) {
        const len = 16 - binary.length;
        for (let i = 0; i < len; i++) {
          binary = '0' + binary;
        }
      }
      //   return binary
      const half = binary.length / 2;
  
      const temBinary = binary;
      const fistByte = temBinary.slice(0, half);
  
      const secByte = temBinary.slice(half, binary.length);
  
      const res1 = arrayRotate(fistByte.split('')).join('');
      const res2 = arrayRotate(secByte.split('')).join('');
      const res = res1 + res2;
  
      const xoredValue = parseInt(res, 2) ^ parseInt('1001011010011100', 2);
      let xored = xoredValue.toString(16).toUpperCase();
      if (xored.length < 4) {
        const len = 4 - xored.length;
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
  