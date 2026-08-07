export const defaultHeaders = () => {
  return {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include' as const,
  };
};
