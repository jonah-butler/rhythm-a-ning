import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UserIcon from '../assets/icons/user-avatar.svg?react';
import { useAuthContext } from '../context/useAuthContext';
import { MenuPage, MenuPageDescription } from '../context/MenuContext.types';
import { useMenuContext } from '../context/useMenuContext';
import '../css/Header.css';
import BuilderHeader from './header/BuilderHeader';
import MetronomeHeader from './header/MetronomeHeader/MetronomeHeader';

export default function Header() {
  const navigate = useNavigate();
  const { showHeaderMenu, currentPage } = useMenuContext();
  const { isAuthenticated } = useAuthContext();

  const currentSideMenu =
    currentPage === MenuPage.Metronome ? (
      <MetronomeHeader />
    ) : currentPage === MenuPage.Builder ? (
      <BuilderHeader />
    ) : null;

  const isHome = useMemo(() => {
    return currentPage === MenuPage.Home;
  }, [currentPage]);

  return showHeaderMenu ? (
    <header>
      <div className="header__container">
        <section className="flex f-gap1">
          {!isHome ? (
            <button
              // full load: "/" is the static landing page, outside the router
              onClick={() => window.location.assign('/')}
              className="back-navigation color-white small mr-2"
            >
              &#x27E8;
            </button>
          ) : null}
          <h3 className={isHome ? 'ml-4' : ''}>
            {MenuPageDescription[currentPage].title}
          </h3>
        </section>
        <section className="flex f-gap1">
          {currentSideMenu}
          {isAuthenticated ? (
            <button
              aria-label="Account"
              className="color-white small"
              onClick={() => navigate('/account')}
            >
              <UserIcon style={{ width: '18px' }} />
            </button>
          ) : null}
        </section>
      </div>
    </header>
  ) : null;
}
