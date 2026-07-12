import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClassesPage from './pages/ClassesPage';
import EconomyPage from './pages/EconomyPage';
import LocationsPage from './pages/LocationsPage';
import VisualGuidePage from './pages/VisualGuidePage';
import BossArenasPage from './pages/BossArenasPage';
import DevelopmentPage from './pages/DevelopmentPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/economy" element={<EconomyPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/visual-guide" element={<VisualGuidePage />} />
          <Route path="/boss-arenas" element={<BossArenasPage />} />
          <Route path="/development" element={<DevelopmentPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
