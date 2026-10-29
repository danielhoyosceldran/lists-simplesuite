import { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { DirectionContext } from '../components/Page';
import { OrganizationsScreen } from '../features/organizations/OrganizationsScreen';
import { ProjectsScreen } from '../features/projects/ProjectsScreen';
import { ListsScreen } from '../features/lists/ListsScreen';
import { ListScreen } from '../features/items/ListScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { NotFound } from '../features/shared';

/** / = 0, /o/:id = 1, /o/:id/p/:id = 2, /o/:id/p/:id/l/:id = 3; settings sits one level below root. */
function depthOf(path: string) {
  if (path.startsWith('/settings')) return 1;
  return Math.floor(path.split('/').filter(Boolean).length / 2);
}

export function AppRoutes() {
  const location = useLocation();
  const [nav, setNav] = useState({ path: location.pathname, dir: 0 });

  // Derive the transition direction from the route depth change (render-time state update).
  if (nav.path !== location.pathname) {
    setNav({ path: location.pathname, dir: depthOf(location.pathname) >= depthOf(nav.path) ? 1 : -1 });
  }

  return (
    <DirectionContext.Provider value={nav.dir}>
      <div className="app">
        <AnimatePresence custom={nav.dir}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<OrganizationsScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/o/:orgId" element={<ProjectsScreen />} />
            <Route path="/o/:orgId/p/:projectId" element={<ListsScreen />} />
            <Route path="/o/:orgId/p/:projectId/l/:listId" element={<ListScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </div>
    </DirectionContext.Provider>
  );
}
