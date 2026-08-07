import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BuilderIcon from '../assets/icons/builder.svg?react';
import HeadphoneIcon from '../assets/icons/headphone.svg?react';
import NoteIcon from '../assets/icons/note.svg?react';
import Badge from '../components/Badge';
import BigButton from '../components/Buttons/BigButton';
import { useAuthContext } from '../context/useAuthContext';
import '../css/Home.css';
import { logout } from '../services/api/user';

export default function Home() {
  const navigate = useNavigate();

  const { isAuthenticated, clearContextSession } = useAuthContext();

  const logoutUser = async (): Promise<void> => {
    try {
      await logout();
      clearContextSession();
      toast('successfully logged out');
    } catch (err) {
      if (err instanceof Error) {
        toast('failed to logout: ' + err.message, {
          type: 'error',
        });
      }
    }
  };

  return (
    <div className="home__container">
      <div className="home__container__top">
        <section className="home__header">
          {/* <img src={logo} /> */}
          <h1>
            <span>Rhythm</span>-a-ning
          </h1>
        </section>
        <section className="flex justify-center">
          <Badge text="Rhythm Studio" icon={<HeadphoneIcon />} />
        </section>
        <section className="flex justify-center">
          <p className="color-secondary">Play and explore rhythm.</p>
        </section>
      </div>

      <div className="home__navigation f-gap4">
        <BigButton
          onClick={() => navigate('/metronome')}
          icon={<NoteIcon />}
          header="Metronome"
          description="A sequenced metronome with polyrhythm explorations"
        />

        <BigButton
          onClick={() => navigate('/builder')}
          icon={<BuilderIcon />}
          header="Rhythm Builder"
          description="Build custom rhythm workflows with tempo changes, polyrhythms, subdivisions and more"
        />

        {/* new user links */}
        {!isAuthenticated ? (
          <div className="flex f-gap4 width-100">
            <button
              onClick={() => navigate('/login')}
              className="outline small full"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="outline small full"
            >
              Register
            </button>
          </div>
        ) : (
          <div className="flex f-gap4 width-100">
            <button onClick={logoutUser} className="outline small full">
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
