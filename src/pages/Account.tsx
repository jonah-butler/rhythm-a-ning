import { toast } from 'react-toastify';
import { useAuthContext } from '../context/useAuthContext';
import { logout } from '../services/api/user';

export default function Account() {
  const { user } = useAuthContext();

  const logoutUser = async (): Promise<void> => {
    try {
      await logout();
      // a full load resets all app state, so clearContextSession isn't needed
      window.location.assign('/');
    } catch (err) {
      if (err instanceof Error) {
        toast('failed to logout: ' + err.message, { type: 'error' });
      }
    }
  };

  return (
    <div className="mt-4 flex justify-center flex-auto align-center flex-col">
      <section className="mb-4 width-100 text-left">
        <h1>Account</h1>
      </section>
      <p>Signed in as {user?.email}</p>
      <button onClick={logoutUser} className="outline small mt-4">
        Logout
      </button>
    </div>
  );
}
