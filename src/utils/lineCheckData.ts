export const lineCheckData = (num) => {
    try {
      const binary = ('000000000' + Number(num).toString(2)).substr(-8);
      const res = arrayRotate(binary.split('')).join('');
      return res;
      //   console.log("for line data check:",Xoredvalue);
      //    Xoredvalue=  parseInt(res, 2) ^ parseInt('11000011', 2);
      //   console.log("for line data check:",Xoredvalue);
    } catch (err) {}
  };
  function arrayRotate(arr) {
    for (let i = 0; i < 3; i++) {
      arr.push(arr.shift());
    }
  
    return arr;
  }
  