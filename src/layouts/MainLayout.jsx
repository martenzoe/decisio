// src/layouts/MainLayout.jsx
import Navbar from '../components/Navbar'

function MainLayout({ children }) {
  return (
    <div className="min-h-screen relative">
      {/* Full height lila Hintergrund im Hintergrund */}
      <div className="absolute top-0 left-0 w-full h-64 bg-[#4F46E5] z-0" />

      {/* Inhalt inkl. Navbar */}
      <div className="relative z-10">
        <Navbar />
        <main className="pt-6">{children}</main>
      </div>
    </div>
  )
}

export default MainLayout
