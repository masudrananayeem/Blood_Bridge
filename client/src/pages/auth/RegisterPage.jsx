import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FiLoader, FiUpload, FiMail, FiAlertTriangle } from "react-icons/fi";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import FormInput from "../../components/auth/FormInput.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { uploadProfileImage } from "../../services/uploadImage.js";
import { registerProfile } from "../../services/authService.js";
import { auth } from "../../config/firebase.js";
import districts from "../../utils/districts.js";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RegisterPage() {
  const { registerWithEmail, resendVerificationEmail, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const [resending, setResending] = useState(false);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const profile = await loginWithGoogle();
      // Brand-new Google sign-ups always come back with profileComplete:
      // false (Google never gives us blood group / phone / district), so
      // this always routes to the follow-up step — never straight to the
      // dashboard.
      navigate(profile?.profileComplete === false ? "/complete-profile" : "/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Google দিয়ে সাইন আপ করা যায়নি, আবার চেষ্টা করুন।");
    } finally {
      setGoogleLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      toast.success("ভেরিফিকেশন ইমেইল আবার পাঠানো হয়েছে — Inbox ও Spam/Junk ফোল্ডার দুটোই চেক করুন।");
    } catch {
      toast.error("ইমেইল পাঠানো যায়নি, একটু পর আবার চেষ্টা করুন।");
    } finally {
      setResending(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      // 1. Create the Firebase account (also sends verification email)
      await registerWithEmail({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      // 2. Upload profile picture (optional) to Cloudinary
      let photoURL = "";
      if (photoFile) {
        photoURL = await uploadProfileImage(photoFile);
      }

      // 3. Save the full profile to MongoDB via our backend
      const idToken = await auth.currentUser.getIdToken();
      await registerProfile({
        idToken,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        district: formData.district,
        upazila: formData.upazila,
        address: formData.address,
        photoURL,
      });

      toast.success("অ্যাকাউন্ট তৈরি হয়েছে!");
      setRegisteredEmail(formData.email);
    } catch (err) {
      toast.error(mapFirebaseError(err.code) || "রেজিস্ট্রেশন ব্যর্থ হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredEmail) {
    return (
      <AuthLayout title={t("auth.verifyEmailTitle")} subtitle={t("auth.verifyEmailSubtitle")}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40">
            <FiMail size={26} />
          </div>
          <p className="text-gray-700 dark:text-gray-200">
            {t("auth.verifyEmailSentTo")} <span className="font-semibold">{registeredEmail}</span>. {t("auth.verifyEmailInstructions")}
          </p>
          <div className="flex w-full items-start gap-2 rounded-xl bg-amber-50 p-3 text-left text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            <FiAlertTriangle className="mt-0.5 shrink-0" size={16} />
            <span>
              {t("auth.checkSpam")} {t("auth.spamFolder")}
            </span>
          </div>
          <button
            onClick={handleResend}
            disabled={resending}
            className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline disabled:opacity-50"
          >
            {resending ? <FiLoader className="animate-spin" size={14} /> : null}
            {t("auth.resendEmail")}
          </button>
          <button onClick={() => navigate("/login")} className="btn-primary mt-2 w-full justify-center">
            {t("auth.goToLogin")}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("auth.createAccount")} subtitle={t("auth.createAccountSubtitle")}>
      <button
        onClick={handleGoogleSignup}
        disabled={googleLoading}
        className="mb-6 flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
      >
        {googleLoading ? <FiLoader className="animate-spin" /> : <FcGoogle size={20} />}
        {t("auth.signUpWithGoogle")}
      </button>

      <div className="mb-6 flex items-center gap-3 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
        {t("auth.orFillForm")}
        <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Profile picture */}
        <div className="mb-6 flex items-center gap-4">
          <label className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 dark:border-white/20 dark:bg-white/5">
            {preview ? (
              <img src={preview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <FiUpload className="text-gray-400" />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("auth.uploadPhoto")} <br /> {t("auth.optional")}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormInput
            label={t("auth.fullName")}
            error={errors.fullName}
            registration={register("fullName", { required: "পূর্ণ নাম দিন" })}
            placeholder={t("auth.fullNamePlaceholder")}
          />
          <FormInput
            label={t("auth.phoneNumber")}
            error={errors.phone}
            registration={register("phone", {
              required: "ফোন নম্বর দিন",
              pattern: { value: /^01[3-9]\d{8}$/, message: "সঠিক বাংলাদেশি নম্বর দিন" },
            })}
            placeholder="01XXXXXXXXX"
          />
        </div>

        <FormInput
          label={t("auth.email")}
          type="email"
          error={errors.email}
          registration={register("email", {
            required: "Email দিন",
            pattern: { value: /^\S+@\S+$/i, message: "সঠিক Email দিন" },
          })}
          placeholder="you@example.com"
        />

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormInput
            label={t("auth.password")}
            type="password"
            error={errors.password}
            registration={register("password", {
              required: "Password দিন",
              minLength: { value: 6, message: "কমপক্ষে ৬ অক্ষর হতে হবে" },
            })}
            placeholder="••••••••"
          />
          <FormInput
            label={t("auth.confirmPassword")}
            type="password"
            error={errors.confirmPassword}
            registration={register("confirmPassword", {
              required: "পাসওয়ার্ড নিশ্চিত করুন",
              validate: (v) => v === password || "পাসওয়ার্ড মিলছে না",
            })}
            placeholder="••••••••"
          />
        </div>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
          <FormInput label={t("auth.bloodGroup")} error={errors.bloodGroup}>
            <select
              {...register("bloodGroup", { required: "ব্লাড গ্রুপ বেছে নিন" })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value="">{t("auth.selectOption")}</option>
              {bloodGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </FormInput>

          <FormInput label={t("auth.gender")} error={errors.gender}>
            <select
              {...register("gender", { required: "লিঙ্গ বেছে নিন" })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value="">{t("auth.selectOption")}</option>
              <option value="male">{t("auth.male")}</option>
              <option value="female">{t("auth.female")}</option>
              <option value="other">{t("auth.other")}</option>
            </select>
          </FormInput>

          <FormInput
            label={t("auth.dateOfBirth")}
            type="date"
            error={errors.dateOfBirth}
            registration={register("dateOfBirth", { required: "জন্ম তারিখ দিন" })}
          />
        </div>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormInput label={t("auth.district")} error={errors.district}>
            <select
              {...register("district", { required: "জেলা বেছে নিন" })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value="">{t("auth.selectOption")}</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </FormInput>

          <FormInput
            label={t("auth.upazila")}
            error={errors.upazila}
            registration={register("upazila", { required: "উপজেলা দিন" })}
            placeholder={t("auth.upazilaPlaceholder")}
          />
        </div>

        <FormInput
          label={t("auth.presentAddress")}
          error={errors.address}
          registration={register("address", { required: "বর্তমান ঠিকানা দিন" })}
          placeholder={t("auth.addressPlaceholder")}
        />

        <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full justify-center">
          {submitting ? <FiLoader className="animate-spin" /> : t("auth.createAccount")}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          {t("auth.login")}
        </Link>
      </p>
    </AuthLayout>
  );
}

function mapFirebaseError(code) {
  const map = {
    "auth/email-already-in-use": "এই ইমেইলে আগে থেকেই অ্যাকাউন্ট আছে।",
    "auth/weak-password": "পাসওয়ার্ড খুব দুর্বল।",
    "auth/invalid-email": "সঠিক ইমেইল দিন।",
  };
  return map[code];
}
