import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
function App() {
  return (
    <div className="App">

      <BrowserRouter>
          <Routes>
            <Route path='/' element={<LandingPage />} />
             <Route path='/auth' element={<Authentication />} />
          </Routes>
    </BrowserRouter>
    </div>
  );
}

export default App;