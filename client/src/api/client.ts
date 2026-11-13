const API_BASE = '/api';

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    throw new Error(
      networkErr.message || 'Unable to connect to the server. Please check your network connection.'
    );
  }

  if (!response.ok) {
    let errMessage = `Request failed with status ${response.status}`;
    try {
      // Safely read response body exactly ONCE - never re-read stream!
      const rawText = await response.text();
      try {
        const json = JSON.parse(rawText);
        errMessage = json.error || json.message || errMessage;
      } catch {
        // Handle non-JSON or HTML gateway error bodies
        const trimmed = rawText.trim();
        if (trimmed && !trimmed.startsWith('<')) {
          errMessage = trimmed;
        } else if (response.status === 502) {
          errMessage = 'Server gateway error (502): The backend application is temporarily restarting or unavailable. Please retry shortly.';
        } else if (response.status === 503) {
          errMessage = 'Service temporarily unavailable (503). Please retry in a few moments.';
        } else if (response.status === 504) {
          errMessage = 'Gateway timeout (504): The server took too long to respond.';
        } else if (response.status === 401) {
          errMessage = 'Invalid email or password credentials.';
        } else if (response.status === 403) {
          errMessage = 'Access denied: You do not have permission to access this resource.';
        } else if (response.status === 404) {
          errMessage = 'The requested endpoint or resource was not found (404).';
        } else {
          errMessage = `Server error (${response.status}). Please try again.`;
        }
      }
    } catch {
      errMessage = `Communication error (${response.status}). Unable to read response details.`;
    }
    throw new Error(errMessage);
  }

  // Handle empty or file responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response as any;
}

