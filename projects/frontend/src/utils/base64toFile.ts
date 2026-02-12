// projects/frontend/src/utils/base64toFile.ts

export const base64ToFile = (base64String: string, filename: string): File => {
  // 1. Split the base64 string (remove "data:image/png;base64,")
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  // 2. Convert to byte array
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  // 3. Create File object
  return new File([u8arr], filename, { type: mime });
};