import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { type ChangeEvent, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import BasicCard from '../components/Cards/BasicCard';
import { Loader } from '../components/Loader/Loader';
import Modal from '../components/Modals/Generic';
import '../css/Register.css';
import { registerUser } from '../services/api/user';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

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
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const cancelTimeout = (timer: number) => clearTimeout(timer);

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');

  const [loading, setLoading] = useState<boolean>(false);

  const [registerSuccess, setRegisterSucces] = useState(false);

  const [verifyPasswordDisabled, setVerifyPasswordDisable] = useState(true);

  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const [validationErrors, setValidationErrors] = useState<ValidationErrors[]>(
    [],
  );

  const canSubmit =
    email.length > 0 &&
    password.length > 0 &&
    verifyPassword.length > 0 &&
    rules.email(email) &&
    isPasswordValid(password) &&
    password === verifyPassword &&
    turnstileToken !== null;

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

  const register = async (): Promise<void> => {
    setLoading(true);
    try {
      const payload = {
        turnstileToken,
        email,
        password,
      };

      const response = await registerUser(payload);
      if (response.success) {
        setRegisterSucces(response.success);
      }
    } catch (err) {
      if (err instanceof Error) {
        toast(`Failed to register user: ${err.message}`, {
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex justify-center flex-auto align-center flex-col">
      {modalIsOpen ? (
        <Modal close={() => setModalIsOpen(false)}>
          <Modal.Header onClose={() => setModalIsOpen(false)}>
            Privacy Notice
          </Modal.Header>
          <Modal.Body>
            <section className="font-size-14">
              <div>
                {' '}
                Rhythm-a-ning values privacy and security and requires a few
                small yet important pieces of personal data to operate smoothly.
              </div>
              <div>
                <strong>What I store: </strong>
                <div>
                  <ul>
                    <li>
                      <strong className="color-pink-purple">
                        IP addresses
                      </strong>{' '}
                      for logging
                    </li>
                    <li>
                      <strong className="color-pink-purple">Emails</strong> for
                      identification and authorization
                    </li>
                    <li>
                      <strong className="color-pink-purple">Passwords</strong>{' '}
                      for identification and authorization
                    </li>
                  </ul>
                </div>
                <div>
                  <em>
                    Your account information is never shared with third-party
                    services.
                  </em>
                </div>
                <div>
                  Check out the{' '}
                  <a target="_blank" href="/privacy-policy">
                    privacy policy
                  </a>{' '}
                  for a more details.
                </div>
              </div>
            </section>
          </Modal.Body>
        </Modal>
      ) : null}
      <section className="mb-4 width-100 text-left">
        <h1 className="">Sign Up</h1>
        <p className="color-secondary">
          Register to unlock <a href="features">all features</a>
        </p>
      </section>
      <BasicCard>
        {registerSuccess ? (
          <section className="text-left">
            <h3 className="mb-2">Registration Successful</h3>
            <p className="text-light">
              An email was sent to the provided email.
            </p>
            <p className="text-light">
              Click the link to finish verifying your account.
            </p>
          </section>
        ) : (
          <>
            <div className="flex flex-col text-left">
              <div className="font-size-13 font-weight-bold">Email</div>
              <input
                disabled={loading}
                value={email}
                type="text"
                onChange={updateEmail}
              />
            </div>

            <div className="flex flex-col text-left mt-4">
              <div className="font-size-13 font-weight-bold">Password</div>
              <input
                disabled={loading}
                value={password}
                type="password"
                onChange={updatePassword}
              />
            </div>

            <div className="flex flex-col text-left mt-4">
              <div
                className={`font-size-13 font-weight-bold ${verifyPasswordDisabled ? 'color-secondary' : ''}`}
              >
                Verify Password
              </div>
              <input
                value={verifyPassword}
                disabled={verifyPasswordDisabled || loading}
                type="password"
                onChange={updateVerifyPassword}
              />
            </div>

            <div className="mt-4">
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken('')}
                onError={() => setTurnstileToken('')}
              />
            </div>

            <div className="flex flex-col mt-4">
              <button
                onClick={register}
                disabled={!canSubmit || loading}
                className="outline small full"
              >
                {loading ? <Loader /> : 'Register'}
              </button>
              <p className="font-size-12 text-center">
                check out the{' '}
                <button
                  onClick={() => setModalIsOpen(true)}
                  className="color-pink-purple cursor-pointer btn-text"
                >
                  privacy notice
                </button>
              </p>
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
          </>
        )}
      </BasicCard>
    </div>
  );
}
