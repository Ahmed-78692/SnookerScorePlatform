const getApiBase = () =>
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5078`
    : 'http://localhost:5078';

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Error ${res.status}`);
  }

  return res.json();
}
