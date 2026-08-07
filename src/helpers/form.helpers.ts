export const rules = {
  email: (s: string) =>
    new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).test(s),
  uppercase: (s: string) => new RegExp(/[A-Z]/).test(s),
  symbols: (s: string) => new RegExp(/[!@#$%^&*()]/).test(s),
  numeric: (s: string) => new RegExp(/\d/).test(s),
  length: (s: string) => s.length > 8,
};
