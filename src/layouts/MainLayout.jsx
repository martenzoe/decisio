// src/layouts/MainLayout.jsx
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Navbar */}
      <div className="relative z-50">
        <Navbar />
      </div>

      {/* Purple background layer */}
      <div className="relative z-0 flex-1">
        <div className="absolute top-0 left-0 w-full h-64 bg-[#4F46E5] z-0" />
        <main className="relative z-10 pt-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default MainLayout
