import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiLoader, FiUpload } from "react-icons/fi";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import FormInput from "../../components/auth/FormInput.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { uploadProfileImage } from "../../services/uploadImage.js";
import { registerProfile } from "../../services/authService.js";
import { auth } from "../../config/firebase.js";
import districts from "../../utils/districts.js";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RegisterPage() {
  const { registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

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
        dob: formData.dob,
        district: formData.district,
        upazila: formData.upazila,
        address: formData.address,
        photoURL,
      });

      toast.success("অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল ভেরিফাই করুন।");
      navigate("/login");
    } catch (err) {
      toast.error(mapFirebaseError(err.code) || "রেজিস্ট্রেশন ব্যর্থ হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="অ্যাকাউন্ট তৈরি করুন" subtitle="একবার রেজিস্টার করে Donor ও Seeker — দুই ভূমিকাই ব্যবহার করুন">
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
            প্রোফাইল ছবি আপলোড করুন <br /> (ঐচ্ছিক)
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormInput
            label="Full Name"
            error={errors.fullName}
            registration={register("fullName", { required: "পূর্ণ নাম দিন" })}
            placeholder="আপনার নাম"
          />
          <FormInput
            label="Phone Number"
            error={errors.phone}
            registration={register("phone", {
              required: "ফোন নম্বর দিন",
              pattern: { value: /^01[3-9]\d{8}$/, message: "সঠিক বাংলাদেশি নম্বর দিন" },
            })}
            placeholder="01XXXXXXXXX"
          />
        </div>

        <FormInput
          label="Email"
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
            label="Password"
            type="password"
            error={errors.password}
            registration={register("password", {
              required: "Password দিন",
              minLength: { value: 6, message: "কমপক্ষে ৬ অক্ষর হতে হবে" },
            })}
            placeholder="••••••••"
          />
          <FormInput
            label="Confirm Password"
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
          <FormInput label="Blood Group" error={errors.bloodGroup}>
            <select
              {...register("bloodGroup", { required: "ব্লাড গ্রুপ বেছে নিন" })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value="">বেছে নিন</option>
              {bloodGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </FormInput>

          <FormInput label="Gender" error={errors.gender}>
            <select
              {...register("gender", { required: "লিঙ্গ বেছে নিন" })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value="">বেছে নিন</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormInput>

          <FormInput
            label="Date of Birth"
            type="date"
            error={errors.dob}
            registration={register("dob", { required: "জন্ম তারিখ দিন" })}
          />
        </div>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormInput label="District" error={errors.district}>
            <select
              {...register("district", { required: "জেলা বেছে নিন" })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value="">বেছে নিন</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </FormInput>

          <FormInput
            label="Upazila"
            error={errors.upazila}
            registration={register("upazila", { required: "উপজেলা দিন" })}
            placeholder="আপনার উপজেলা"
          />
        </div>

        <FormInput
          label="Present Address"
          error={errors.address}
          registration={register("address", { required: "বর্তমান ঠিকানা দিন" })}
          placeholder="বিস্তারিত ঠিকানা — এটি দিয়ে নিকটতম ডোনার/সিকার নির্ধারণ করা হবে"
        />

        <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full justify-center">
          {submitting ? <FiLoader className="animate-spin" /> : "Create Account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        আগে থেকেই অ্যাকাউন্ট আছে?{" "}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          লগইন করুন
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
