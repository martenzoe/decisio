// src/pages/ChangePassword.jsx
import ChangePasswordForm from "../components/ChangePasswordForm"

function ChangePassword() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          🔒 Passwort ändern
        </h2>
        <ChangePasswordForm />
      </div>
    </div>
  )
}

export default ChangePassword
