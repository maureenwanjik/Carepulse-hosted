"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { useState } from "react";
import {
  UserFormValidation,
  LoginFormValidation,
  ForgotPasswordValidation,
  ResetPasswordValidation,
} from "../../lib/validation";
import { useRouter } from "next/navigation";
import {
  createUser,
  loginUser,
  sendPasswordResetOTP,
  resetPassword,
} from "@/lib/actions/patient.actions";

type AuthMode = "signup" | "login" | "forgot" | "reset";

// ─── Password Input Field (with show/hide toggle) ─────────────────────────────
const PasswordField = ({
  form,
  name,
  label,
  placeholder,
}: {
  form: any;
  name: string;
  label: string;
  placeholder?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <label className="shad-input-label text-14-medium text-dark-700">
        {label}
      </label>
      <div className="flex rounded-md border border-dark-500 bg-dark-400">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••••"}
          {...form.register(name)}
          className="shad-input border-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-dark-600 outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="px-3 text-dark-600 hover:text-white transition-colors text-sm"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {form.formState.errors[name] && (
        <p className="shad-error text-red-400 text-12-regular">
          {form.formState.errors[name]?.message as string}
        </p>
      )}
    </div>
  );
};

// ─── Sign Up Form ─────────────────────────────────────────────────────────────
const SignUpForm = ({ onSwitch }: { onSwitch: (mode: AuthMode) => void }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof UserFormValidation>>({
    resolver: zodResolver(UserFormValidation),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: z.infer<typeof UserFormValidation>) => {
    setIsLoading(true);
    setError("");
    try {
      const newUser = await createUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      if (newUser) router.push(`/patients/${newUser.$id}/register`);
      else setError("Could not create account. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="name"
          label="Full name"
          placeholder="John Doe"
          iconSrc="/assets/icons/user.svg"
          iconAlt="user"
        />
        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="email"
          label="Email"
          placeholder="johndoe@gmail.com"
          iconSrc="/assets/icons/email.svg"
          iconAlt="email"
        />
        <CustomFormField
          fieldType={FormFieldType.PHONE_INPUT}
          control={form.control}
          name="phone"
          label="Phone number"
          placeholder="700000000"
        />
        <PasswordField form={form} name="password" label="Password" />
        <PasswordField
          form={form}
          name="confirmPassword"
          label="Confirm Password"
          placeholder="••••••••"
        />
        {error && <p className="text-red-400 text-12-regular">{error}</p>}
        <SubmitButton isLoading={isLoading}>Create Account</SubmitButton>
        <p className="text-center text-14-regular text-dark-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitch("login")}
            className="text-green-500 hover:underline"
          >
            Login
          </button>
        </p>
      </form>
    </Form>
  );
};

// ─── Login Form ───────────────────────────────────────────────────────────────
const LoginForm = ({ onSwitch }: { onSwitch: (mode: AuthMode) => void }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof LoginFormValidation>>({
    resolver: zodResolver(LoginFormValidation),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof LoginFormValidation>) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await loginUser(values.email, values.password);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="email"
          label="Email"
          placeholder="johndoe@gmail.com"
          iconSrc="/assets/icons/email.svg"
          iconAlt="email"
        />
        <PasswordField form={form} name="password" label="Password" />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSwitch("forgot")}
            className="text-12-regular text-green-500 hover:underline"
          >
            Forgot password?
          </button>
        </div>
        {error && <p className="text-red-400 text-12-regular">{error}</p>}
        <SubmitButton isLoading={isLoading}>Login</SubmitButton>
        <p className="text-center text-14-regular text-dark-600">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitch("signup")}
            className="text-green-500 hover:underline"
          >
            Sign up
          </button>
        </p>
      </form>
    </Form>
  );
};

// ─── Forgot Password Form ─────────────────────────────────────────────────────
const ForgotPasswordForm = ({
  onSwitch,
  onOTPSent,
}: {
  onSwitch: (mode: AuthMode) => void;
  onOTPSent: (email: string) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const form = useForm<z.infer<typeof ForgotPasswordValidation>>({
    resolver: zodResolver(ForgotPasswordValidation),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof ForgotPasswordValidation>) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await sendPasswordResetOTP(values.email);
      if (result?.error) {
        setError(result.error);
      } else {
        setSent(true);
        setTimeout(() => onOTPSent(values.email), 1500);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-14-regular text-dark-700">
          Enter your email and we&apos;ll send you a 6-digit reset code.
        </p>
        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="email"
          label="Email"
          placeholder="johndoe@gmail.com"
          iconSrc="/assets/icons/email.svg"
          iconAlt="email"
        />
        {error && <p className="text-red-400 text-12-regular">{error}</p>}
        {sent && (
          <p className="text-green-500 text-12-regular">
            ✓ OTP sent! Check your email.
          </p>
        )}
        <SubmitButton isLoading={isLoading}>Send Reset Code</SubmitButton>
        <p className="text-center text-14-regular text-dark-600">
          <button
            type="button"
            onClick={() => onSwitch("login")}
            className="text-green-500 hover:underline"
          >
            ← Back to Login
          </button>
        </p>
      </form>
    </Form>
  );
};

// ─── Reset Password Form ──────────────────────────────────────────────────────
const ResetPasswordForm = ({
  email,
  onSwitch,
}: {
  email: string;
  onSwitch: (mode: AuthMode) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof ResetPasswordValidation>>({
    resolver: zodResolver(ResetPasswordValidation),
    defaultValues: { otp: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: z.infer<typeof ResetPasswordValidation>) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await resetPassword(email, values.otp, values.password);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => onSwitch("login"), 2000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-14-regular text-dark-700">
          Enter the 6-digit code sent to{" "}
          <span className="text-white">{email}</span>
        </p>
        <div className="space-y-2">
          <label className="shad-input-label text-14-medium text-dark-700">
            Reset Code
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="123456"
            {...form.register("otp")}
            className="shad-input w-full rounded-md border border-dark-500 bg-dark-400 px-3 py-2 text-center text-18-bold tracking-[0.5em] text-white placeholder:text-dark-600 outline-none"
          />
          {form.formState.errors.otp && (
            <p className="text-red-400 text-12-regular">
              {form.formState.errors.otp.message}
            </p>
          )}
        </div>
        <PasswordField form={form} name="password" label="New Password" />
        <PasswordField form={form} name="confirmPassword" label="Confirm New Password" />
        {error && <p className="text-red-400 text-12-regular">{error}</p>}
        {success && (
          <p className="text-green-500 text-12-regular">
            ✓ Password reset! Redirecting to login...
          </p>
        )}
        <SubmitButton isLoading={isLoading}>Reset Password</SubmitButton>
        <p className="text-center text-14-regular text-dark-600">
          <button
            type="button"
            onClick={() => onSwitch("forgot")}
            className="text-green-500 hover:underline"
          >
            ← Resend code
          </button>
        </p>
      </form>
    </Form>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const PatientForm = () => {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [resetEmail, setResetEmail] = useState("");

  const titles: Record<AuthMode, string> = {
    signup: "Welcome our online pharmacy 💊💉👨‍⚕️",
    login: "Welcome back 👋",
    forgot: "Reset your password 🔑",
    reset: "Enter your reset code 📩",
  };

  const subtitles: Record<AuthMode, string> = {
    signup: "Get started with appointments.",
    login: "Login to access your dashboard.",
    forgot: "We'll send a code to your email.",
    reset: "Enter the code and your new password.",
  };

  const handleOTPSent = (email: string) => {
    setResetEmail(email);
    setMode("reset");
  };

  return (
    <div className="flex-1 space-y-6">
      <section className="mb-6 space-y-2">
        <h1 className="header">{titles[mode]}</h1>
        <p className="text-dark-700">{subtitles[mode]}</p>
      </section>

      {(mode === "signup" || mode === "login") && (
        <div className="flex rounded-lg border border-dark-500 bg-dark-400 p-1 gap-1 mb-2">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-2 text-14-medium transition-colors ${
              mode === "signup"
                ? "bg-green-500 text-white"
                : "text-dark-700 hover:text-white"
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md py-2 text-14-medium transition-colors ${
              mode === "login"
                ? "bg-green-500 text-white"
                : "text-dark-700 hover:text-white"
            }`}
          >
            Login
          </button>
        </div>
      )}

      {mode === "signup" && <SignUpForm onSwitch={setMode} />}
      {mode === "login" && <LoginForm onSwitch={setMode} />}
      {mode === "forgot" && (
        <ForgotPasswordForm onSwitch={setMode} onOTPSent={handleOTPSent} />
      )}
      {mode === "reset" && (
        <ResetPasswordForm email={resetEmail} onSwitch={setMode} />
      )}
    </div>
  );
};