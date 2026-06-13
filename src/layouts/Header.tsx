import { useNavigate } from 'react-router-dom';
import { MenuPage, MenuPageDescription } from '../context/MenuContext.types';
import { useMenuContext } from '../context/useMenuContext';
import '../css/Header.css';
import BuilderHeader from './header/BuilderHeader';
import MetronomeHeader from './header/MetronomeHeader';

export default function Header() {
  const navigate = useNavigate();
  const { showHeaderMenu, currentPage } = useMenuContext();

  const currentSideMenu =
    currentPage === MenuPage.Metronome ? (
      <MetronomeHeader />
    ) : currentPage === MenuPage.Builder ? (
      <BuilderHeader />
    ) : null;

  return showHeaderMenu ? (
    <header>
      <div className="header__container">
        <section className="flex f-gap1">
          <button
            onClick={() => navigate('/')}
            className="back-navigation color-white small mr-2"
          >
            &#x27E8;
          </button>
          <h3>{MenuPageDescription[currentPage].title}</h3>
        </section>
        {currentSideMenu}
      </div>
    </header>
  ) : null;
}
