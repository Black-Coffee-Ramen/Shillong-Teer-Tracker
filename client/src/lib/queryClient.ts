import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = '';
    try {
      // Try to parse error as JSON first
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        
        // Handle different error responses
        if (errorData.message) {
          errorMessage = errorData.message;
          
          // If there are validation errors, include them in a more user-friendly way
          if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            // Format validation errors more nicely
            if (errorData.errors[0].path && errorData.errors[0].message) {
              // For structured errors with path and message
              const fieldName = errorData.errors[0].path.slice(-1)[0];
              errorMessage = `${fieldName}: ${errorData.errors[0].message}`;
            } else if (typeof errorData.errors[0] === 'string') {
              // For simple string errors
              errorMessage += `: ${errorData.errors[0]}`;
            } else if (errorData.errors[0].message) {
              // For errors with just a message
              errorMessage += `: ${errorData.errors[0].message}`;
            }
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else {
        errorMessage = await res.text();
      }
      
      // Add more context based on status code
      if (res.status === 401) {
        errorMessage = errorMessage || 'You need to log in to access this feature';
      } else if (res.status === 403) {
        errorMessage = errorMessage || 'You do not have permission to perform this action';
      } else if (res.status === 404) {
        errorMessage = errorMessage || 'The requested resource was not found';
      } else if (res.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
    } catch (e) {
      // Fallback to status text if JSON parsing fails
      errorMessage = res.statusText;
    }
    
    // Throw a more descriptive error
    throw new Error(errorMessage || `Error ${res.status}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Return the response body as JSON
  return await res.json() as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
