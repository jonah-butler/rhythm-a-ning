import { useAuthContext } from '../context/useAuthContext';

export default function Account() {
  const { user } = useAuthContext();

  return (
    <div className="mt-4 flex justify-center flex-auto align-center flex-col">
      <section className="mb-4 width-100 text-left">
        <h1>Account</h1>
      </section>
      <p>Signed in as {user?.email}</p>
    </div>
  );
}
