import { Link } from 'react-router-dom';

import BuilderIcon from '../assets/icons/builder.svg?react';
import HeadphoneIcon from '../assets/icons/headphone.svg?react';
import LightningIcon from '../assets/icons/lightning.svg?react';
import NoteIcon from '../assets/icons/note.svg?react';
import SaveIcon from '../assets/icons/save.svg?react';
import ShareIcon from '../assets/icons/share.svg?react';
import StarIcon from '../assets/icons/star.svg?react';
import Badge from '../components/Badge';
import BigButton from '../components/Buttons/BigButton';

export default function Features() {
  return (
    <section className="mt-4 container">
      <div className="mt-4 max-w-35 m-auto">
        <h1 className="font-size-40 line-h-1_2">
          Tools to Develop Your Time{' '}
          <span className="color-pink-purple">And Strengthen Your Pocket</span>
        </h1>
      </div>

      <div>
        <p className="color-secondary flex justify-center">
          Rhythm-a-ning brings the metronome, rhythm builder, and notation
          workspace all into one focused studio experience.
        </p>
      </div>

      <div className="flex justify-center mt-4">
        <Badge text="Tools for all skill levels" icon={<StarIcon />} />
      </div>

      <div className="flex mt-8 flex-wrap f-gap2 justify-center">
        <BigButton
          icon={<NoteIcon />}
          orientation="col"
          size="sm"
          header="Metronome Sequencer"
          description="A radial metronome that visualizes beats and subdivisions as interlocking segments — see the pulse and learn the relationships of polyrhythms."
          onClick={() => {}}
        />

        <BigButton
          icon={<BuilderIcon />}
          orientation="col"
          size="sm"
          header="Rhythm Builder"
          description="Chain blocks of tempo, meter, and subdivisions into multi-stage practice routines that flow seamlessly."
          onClick={() => {}}
        />

        <BigButton
          icon={<HeadphoneIcon />}
          orientation="col"
          size="sm"
          header="Custom Voices"
          description="Customize oscillators and swap in custom drum sounds for multi-voice sequencing to build rhythms that work for you."
          onClick={() => {}}
        />

        <BigButton
          icon={<ShareIcon />}
          orientation="col"
          size="sm"
          header="Shareable Patterns"
          description="Each rhythm encodes into a shareable link to make idea sharing a breeze."
          onClick={() => {}}
        />

        <BigButton
          icon={<SaveIcon />}
          orientation="col"
          size="sm"
          header="Save Your Work"
          description="Never miss a beat by storing all your custom rhythms and workflows for easy access across devices."
          onClick={() => {}}
        />

        <BigButton
          icon={<LightningIcon />}
          orientation="col"
          size="sm"
          header="And Much More"
          description={
            <>
              Check out the <Link to="/">project timeline</Link> for more
              upcoming features and enhancements!
            </>
          }
          onClick={() => {}}
        />
      </div>
    </section>
  );
}
