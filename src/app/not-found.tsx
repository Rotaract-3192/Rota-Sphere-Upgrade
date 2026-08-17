import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-gray-50 text-center">
      <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1e9df1] flex items-center justify-center mx-auto shadow-inner shrink-0">
          <Search size={32} />
        </div>

        <div className="w-full text-center space-y-2">
          <span className="text-4xl font-black text-gray-900 block tracking-tight">404</span>
          <h1 className="text-xl font-bold text-gray-900 block text-center w-full">Page Not Found</h1>
          <p className="text-xs sm:text-sm text-gray-500 w-full max-w-xs mx-auto text-center block leading-relaxed">
            The page or event pass you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/events"
            className="flex-1 bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs py-3 px-5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
          >
            <Search size={15} /> Explore Events
          </Link>
          <Link
            href="/"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3 px-5 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <Home size={15} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
