export type ApiError = {
  message: string;
  status?: number;
  code?: string;
};

export type ValidationError = {
  field: string;
  message: string;
};

export type ApiResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: ApiError;
};

export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  hasMore: boolean;
  page: number;
  totalPages: number;
};

export type SortOrder = 'asc' | 'desc';

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type FilterParams = {
  sortBy?: string;
  sortOrder?: SortOrder;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type SearchParams = {
  query?: string;
} & PaginationParams & FilterParams;