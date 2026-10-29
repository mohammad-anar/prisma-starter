/* eslint-disable @typescript-eslint/no-explicit-any */
export type IFolderName = "image" | "slips" | "media" | "doc" | string;

export const getSingleFilePath = (
  files: any,
  fieldName = "image",
  folderOverride?: string,
) => {
  const fileField = files && files[fieldName];
  if (fileField && Array.isArray(fileField) && fileField.length > 0) {
    let folder = folderOverride;
    if (!folder) {
      if (fieldName === "slip" || fieldName === "donationSlip") {
        folder = "slips";
      } else if (
        fieldName === "profileImage" ||
        fieldName === "avatar" ||
        fieldName === "image"
      ) {
        folder = "image";
      } else {
        folder = fieldName;
      }
    }
    return `/${folder}/${fileField[0].filename}`;
  }

  return undefined;
};

export const getMultipleFilesPath = (
  files: any,
  fieldName = "image",
  folderOverride?: string,
) => {
  const folderFiles = files && files[fieldName];
  if (folderFiles && Array.isArray(folderFiles)) {
    const folder = folderOverride || fieldName;
    return folderFiles.map((file: any) => `/${folder}/${file.filename}`);
  }

  return undefined;
};

export default {
  getSingleFilePath,
  getMultipleFilesPath,
};
