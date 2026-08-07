import CookieIcon from '../assets/icons/cookie.svg?react';
import DataIcon from '../assets/icons/data.svg?react';
import DocumentIcon from '../assets/icons/document.svg?react';
import EnvelopeIcon from '../assets/icons/envelope.svg?react';
import EyeIcon from '../assets/icons/eye.svg?react';
import LockIcon from '../assets/icons/lock.svg?react';
import UserIcon from '../assets/icons/user-avatar.svg?react';
import BigButton from '../components/Buttons/BigButton';

export default function PrivacyPolicy() {
  return (
    <section className="text-left p-8">
      <div className="mb-8 mt-8">
        <h1>
          Privacy <span className="color-pink-purple">Policy</span>
        </h1>
      </div>
      <BigButton
        icon={<DocumentIcon />}
        orientation="row"
        size="full"
        header="Privacy Policy Overview"
        description={
          <section>
            This Privacy Policy describes how Rhythm-a-ning handles information
            when you use the metronome and other rhythm practice tools with an
            account.
            <p>
              This page is maintained by the app owner to answer common privacy
              questions about Rhythm-a-ning.
            </p>
          </section>
        }
        onClick={() => {}}
      />

      <BigButton
        icon={<EyeIcon />}
        orientation="row"
        size="full"
        header="Data Collection"
        description={
          <section>
            - Email Addresses
            <p>- Saved rhythms, workflows, and general user preferences</p>
            <p>- IP Addresses for logging and anonymous telemetry</p>
          </section>
        }
        onClick={() => {}}
      />

      <BigButton
        icon={<DataIcon />}
        orientation="row"
        size="full"
        header="How Data Is Used"
        description={
          <section>
            The personal data provided during registration is only used for
            identity purposes, authorization, persisting saved data and
            transactional in-app purposes. Marketing and transactional use of
            personal data is currently not in scope.
          </section>
        }
        onClick={() => {}}
      />

      <BigButton
        icon={<LockIcon />}
        orientation="row"
        size="full"
        header="Security"
        description={
          <section>
            I take reasonable measures to protect your data, including but not
            limited to encyrpting data where needed and certain access controls.
            No system is completely secure, so I encourage the use strong
            passwords and keep your account credentials private. Access tokens
            used in authorization are refreshed/rotated regularly to minimize
            potential impact to a user's account.
          </section>
        }
        onClick={() => {}}
      />

      <BigButton
        icon={<CookieIcon />}
        orientation="row"
        size="full"
        header="Cookies"
        description={
          <section>
            This application requires the use of certain essential cookies only
            meant to provide access to features and identity purposes related to
            authorization and security.
          </section>
        }
        onClick={() => {}}
      />

      <BigButton
        icon={<UserIcon />}
        orientation="row"
        size="full"
        header="Rights & Data"
        description={
          <section>
            Account access meant for viewing, updating or deleting is provided
            at all times unless there is an active service disruption. Data can
            be deleted at any time, and no personal data is retained after an
            account is deleted. Contact me if you need assistance managing data
            in any way or have additional questsions.
          </section>
        }
        onClick={() => {}}
      />

      <BigButton
        icon={<EnvelopeIcon />}
        orientation="row"
        size="full"
        header="Contact"
        description={
          <section>
            For all correspondences and questions, send an email to{' '}
            <span className="color-pink-purple">daemon@rhythmaning.app</span>.
          </section>
        }
        onClick={() => {}}
      />
      <p className="font-size-12">last updated: July 26, 2026</p>
    </section>
  );
}
