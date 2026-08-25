import React, { lazy, Suspense } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NetworkBanner } from './components/NetworkBanner';
import { PWAPrompt } from './components/PWAPrompt';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
// Halaman hanya diunduh saat rute pertama kali diakses,
// sehingga bundle awal tetap kecil dan loading pertama lebih cepat.
const RoleSelection           = lazy(() => import('./pages/RoleSelection'));
const GuideLogin              = lazy(() => import('./pages/GuideLogin'));
const GuideRegister           = lazy(() => import('./pages/GuideRegister'));
const GuideDashboard          = lazy(() => import('./pages/GuideDashboard'));
const CreateSession           = lazy(() => import('./pages/CreateSession'));
const GuideSessionDetail      = lazy(() => import('./pages/GuideSessionDetail'));
const AddExpectedParticipants = lazy(() => import('./pages/AddExpectedParticipants'));
const SuperadminDashboard     = lazy(() => import('./pages/SuperadminDashboard'));
const GuideRoom               = lazy(() => import('./pages/GuideRoom'));
const ParticipantJoin         = lazy(() => import('./pages/ParticipantJoin'));
const ParticipantRoom         = lazy(() => import('./pages/ParticipantRoom'));

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* Global Styles */
import './global.css';

setupIonicReact();

// ─── Fallback spinner saat halaman sedang diload ──────────────────────────────
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Guard component — redirect unauthenticated users to /guide/login ─────────
const PrivateRoute: React.FC<{ component: React.FC; path: string; exact?: boolean }> = ({
  component: Component,
  ...rest
}) => {
  const { guide, loading } = useAuth();

  if (loading) {
    return (
      <Route {...rest}>
        <PageLoader />
      </Route>
    );
  }

  return (
    <Route
      {...rest}
      render={() =>
        guide ? <Component /> : <Redirect to="/guide/login" />
      }
    />
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <IonApp>
      <NetworkBanner />
      <PWAPrompt />
      <AuthProvider>
        <IonReactRouter>
          <Suspense fallback={<PageLoader />}>
            <IonRouterOutlet>
              <Route exact path="/">
                <RoleSelection />
              </Route>

              <Route exact path="/guide/login">
                <GuideLogin />
              </Route>

              <Route exact path="/guide/register">
                <GuideRegister />
              </Route>

              {/* Protected guide routes */}
              <PrivateRoute exact path="/guide/admin"               component={SuperadminDashboard} />
              <PrivateRoute exact path="/guide/dashboard"           component={GuideDashboard} />
              <PrivateRoute exact path="/guide/create-session"      component={CreateSession} />
              <PrivateRoute exact path="/guide/session/:id"         component={GuideSessionDetail} />
              <PrivateRoute exact path="/guide/session/:id/expected" component={AddExpectedParticipants} />
              <PrivateRoute exact path="/guide/room/:id"            component={GuideRoom} />

              <Route exact path="/participant/join">
                <ParticipantJoin />
              </Route>
              <Route exact path="/participant/room/:id">
                <ParticipantRoom />
              </Route>
            </IonRouterOutlet>
          </Suspense>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  </ThemeProvider>
);

export default App;
