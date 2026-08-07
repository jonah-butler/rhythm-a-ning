import { useRef, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BasicCard from '../components/Cards/BasicCard';
import { Loader } from '../components/Loader/Loader';
import { rules } from '../helpers/form.helpers';
import { verifyPasswordReset } from '../services/api/user';

const isValidPassword = (s: string) =>
  [
    rules.length(s),
    rules.numeric(s),
    rules.symbols(s),
    rules.uppercase(s),
  ].every((validation) => validation);

enum ValidationErrors {
  InvalidPassword,
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
  [ValidationErrors.VerifyPassword]: 'Passwords must match',
};

export default function VerifyResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const timerRef = useRef<null | number>(null);
  const cancelTimeout = (timer: number) => clearTimeout(timer);

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');

  const [validationErrors, setValidationErrors] = useState<ValidationErrors[]>(
    [],
  );

  const canSubmit =
    password.length > 0 &&
    verifyPassword.length > 0 &&
    isValidPassword(password) &&
    password === verifyPassword;

  const updatePassword = (e: ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) cancelTimeout(timerRef.current);
    const input = e.target.value;

    timerRef.current = setTimeout(() => {
      const isValid = isValidPassword(input);
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

    setPassword(input);
  };

  const updateVerifyPassword = (e: ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) cancelTimeout(timerRef.current);
    const input = e.target.value;

    timerRef.current = setTimeout(() => {
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

    setVerifyPassword(input);
  };

  const resetPassword = async (): Promise<void> => {
    const token = new URLSearchParams(location.search).get('token') ?? '';
    if (!token) return;

    setLoading(true);
    try {
      await verifyPasswordReset(password, token);
      toast('password reset successfully');
      navigate('/login');
    } catch (err) {
      if (err instanceof Error) {
        toast(err.message, {
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex justify-center flex-auto align-center flex-col">
      <BasicCard>
        <div className="flex flex-col text-left mb-4">
          <div className="font-size-13 font-weight-bold">Password</div>
          <input
            disabled={loading}
            value={password}
            type="password"
            onChange={updatePassword}
          />
        </div>

        <div className="flex flex-col text-left">
          <div className="font-size-13 font-weight-bold">Verify Password</div>
          <input
            disabled={loading}
            value={verifyPassword}
            type="password"
            onChange={updateVerifyPassword}
          />
        </div>

        <div className="flex flex-col text-left mt-4">
          <button
            onClick={resetPassword}
            disabled={!canSubmit || loading}
            className="outline small full"
          >
            {loading ? <Loader /> : 'Reset Password'}
          </button>
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
