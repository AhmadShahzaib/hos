export async function removeObjectByEventSequenceId(arr, sqID) {
  // Use the findIndex() method to find the index of the object
  const indexToRemove = arr.findIndex(obj => obj.eventSequenceIdNumber === sqID);

  // Initialize a variable to store the removed object
  let removedObject = null;

  // Check if the object was found
  if (indexToRemove !== -1) {
    // Remove the object using splice() and store it in removedObject
    removedObject = arr.splice(indexToRemove, 1)[0];
  }

  // Return the removed object
  return removedObject;
}
