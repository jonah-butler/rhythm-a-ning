import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { MenuContext } from './MenuContext';
import { MenuPage, type MenuPageType } from './MenuContext.types';

export function MenuProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<MenuPageType>(MenuPage.Home);

  const location = useLocation();

  useEffect(() => {
    const currentLocation = location.pathname.split('/')[1];
    const valueCleansed =
      currentLocation === '' ? MenuPage.Home : currentLocation;
    setCurrentPage(valueCleansed as MenuPageType);
  }, [location.pathname]);

  const value = useMemo(
    () => ({
      currentPage,
      setCurrentPage,
      showHeaderMenu: !!currentPage,
    }),
    [currentPage],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}
