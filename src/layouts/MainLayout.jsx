import Navbar from '../components/Navbar'

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navbar sitzt oben, ohne Abstand */}
      <div className="relative z-50">
        <Navbar />
      </div>

      {/* Lila Hintergrund geht bis nach oben */}
      <div className="relative z-0">
        <div className="absolute top-0 left-0 w-full h-64 bg-[#4F46E5] z-0" />
        <main className="relative z-10 pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
