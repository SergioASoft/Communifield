import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/perfil" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
