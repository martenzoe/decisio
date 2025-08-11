// src/components/ProfileForm.jsx
import { useState, useEffect } from "react";
import AvatarUploader from "./AvatarUploader";
import { getProfile, updateProfile } from "../api/profile";
import { useAuthStore } from "../store/useAuthStore";
import { useTranslation } from "react-i18next";

function ProfileForm() {
  // -> alle Keys unter "profile.*"
  const { t } = useTranslation(undefined, { keyPrefix: "profile" });
  const { user } = useAuthStore();

  const [form, setForm] = useState({
    nickname: "",
    avatar_url: "",
    first_name: "",
    last_name: "",
    birthday: "",
  });

  useEffect(() => {
    if (!user?.id) return;
    getProfile(user.id)
      .then((data) => {
        if (data) setForm(data);
      })
      .catch((err) => console.error("Error loading profile:", err));
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await updateProfile(user.id, form);
      alert(t("saved")); // vorher: t("profile.saved")
    } catch (err) {
      console.error("Save failed:", err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 space-y-6"
    >
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
        {t("title")}
      </h2>

      <div className="flex justify-center">
        <AvatarUploader
          url={form.avatar_url}
          onUpload={(url) => setForm({ ...form, avatar_url: url })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("nickname")}
        </label>
        <input
          type="text"
          name="nickname"
          value={form.nickname}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("firstName")}
        </label>
        <input
          type="text"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("lastName")}
        </label>
        <input
          type="text"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("birthday")}
        </label>
        <input
          type="date"
          name="birthday"
          value={form.birthday || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
        />
      </div>

      <div className="text-center">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
        >
          {t("save")}
        </button>
      </div>
    </form>
  );
}

export default ProfileForm;
