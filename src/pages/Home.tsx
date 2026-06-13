// import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import BuilderIcon from '../assets/icons/builder.svg?react';
import HeadphoneIcon from '../assets/icons/headphone.svg?react';
import NoteIcon from '../assets/icons/note.svg?react';
import Badge from '../components/Badge';
import BigButton from '../components/Buttons/BigButton';
import '../css/Home.css';

export default function Home() {
  const navigate = useNavigate();

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
        <div className="flex f-gap4 width-100">
          <button className="outline small full">Login</button>
          <button
            onClick={() => navigate('/register')}
            className="outline small full"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
