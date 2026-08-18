import { getCurrentUser } from "@/lib/auth/getUser";
import { redirect } from "next/navigation";
import { PrivacyCenterClient } from "./PrivacyCenterClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Privacy Center | RotaSphere District 3192",
  description: "Manage your data, consents, and privacy rights under the Digital Personal Data Protection Act 2023.",
  robots: "noindex, nofollow",
};

export default async function PrivacyCenterPage() {
  const user = await getCurrentUser();
  if (!user?.clerkId) {
    redirect("/sign-in?redirect=/privacy-center");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#1e9df1] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            DPDP Act 2023
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Your Privacy Center
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          Under the Digital Personal Data Protection Act 2023, you have rights over your personal data. Manage your consents, request your data, raise concerns, or delete your account here.
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-600">
          Privacy contact: <a href="mailto:tech.rotaract3192@gmail.com" className="underline">tech.rotaract3192@gmail.com</a>
        </p>
      </div>
      <PrivacyCenterClient userEmail={user.email!} userName={user.profile.full_name ?? user.email ?? "User"} userId={user.clerkId} />
    </div>
  );
}
