// src/layouts/MainLayout.jsx
import Navbar from '../components/Navbar'

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#A7D7C5]">
      <Navbar />
      <main className="pt-6">{children}</main>
    </div>
  )
}

export default MainLayout
