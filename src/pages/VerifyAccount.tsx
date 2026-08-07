import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BasicCard from '../components/Cards/BasicCard';
import { Loader } from '../components/Loader/Loader';
import { rules } from '../helpers/form.helpers';
import { replayRegistration, verifyUser } from '../services/api/user';

export default function VerifyAccount() {
  const navigate = useNavigate();
  const routes = useLocation();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [verify, setVerify] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(routes.search).get('token') ?? '';
    if (token) {
      verifyUser(token)
        .then((verified) => {
          setIsVerified(verified);
        })
        .catch((err) => {
          if (err instanceof Error) {
            setIsVerified(false);
            toast('failed to verify account: ' + err.message, {
              type: 'error',
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const validateEmail = (email: string): void => {
    setIsValidEmail(rules.email(email));
    setEmail(email);
  };

  const resendVerificationEmail = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await replayRegistration(email);
      setVerify(response);
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
    <section className="container flex align-center justify-center height-100 flex-auto">
      {loading ? (
        <Loader />
      ) : (
        <BasicCard>
          {isVerified && !loading ? (
            <section>
              <h3>Account Verified!</h3>
              <button
                onClick={() => navigate('/login')}
                className="outline small full"
              >
                Login
              </button>
            </section>
          ) : null}

          {!isVerified && !verify && !loading ? (
            <section className="width-100 p-4 flex flex-col">
              <h3 className="mb-2">Account Verification Failed</h3>
              <input
                onChange={(e) => validateEmail(e.target.value)}
                placeholder="Enter Email"
                type="text"
                className="mb-4"
                value={email}
              />
              <button
                onClick={() => resendVerificationEmail()}
                disabled={!isValidEmail}
                className="outline small m-auto full"
              >
                Resend Registration
              </button>
            </section>
          ) : null}

          {!isVerified && verify && !loading ? (
            <section className="text-left">
              <h3 className="mb-2">Registration Successful</h3>
              <p className="text-light">
                An email was sent to the provided email.
              </p>
              <p className="text-light">
                Click the link to finish verifying your account.
              </p>
            </section>
          ) : null}
        </BasicCard>
      )}
    </section>
  );
}
