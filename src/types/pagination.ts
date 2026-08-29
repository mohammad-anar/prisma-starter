export type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type IPaginationResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

export interface IQueryParams {
  searchTerm?: string;
  sort?: string;
  page?: number;
  limit?: number;
  fields?: string;
  [key: string]: any;
}