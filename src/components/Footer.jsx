// src/components/Footer.jsx
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="w-full mt-16 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-600 dark:text-gray-400 text-center sm:text-left">
          © {new Date().getFullYear()} Decisia. All rights reserved.
        </p>
        <div className="flex gap-6 text-gray-600 dark:text-gray-400">
          <Link to="/impressum" className="hover:text-[#4F46E5] dark:hover:text-white transition">
            Legal Notice
          </Link>
          <Link to="/datenschutz" className="hover:text-[#4F46E5] dark:hover:text-white transition">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
