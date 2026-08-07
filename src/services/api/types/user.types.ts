export type RegisterUserPayload = {
  email: string;
  password: string;
  turnstileToken: string;
};

export type UserSuccessResponse = {
  success: boolean;
};

export type AuthUser = {
  userId: string;
  email: string;
};
