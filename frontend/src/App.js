import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/home';
import { AuthProvider } from './contexts/AuthContext';
function App() {
  return (
    <div className="App">

      <BrowserRouter>
      <AuthProvider>
          <Routes>
            <Route path='/' element={<LandingPage />} />
             <Route path='/auth' element={<Authentication />} />
             <Route path='/home's element={<HomeComponent />} />
             <Route path='/:url' element={<VideoMeetComponent />} />
          </Routes>
           </AuthProvider>
    </BrowserRouter>
    </div>
  );
}

export default App;