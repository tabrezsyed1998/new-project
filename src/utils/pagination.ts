export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1);
  const requested = Number.parseInt(String(query.pageSize ?? DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

export function buildPage<T>(items: T[], total: number, params: PaginationParams): Paginated<T> {
  return {
    items,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize))
  };
}
