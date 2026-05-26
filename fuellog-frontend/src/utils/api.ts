// ============================================================
//  FuelLog Frontend — src/utils/api.ts
//  Central API helper — all backend calls go through here
//  Automatically attaches JWT token to every request
// ============================================================

const API_BASE = 'http://localhost:3001/api';

// ── Get JWT token from localStorage ─────────────────────────
function getToken(): string | null {
  return localStorage.getItem('fl_token');
}

// ── Build headers with JWT token ────────────────────────────
function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ── Handle API response ──────────────────────────────────────
async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data as T;
}


// ============================================================
//  AUTH
// ============================================================
export const authAPI = {

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    return handleResponse<{ token: string; user: { id: number; email: string } }>(res);
  },

  signup: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    return handleResponse<{ message: string }>(res);
  },

  resend: async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/resend`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });
    return handleResponse<{ message: string }>(res);
  },

  verify: async (token: string) => {
    const res = await fetch(`${API_BASE}/auth/verify?token=${token}`);
    return handleResponse<{ message: string }>(res);
  },
};


// ============================================================
//  CARS
// ============================================================
export const carsAPI = {

  getAll: async () => {
    const res = await fetch(`${API_BASE}/cars`, {
      headers: authHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  add: async (car: {
    id:        string;
    name:      string;
    country:   string;
    purchased?: string;
    reg?:       string;
    note?:      string;
    active?:    boolean;
  }) => {
    const res = await fetch(`${API_BASE}/cars`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify(car),
    });
    return handleResponse<any>(res);
  },

  update: async (carId: string, updates: any) => {
    const res = await fetch(`${API_BASE}/cars/${carId}`, {
      method:  'PATCH',
      headers: authHeaders(),
      body:    JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  setActive: async (carId: string) => {
    const res = await fetch(`${API_BASE}/cars/${carId}/setactive`, {
      method:  'PATCH',
      headers: authHeaders(),
    });
    return handleResponse<any>(res);
  },

  delete: async (carId: string) => {
    const res = await fetch(`${API_BASE}/cars/${carId}`, {
      method:  'DELETE',
      headers: authHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },
};


// ============================================================
//  FUEL ENTRIES
// ============================================================
export const fuelAPI = {

  getAll: async (carId: string) => {
    const res = await fetch(`${API_BASE}/fuel/${carId}`, {
      headers: authHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  add: async (entry: {
    id?:      string;
    car_id:   string;
    date:     string;
    km:       number;
    fuel:     number;
    price?:   number;
    total_km?: number | null;
    mileage?:  number | null;
    amount?:   number | null;
    place?:    string;
  }) => {
    const res = await fetch(`${API_BASE}/fuel`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify(entry),
    });
    return handleResponse<any>(res);
  },

  update: async (entryId: string, updates: any) => {
    const res = await fetch(`${API_BASE}/fuel/${entryId}`, {
      method:  'PATCH',
      headers: authHeaders(),
      body:    JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  delete: async (entryId: string) => {
    const res = await fetch(`${API_BASE}/fuel/${entryId}`, {
      method:  'DELETE',
      headers: authHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },
};


// ============================================================
//  SERVICE ENTRIES
// ============================================================
export const serviceAPI = {

  getAll: async (carId: string) => {
    const res = await fetch(`${API_BASE}/service/${carId}`, {
      headers: authHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  add: async (entry: {
    id?:     string;
    car_id:  string;
    date:    string;
    km?:     number | null;
    amount:  number;
    remarks?: string;
  }) => {
    const res = await fetch(`${API_BASE}/service`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify(entry),
    });
    return handleResponse<any>(res);
  },

  update: async (entryId: string, updates: any) => {
    const res = await fetch(`${API_BASE}/service/${entryId}`, {
      method:  'PATCH',
      headers: authHeaders(),
      body:    JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  delete: async (entryId: string) => {
    const res = await fetch(`${API_BASE}/service/${entryId}`, {
      method:  'DELETE',
      headers: authHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },
};


// ============================================================
//  REPORTS
// ============================================================
export const reportsAPI = {

  summary: async (carId: string) => {
    const res = await fetch(`${API_BASE}/reports/summary/${carId}`, {
      headers: authHeaders(),
    });
    return handleResponse<any>(res);
  },

  yearly: async (carId: string) => {
    const res = await fetch(`${API_BASE}/reports/yearly/${carId}`, {
      headers: authHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  monthly: async (carId: string) => {
    const res = await fetch(`${API_BASE}/reports/monthly/${carId}`, {
      headers: authHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  stations: async (carId: string) => {
    const res = await fetch(`${API_BASE}/reports/stations/${carId}`, {
      headers: authHeaders(),
    });
    return handleResponse<any[]>(res);
  },
};
