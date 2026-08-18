import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NetworkBanner } from './components/NetworkBanner';
import React from 'react';

import RoleSelection from './pages/RoleSelection';
import GuideLogin from './pages/GuideLogin';
import GuideRegister from './pages/GuideRegister';
import GuideDashboard from './pages/GuideDashboard';
import CreateSession from './pages/CreateSession';
import GuideSessionDetail from './pages/GuideSessionDetail';
import AddExpectedParticipants from './pages/AddExpectedParticipants';
import SuperadminDashboard from './pages/SuperadminDashboard';
import GuideRoom from './pages/GuideRoom';
import ParticipantJoin from './pages/ParticipantJoin';
import ParticipantRoom from './pages/ParticipantRoom';

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

/** Guard component — redirects unauthenticated users to /guide/login */
const PrivateRoute: React.FC<{ component: React.FC; path: string; exact?: boolean }> = ({
  component: Component,
  ...rest
}) => {
  const { guide, loading } = useAuth();

  if (loading) {
    return (
      <Route {...rest}>
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
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

import { PWAPrompt } from './components/PWAPrompt';

const App: React.FC = () => (
  <ThemeProvider>
    <IonApp>
      <NetworkBanner />
      <PWAPrompt />
      <AuthProvider>
        <IonReactRouter>
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
          <PrivateRoute exact path="/guide/admin" component={SuperadminDashboard} />
          <PrivateRoute exact path="/guide/dashboard" component={GuideDashboard} />
          <PrivateRoute exact path="/guide/create-session" component={CreateSession} />
          <PrivateRoute path="/guide/session/:id" component={GuideSessionDetail} exact />
          <PrivateRoute path="/guide/session/:id/expected" component={AddExpectedParticipants} exact />
          <PrivateRoute path="/guide/room/:id" component={GuideRoom} exact />

          <Route exact path="/participant/join">
            <ParticipantJoin />
          </Route>
          <Route exact path="/participant/room/:id">
            <ParticipantRoom />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
</ThemeProvider>
);

export default App;
