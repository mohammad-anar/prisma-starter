import { Response } from "express";

type IData<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data?: T;
};

const sendResponse = <T>(res: Response, data: IData<T>): void => {
  const resData: IData<T> = {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message || "Success",
    pagination: data.pagination || undefined,
    data: data.data || undefined,
  };

  res.status(data.statusCode).json(resData);
};

export default sendResponse;
