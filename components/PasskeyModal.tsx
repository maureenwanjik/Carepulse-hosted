"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const PasskeyModal = () => {
  const router = useRouter();
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const closeModal = () => router.push("/");

  const validatePasskey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
      });

      if (!response.ok) {
        setError(response.status === 429
          ? "Too many attempts. Please wait before trying again."
          : "Invalid passkey. Please try again.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Could not verify the passkey. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form onSubmit={validatePasskey} className="shad-alert-dialog w-full max-w-lg space-y-6 rounded-2xl p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-20-semibold">Admin Access Verification</h1>
          <button type="button" onClick={closeModal} aria-label="Close admin access dialog">
            <Image src="/assets/icons/close.svg" alt="" width={24} height={24} />
          </button>
        </header>
        <p className="text-14-regular text-dark-700">Enter the admin passphrase to continue.</p>
        <label className="block space-y-2">
          <span className="shad-input-label">Admin passphrase</span>
          <input
            autoFocus
            autoComplete="current-password"
            type="password"
            value={passkey}
            onChange={(event) => setPasskey(event.target.value)}
            minLength={12}
            maxLength={128}
            required
            className="shad-input w-full"
          />
        </label>
        <p className="text-12-regular text-dark-700">Use the private admin passphrase configured for this site (at least 12 characters).</p>
        {error && <p role="alert" className="shad-error text-14-regular">{error}</p>}
        <button type="submit" disabled={submitting} className="shad-primary-btn w-full disabled:opacity-60">
          {submitting ? "Verifying..." : "Enter Admin"}
        </button>
      </form>
    </div>
  );
};

export default PasskeyModal;
