import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

export default function Handler(props: any) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Company Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-3">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-[#AD46FF] to-[#ca92f7] bg-clip-text text-transparent">
              Memic
            </span>
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Create professional resumes with AI assistance. Build stunning
            resumes that stand out to recruiters in minutes.
          </p>
        </div>

        {/* Auth Card */}
        <div className="relative">
          {/* Background with glassmorphism effect */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"></div>

          {/* Subtle gradient accents */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#AD46FF]/20 to-transparent rounded-full blur-md"></div>
          <div className="absolute -bottom-3 -left-3 w-12 h-12 bg-gradient-to-tr from-[#00C950]/15 to-transparent rounded-full blur-lg"></div>

          {/* Content */}
          <div className="relative p-8">
            <StackHandler
              app={stackServerApp}
              routeProps={props}
              fullPage={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-3">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#00C950]"></div>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#AD46FF]"></div>
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
