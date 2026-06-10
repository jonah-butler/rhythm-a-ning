// import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { type ChangeEvent, useRef, useState } from 'react';
import BasicCard from '../components/Cards/BasicCard';
import '../css/Register.css';

// const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

enum ValidationErrors {
  InvalidPassword,
  InvalidEmail,
  VerifyPassword,
}

const ValidationMessages: Record<ValidationErrors, React.ReactNode> = {
  [ValidationErrors.InvalidPassword]: (
    <>
      Passwords must include:
      <ul className="color-white">
        <li>1 capital letter</li>
        <li>1 number</li>
        <li>
          1 symbol: <code className="border-radius-2 bg-black">!@#$%^&*()</code>
        </li>
        <li>at least 8 characters</li>
      </ul>
    </>
  ),
  [ValidationErrors.InvalidEmail]: 'Not a valid email address',
  [ValidationErrors.VerifyPassword]: 'Passwords must match',
};

const rules = {
  email: (s: string) =>
    new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).test(s),
  uppercase: (s: string) => new RegExp(/[A-Z]/).test(s),
  symbols: (s: string) => new RegExp(/[!@#$%^&*()]/).test(s),
  numeric: (s: string) => new RegExp(/\d/).test(s),
  length: (s: string) => s.length > 8,
};

const isPasswordValid = (s: string) =>
  [
    rules.length(s),
    rules.numeric(s),
    rules.symbols(s),
    rules.uppercase(s),
  ].every((validation) => validation);

export default function Register() {
  const timerRef = useRef<null | number>(null);
  // const turnstileRef = useRef<TurnstileInstance | null>(null);

  const cancelTimeout = (timer: number) => clearTimeout(timer);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');

  const [verifyPasswordDisabled, setVerifyPasswordDisable] = useState(true);

  // const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState<ValidationErrors[]>(
    [],
  );

  // const canSubmit =
  //   email.length > 0 &&
  //   password.length > 0 &&
  //   verifyPassword.length > 0 &&
  //   rules.email(email) &&
  //   isPasswordValid(password) &&
  //   password === verifyPassword &&
  //   turnstileToken !== null;

  const updateEmail = (event: ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) cancelTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const isValid = rules.email(event.target.value);
      const index = validationErrors.findIndex(
        (error) => error === ValidationErrors.InvalidEmail,
      );
      if (!isValid) {
        setValidationErrors((prev) => {
          const errors = [...prev];
          if (index === -1) {
            errors.push(ValidationErrors.InvalidEmail);
          }
          return errors;
        });
      } else {
        if (index !== -1) {
          setValidationErrors((prev) => {
            const errors = [...prev];
            errors.splice(index, 1);
            return errors;
          });
        }
      }
    }, 1500);

    setEmail(event.target.value);
  };

  const updatePassword = (event: ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) cancelTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const input = event.target.value;

      const isValid = isPasswordValid(input);

      const index = validationErrors.findIndex(
        (error) => error === ValidationErrors.InvalidPassword,
      );
      if (!isValid) {
        setValidationErrors((prev) => {
          const errors = [...prev];
          if (index === -1) {
            errors.push(ValidationErrors.InvalidPassword);
          }
          return errors;
        });
        setVerifyPasswordDisable(true);
      } else {
        if (index !== -1) {
          setValidationErrors((prev) => {
            const errors = [...prev];
            errors.splice(index, 1);
            return errors;
          });
        }
        setVerifyPasswordDisable(false);
      }
    }, 800);

    setPassword(event.target.value);
  };

  const updateVerifyPassword = (event: ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) cancelTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const input = event.target.value;

      const index = validationErrors.findIndex(
        (error) => error === ValidationErrors.VerifyPassword,
      );

      if (input !== password) {
        setValidationErrors((prev) => {
          const errors = [...prev];
          if (index === -1) {
            errors.push(ValidationErrors.VerifyPassword);
          }
          return errors;
        });
      } else {
        if (index !== -1) {
          setValidationErrors((prev) => {
            const errors = [...prev];
            errors.splice(index, 1);
            return errors;
          });
        }
      }
    }, 800);

    setVerifyPassword(event.target.value);
  };

  return (
    <div className="mt-4 flex justify-center flex-auto align-center flex-col">
      <section className="mb-4 width-100 text-left">
        <h1 className="">Sign Up</h1>
        <p className="color-secondary">
          Register to unlock <a href="features">additional features</a>
        </p>
      </section>
      <BasicCard>
        <div className="flex flex-col text-left">
          <div className="font-size-13 font-weight-bold">Email</div>
          <input value={email} type="text" onChange={updateEmail} />
        </div>

        <div className="flex flex-col text-left mt-4">
          <div className="font-size-13 font-weight-bold">Password</div>
          <input value={password} type="password" onChange={updatePassword} />
        </div>

        <div className="flex flex-col text-left mt-4">
          <div
            className={`font-size-13 font-weight-bold ${verifyPasswordDisabled ? 'color-secondary' : ''}`}
          >
            Verify Password
          </div>
          <input
            value={verifyPassword}
            disabled={verifyPasswordDisabled}
            type="password"
            onChange={updateVerifyPassword}
          />
        </div>

        <div className="mt-4">
          {/* <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
          /> */}
        </div>

        <div className="flex flex-col text-left mt-4">
          {/* <button disabled={!canSubmit} className="outline small full">
            Register
          </button> */}
        </div>

        <section>
          <ul>
            {validationErrors.map((error) => {
              return (
                <li className="text-left color-pink-purple" key={error}>
                  {ValidationMessages[error]}
                </li>
              );
            })}
          </ul>
        </section>
      </BasicCard>
    </div>
  );
}
