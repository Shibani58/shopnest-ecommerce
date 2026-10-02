import { HttpErrorResponse, HttpParams } from '@angular/common/http';

/**
 * All API calls go to a relative /api path. In development `ng serve` proxies it to
 * localhost:8080 (proxy.conf.json); on Vercel a rewrite forwards it to the backend (vercel.json).
 * The browser only ever talks to one origin, so there are no CORS or cookie issues.
 */
export const API = '/api';

/** Builds query params, skipping empty values. */
export function toParams(values: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined && value !== '' && value !== false) {
      params = params.set(key, String(value));
    }
  }
  return params;
}

/** Turns any failed request into one sentence that can be shown to the user. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Cannot reach the server. It may be waking up - please try again in a few seconds.';
    }
    const body = err.error;
    const firstFieldError = Object.entries((body?.fieldErrors ?? {}) as Record<string, string>)[0];
    if (firstFieldError) {
      return `${humanise(firstFieldError[0])} ${firstFieldError[1]}`;
    }
    if (typeof body?.message === 'string') {
      return body.message;
    }
    return `Request failed (${err.status})`;
  }
  return 'Something went wrong';
}

function humanise(field: string): string {
  const last = field.split('.').pop() ?? field;
  const words = last.replace(/([A-Z])/g, ' $1').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
