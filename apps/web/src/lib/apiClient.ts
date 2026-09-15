const _BASE_URL = '';
const _JSON_CONTENT_TYPE = 'application/json';
const _ERROR_STATUS_THRESHOLD = 400;
const _UNKNOWN_ERROR_CODE = 'unknown_error';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractCode(body: unknown, status: number): string {
  let result = `${_UNKNOWN_ERROR_CODE}_${status}`;

  if (isRecord(body) && typeof body.error === 'string') {
    result = body.error;
  }

  return result;
}

function extractMessage(body: unknown, status: number): string {
  let result = `Request failed with status ${status}`;

  if (isRecord(body) && typeof body.message === 'string') {
    result = body.message;
  }

  return result;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(extractMessage(body, status));
    this.name = 'ApiError';
    this.status = status;
    this.code = extractCode(body, status);
    this.body = body;
  }
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function parseJson(response: Response): Promise<unknown> {
  let result: unknown = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  return result;
}

export interface ResponseWithHeaders<T> {
  data: T;
  headers: Headers;
}

async function requestWithHeaders<T>(
  path: string,
  options: RequestOptions
): Promise<ResponseWithHeaders<T>> {
  const hasBody = options.method === 'POST' || options.method === 'PUT';
  const headers: HeadersInit = hasBody ? { 'Content-Type': _JSON_CONTENT_TYPE } : {};

  const response = await fetch(`${_BASE_URL}${path}`, {
    method: options.method,
    credentials: 'include',
    headers,
    body: hasBody ? JSON.stringify(options.body ?? {}) : undefined,
  });

  const parsedBody = await parseJson(response);

  if (response.status >= _ERROR_STATUS_THRESHOLD) {
    throw new ApiError(response.status, parsedBody);
  }

  const result: ResponseWithHeaders<T> = { data: parsedBody as T, headers: response.headers };

  return result;
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const { data } = await requestWithHeaders<T>(path, options);
  const result = data;

  return result;
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const result = await request<T>(path, { method: 'GET' });

    return result;
  },

  async getWithHeaders<T>(path: string): Promise<ResponseWithHeaders<T>> {
    const result = await requestWithHeaders<T>(path, { method: 'GET' });

    return result;
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const result = await request<T>(path, { method: 'POST', body });

    return result;
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const result = await request<T>(path, { method: 'PUT', body });

    return result;
  },

  async del<T>(path: string): Promise<T> {
    const result = await request<T>(path, { method: 'DELETE' });

    return result;
  },
};
