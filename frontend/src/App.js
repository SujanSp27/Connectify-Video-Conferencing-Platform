import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
function App() {
  return (
    <div className="App">

      <BrowserRouter>
      <AuthProvider>
          <Routes>
            <Route path='/' element={<LandingPage />} />
             <Route path='/auth' element={<Authentication />} />
          </Routes>
           </AuthProvider>
    </BrowserRouter>
    </div>
  );
}

export default App;