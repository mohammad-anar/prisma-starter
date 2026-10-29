import { Request } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export const fileUploadHandler = () => {
  const baseUploadDir = path.join(process.cwd(), "uploads");

  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
  }

  const createFolder = (folderPath: string) => {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  };

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadDir;
      switch (file.fieldname) {
        case "image":
        case "profileImage":
        case "avatar":
          uploadDir = path.join(baseUploadDir, "image");
          break;
        case "slip":
        case "donationSlip":
          uploadDir = path.join(baseUploadDir, "slips");
          break;
        case "media":
        case "video":
          uploadDir = path.join(baseUploadDir, "media");
          break;
        case "doc":
        case "document":
          uploadDir = path.join(baseUploadDir, "doc");
          break;
        default:
          uploadDir = baseUploadDir;
      }
      createFolder(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const cleanBase = path
        .basename(file.originalname, fileExt)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
      const fileName = `${cleanBase}-${Date.now()}${fileExt}`;
      cb(null, fileName);
    },
  });

  const fileFilter = (req: Request, file: any, cb: any) => {
    const isImage =
      file.fieldname === "image" ||
      file.fieldname === "profileImage" ||
      file.fieldname === "avatar" ||
      file.fieldname === "slip" ||
      file.fieldname === "donationSlip";

    if (isImage) {
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "application/pdf",
      ];
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            "Only .jpeg, .png, .jpg, .webp or .pdf files are supported for images and slips",
          ),
        );
      }
    } else {
      cb(null, true);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }).fields([
    { name: "image", maxCount: 3 },
    { name: "profileImage", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
    { name: "slip", maxCount: 1 },
    { name: "donationSlip", maxCount: 1 },
    { name: "media", maxCount: 3 },
    { name: "doc", maxCount: 3 },
  ]);
};

export default fileUploadHandler;
