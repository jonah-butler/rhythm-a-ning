import { Link } from 'react-router-dom';
import HomeIcon from '../assets/icons/home.svg?react';
import UserIcon from '../assets/icons/user-avatar.svg?react';
import { MenuPage } from '../context/MenuContext.types';
import { useAuthContext } from '../context/useAuthContext';
import { useMenuContext } from '../context/useMenuContext';
import '../css/MobileNav.css';
import { practiceRoutes } from './navRoutes';

export default function MobileNav() {
  const { currentPage } = useMenuContext();
  const { isAuthenticated } = useAuthContext();

  const homeActive = currentPage === MenuPage.Home;

  const accountActive =
    currentPage === MenuPage.Account || currentPage === MenuPage.Login;

  return (
    <nav className="mobile-nav" aria-label="Main">
      <Link
        to="/home"
        className={`mobile-nav__tab${homeActive ? ' active' : ''}`}
        aria-current={homeActive ? 'page' : undefined}
      >
        <HomeIcon style={{ width: '17px' }} />
        <span>Home</span>
      </Link>

      {practiceRoutes.subRoutes.map((r) => (
        <Link
          key={r.link}
          to={'/' + r.link}
          className={`mobile-nav__tab${currentPage === r.link ? ' active' : ''}`}
          aria-current={currentPage === r.link ? 'page' : undefined}
        >
          {r.icon}
          <span>{r.shortLabel}</span>
        </Link>
      ))}

      <Link
        to={isAuthenticated ? '/account' : '/login'}
        className={`mobile-nav__tab${accountActive ? ' active' : ''}`}
        aria-current={accountActive ? 'page' : undefined}
      >
        <UserIcon style={{ width: '17px' }} />
        <span>{isAuthenticated ? 'Account' : 'Log in'}</span>
      </Link>
    </nav>
  );
}
