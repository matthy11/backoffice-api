export const decodeJsonFields = (object: any): any => {
  // some base cases: null/undefined and Arrays are kept that way
  if (object === null || object === undefined || Array.isArray(object)) {
    return object;
  }

  const objectKeys = Object.keys(object);
  const numKeys = objectKeys.length;
  const encodedObject: any = {};
  for (let i = 0; i < numKeys; i++) {
    const currKey = objectKeys[i];
    const currVal = object[currKey];
    // only encode strings
    if (typeof currVal === 'string') {
      encodedObject[currKey] = decodeURIComponent(currVal);
      continue;
    }
    // encode any other object (except Array) recursively 
    if (typeof currVal === 'object') {
      encodedObject[currKey] = decodeJsonFields(currVal);
      continue;
    }
    // if it is not an object or a string, just let it be
    encodedObject[currKey] = currVal
  }
  return encodedObject;
}