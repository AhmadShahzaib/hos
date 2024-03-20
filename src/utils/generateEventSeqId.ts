export function generateUniqueHexId() {
    const timestamp = new Date().getTime().toString(16); // Convert current timestamp to hexadecimal string
    const random = Math.floor(Math.random() * 65536).toString(16); // Generate random number between 0 and 65535 and convert to hexadecimal string
    const uniqueId = (timestamp + random).slice(-4); // Concatenate and take the last 4 characters
  
    return uniqueId.toUpperCase(); // Convert to uppercase for consistency
  }