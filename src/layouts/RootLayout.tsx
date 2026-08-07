import { Outlet } from 'react-router-dom';
import Flare from '../components/Flare';
import { AuthProvider } from '../context/AuthProvider';
import { RhythmBuilderProvider } from '../context/BuilderProvider';
import { IndexedDBProvider } from '../context/IndexedDBProvider';
import { MenuProvider } from '../context/MenuProvider';
import { MetronomeProvider } from '../context/MetronomeProvider';
import '../css/RootLayout.css';
import Header from '../layouts/Header';
import Footer from './Footer';

export default function RootLayout() {
  return (
    <>
      <AuthProvider>
        <IndexedDBProvider>
          <RhythmBuilderProvider>
            <MetronomeProvider>
              <MenuProvider>
                <Header />
                <main id="appContainer">
                  <Outlet />
                  <Flare y={0} x={100} />
                  <Flare y={200} x={400} />
                </main>
                <Footer />
              </MenuProvider>
            </MetronomeProvider>
          </RhythmBuilderProvider>
        </IndexedDBProvider>
      </AuthProvider>
    </>
  );
}
