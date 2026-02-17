/**
 * API response shapes - shared between frontend and backend.
 */

export type ChatSuccessResponse = {
  answer: string;
};

export type ChatErrorResponse = {
  answer?: string;
  error?: string;
};

export type AdminOkResponse<T = unknown> = {
  ok: true;
  data?: T;
};

export type AdminErrResponse = {
  ok: false;
  error: string;
};

export type AdminApiResponse<T = unknown> = AdminOkResponse<T> | AdminErrResponse;
