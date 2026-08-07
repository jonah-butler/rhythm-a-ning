import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BasicCard from '../components/Cards/BasicCard';
import { Loader } from '../components/Loader/Loader';
import { useAuthContext } from '../context/useAuthContext';
import { rules } from '../helpers/form.helpers';
import { login } from '../services/api/user';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);

  const navigate = useNavigate();

  const { refresh } = useAuthContext();

  const updateEmail = (input: string): void => {
    setCanSubmit(rules.email(input));
    setEmail(input);
  };

  const loginUser = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await login(email, password);
      if (response) {
        toast('login successful');
        await refresh();
        navigate('/');
        return;
      }

      toast('login failed', {
        type: 'error',
      });
    } catch (err) {
      if (err instanceof Error) {
        toast('login failed: ' + err.message, {
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex justify-center flex-auto align-center flex-col">
      <section className="mb-4 width-100 text-left">
        <h1>Login</h1>
      </section>
      <BasicCard>
        <div className="flex flex-col text-left">
          <div className="font-size-13 font-weight-bold">Email</div>
          <input
            disabled={loading}
            value={email}
            type="text"
            onChange={(e) => updateEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col text-left mt-4">
          <div className="font-size-13 font-weight-bold">Password</div>
          <input
            disabled={loading}
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col text-left mt-4">
          <button
            onClick={loginUser}
            disabled={!canSubmit || loading}
            className="outline small full"
          >
            {loading ? <Loader /> : 'Login'}
          </button>
        </div>

        <div className="flex justify-center mt-4">
          <a href="/reset-password">reset password</a>
        </div>
      </BasicCard>
    </div>
  );
}
