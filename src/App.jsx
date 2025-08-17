import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import HomePage from './pages/HomePage';

const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;

function App() {
  useEffect(() => {
    console.log('attempting to initialize GA with Tracking ID:', GA_TRACKING_ID);

    if (GA_TRACKING_ID) {
      ReactGA.initialize(GA_TRACKING_ID);
      ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }
  }, []);

  return <HomePage />;
}

export default App;