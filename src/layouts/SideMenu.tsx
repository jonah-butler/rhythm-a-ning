import { useState } from 'react';
import { Link } from 'react-router-dom';
import CollapseIcon from '../assets/icons/collapse.svg?react';
import UserIcon from '../assets/icons/user-avatar.svg?react';
import { useAuthContext } from '../context/useAuthContext';
import { useMenuContext } from '../context/useMenuContext';
import '../css/SideMenu.css';
import { practiceRoutes } from './navRoutes';

export default function SideMenu() {
  const { currentPage } = useMenuContext();
  const { user, isAuthenticated } = useAuthContext();

  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className={`side-menu__container${isOpen ? '' : ' closed'}`}>
      <div className="side-menu__header">
        <button
          className="xsmall"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse menu' : 'Expand menu'}
        >
          <CollapseIcon />
        </button>
        <div>
          <span className="color-pink-purple">Rhythm</span>
          -a-ning
        </div>
      </div>

      {/* practice links */}
      <div className="side-menu__section">
        <div className="section-title">{practiceRoutes.title}</div>
        {practiceRoutes.subRoutes.map((r) => {
          return (
            <Link
              key={r.link}
              to={'/' + r.link}
              className={`section-link ${currentPage === r.link ? 'active' : ''}`}
              title={isOpen ? undefined : r.label}
              aria-label={r.label}
            >
              {r.icon}
              <span className="section-link__label">{r.label}</span>
            </Link>
          );
        })}
      </div>

      {/* account, pinned to the bottom */}
      <Link
        to={isAuthenticated ? '/account' : '/login'}
        className="side-menu__account"
        title={isOpen ? undefined : user?.email || 'Log in'}
        aria-label={isAuthenticated ? 'Account' : 'Log in'}
      >
        <div className="account-avatar">
          <UserIcon />
        </div>
        <span className="account-email">{user?.email ?? ''}</span>
      </Link>
    </section>
  );
}
