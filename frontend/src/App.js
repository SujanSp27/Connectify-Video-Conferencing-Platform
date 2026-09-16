import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/home';
import History from './pages/history';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path='/'        element={<LandingPage />} />
          <Route path='/auth'    element={<Authentication />} />
          <Route path='/home'    element={<HomeComponent />} />
          <Route path='/history' element={<History />} />
          <Route path='/:url'    element={<VideoMeetComponent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
