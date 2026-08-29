import { Request } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

export const fileUploadHandler = () => {
  const baseUploadDir = path.join(process.cwd(), "uploads");

  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir);
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
      const fileName =
        file.originalname
          .replace(fileExt, "")
          .toLowerCase()
          .split(" ")
          .join("-") +
        "-" +
        Date.now();
      cb(null, fileName + fileExt);
    },
  });

  const filterFilter = (req: Request, file: any, cb: any) => {
    if (
      file.fieldname === "image" ||
      file.fieldname === "profileImage" ||
      file.fieldname === "avatar"
    ) {
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/webp"
      ) {
        cb(null, true);
      } else {
        cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            "Only .jpeg, .png, .jpg, .webp file supported",
          ),
        );
      }
    } else {
      cb(null, true);
    }
  };

  return multer({
    storage: storage,
    fileFilter: filterFilter,
  }).fields([
    { name: "image", maxCount: 3 },
    { name: "profileImage", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
    { name: "media", maxCount: 3 },
    { name: "doc", maxCount: 3 },
  ]);
};

export default fileUploadHandler;
