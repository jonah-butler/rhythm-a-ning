import { useState } from 'react';
import { toast } from 'react-toastify';
import BasicCard from '../components/Cards/BasicCard';
import { Loader } from '../components/Loader/Loader';
import { rules } from '../helpers/form.helpers';
import { resetPassowrd } from '../services/api/user';

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateEmail = (input: string): void => {
    setCanSubmit(rules.email(input));
    setEmail(input);
  };

  const reset = async (): Promise<void> => {
    setLoading(true);

    try {
      await resetPassowrd(email);

      toast('password reset email sent');
      setSubmitted(true);
    } catch (err) {
      if (err instanceof Error) {
        toast('failed to initiate password reset', {
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
        <div className="flex flex-col text-left">
          <div className="font-size-13 font-weight-bold">Email</div>
          <input
            disabled={loading || submitted}
            value={email}
            type="text"
            onChange={(e) => updateEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col text-left mt-4">
          <button
            onClick={reset}
            disabled={!canSubmit || loading || submitted}
            className="outline small full"
          >
            {loading ? <Loader /> : 'Login'}
          </button>
        </div>
      </BasicCard>
    </div>
  );
}
