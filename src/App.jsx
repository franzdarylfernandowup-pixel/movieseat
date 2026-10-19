import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/routing/ScrollToTop'
import GuestRoute from './components/routing/GuestRoute'
import NowShowing from './pages/NowShowing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Verify from './pages/Verify'
import SeatMap from './pages/SeatMap'
import Ticket from './pages/Ticket'
import FindReservation from './pages/FindReservation'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-[#000000] flex flex-col text-white selection:bg-white selection:text-black">
        <Header />
        <main className="flex-1 flex flex-col">
          <Routes>
            {/* Public catalog and screening routes */}
            <Route path="/" element={<NowShowing />} />
            <Route path="/screenings/:id" element={<SeatMap />} />
            <Route path="/ticket/:reference" element={<Ticket />} />
            <Route path="/find-reservation" element={<FindReservation />} />

            {/* Guest-only auth routes (guarded from authenticated patrons) */}
            <Route
              path="/signin"
              element={
                <GuestRoute>
                  <SignIn />
                </GuestRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <GuestRoute>
                  <SignUp />
                </GuestRoute>
              }
            />
            <Route
              path="/verify"
              element={
                <GuestRoute>
                  <Verify />
                </GuestRoute>
              }
            />

            {/* 404 Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App