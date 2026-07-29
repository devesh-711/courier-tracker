export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePagination(req: { query: Record<string, unknown> }): PaginationParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

export function parseSort(
  req: { query: Record<string, unknown> },
  allowedFields: string[],
  defaultField = 'createdAt',
): Record<string, 'asc' | 'desc'> {
  const sortField = (req.query.sortBy as string) || defaultField;
  const sortOrder = ((req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';

  if (allowedFields.includes(sortField)) {
    return { [sortField]: sortOrder };
  }
  return { [defaultField]: 'asc' };
}

export function parseFilter(
  req: { query: Record<string, unknown> },
  allowedFields: string[],
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  for (const field of allowedFields) {
    const value = req.query[field];
    if (value !== undefined && value !== '') {
      filter[field] = value;
    }
  }
  return filter;
}
