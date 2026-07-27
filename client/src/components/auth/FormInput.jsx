export default function FormInput({ label, error, type = "text", registration, children, ...rest }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children ? (
        children
      ) : (
        <input
          type={type}
          {...registration}
          {...rest}
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:bg-white/5 dark:text-white dark:focus:ring-brand-950 ${
            error ? "border-red-400" : "border-gray-200 dark:border-white/10"
          }`}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
}
