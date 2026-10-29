import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/inter';
import './theme/tokens.css';
import './styles.css';
import './theme/theme';
import { AppRoutes } from './routes/AppRoutes';
import { ToastProvider } from './components/Toast';
import { UpdatePrompt } from './components/UpdatePrompt';

// Ask the browser not to evict IndexedDB under storage pressure (all data lives only here).
navigator.storage?.persist?.().catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <AppRoutes />
          <UpdatePrompt />
        </ToastProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
);
