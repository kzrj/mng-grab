const DEFAULT_TIMEOUT_MS = 10000;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type FetchJsonOptions = RequestInit & {
  timeoutMs?: number;
};

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Ошибка ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

