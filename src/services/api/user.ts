import { BASE_URL } from './api';
import { defaultHeaders } from './api.helpers';
import { type ErrorResponse } from './types/api.types';
import {
  type AuthUser,
  type RegisterUserPayload,
  type UserSuccessResponse,
} from './types/user.types';

const VERSION = 'v1';
const PATH = 'user';

const url = `${BASE_URL}/${VERSION}/${PATH}`;

export const registerUser = async (
  payload: RegisterUserPayload,
): Promise<UserSuccessResponse> => {
  try {
    const response = await fetch(`${url}/`, {
      method: 'POST',
      ...defaultHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      const parsed = (await response.json()) as ErrorResponse;
      throw new Error(parsed.error);
    }

    const parsed = await response.json();

    return parsed;
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('failed to register user');
  }
};

export const verifyUser = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/verify`, {
      method: 'POST',
      ...defaultHeaders(),
      body: JSON.stringify({ token }),
    });

    if (response.status !== 204) {
      const parsed = (await response.json()) as ErrorResponse;
      throw new Error(parsed.error);
    }

    return true;
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('failed to verify user');
  }
};

export const replayRegistration = async (email: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/replay-registration`, {
      method: 'POST',
      ...defaultHeaders(),
      body: JSON.stringify({ email }),
    });

    if (response.status !== 204) {
      const parsed = (await response.json()) as ErrorResponse;
      throw new Error(parsed.error);
    }

    return true;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }

    throw new Error('failed to replay registration');
  }
};

export const login = async (
  email: string,
  password: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/login`, {
      method: 'POST',
      ...defaultHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (response.status !== 200) {
      const parsed = (await response.json()) as ErrorResponse;
      throw new Error(parsed.error);
    }

    const parsed = (await response.json()) as UserSuccessResponse;
    return parsed.success;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }

    throw new Error('failed to authenticate user');
  }
};

export const logout = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/logout`, {
      method: 'GET',
      ...defaultHeaders(),
    });

    if (response.status !== 204) {
      const parsed = (await response.json()) as ErrorResponse;
      throw new Error(parsed.error);
    }

    return true;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }

    throw new Error('failed to logout user');
  }
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const response = await fetch(`${url}/me`, {
      method: 'GET',
      ...defaultHeaders(),
    });

    if (response.status === 401) {
      return null;
    }

    if (response.status !== 200) {
      return await refresh();
    }

    return (await response.json()) as AuthUser;
  } catch {
    return null;
  }
};

export const resetPassowrd = async (email: string): Promise<void> => {
  try {
    const response = await fetch(`${url}/reset-password`, {
      method: 'POST',
      ...defaultHeaders(),
      body: JSON.stringify({ email }),
    });

    if (response.status !== 204) {
      const parsed = (await response.json()) as ErrorResponse;
      throw new Error(parsed.error);
    }
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      throw new Error(err.message);
    }

    throw new Error('failed to reset password');
  }
};

export const verifyPasswordReset = async (
  password: string,
  token: string,
): Promise<void> => {
  try {
    const response = await fetch(`${url}/verify-password-reset`, {
      method: 'POST',
      ...defaultHeaders(),
      body: JSON.stringify({ password, token }),
    });

    if (response.status !== 204) {
      const parsed = (await response.json()) as ErrorResponse;
      throw new Error(parsed.error);
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }

    throw new Error('failed to reset password');
  }
};

export const refresh = async (): Promise<AuthUser> => {
  try {
    const response = await fetch(`${url}/refresh`, {
      method: 'POST',
      ...defaultHeaders(),
    });

    if (response.status !== 204) {
      const parsed = await response.json();
      throw new Error(parsed.message);
    }

    return (await response.json()) as AuthUser;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }

    throw new Error('refresh failed');
  }
};
