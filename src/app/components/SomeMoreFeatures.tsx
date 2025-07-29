import { RocketIcon, TimerIcon, CheckCircledIcon } from "@radix-ui/react-icons";

const SomeMoreFeatures = () => {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-white">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
            <div className="group text-center space-y-3 p-6 rounded-xl bg-gradient-to-br from-white to-gray-50/50 border border-gray-100 hover:border-[#AD46FF]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#AD46FF]/5">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#AD46FF]/10 to-[#ca92f7]/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <RocketIcon className="w-6 h-6 text-[#AD46FF]" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                AI-Powered Writing
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Let AI help you write your resume
              </p>
            </div>

            <div className="group text-center space-y-3 p-6 rounded-xl bg-gradient-to-br from-white to-gray-50/50 border border-gray-100 hover:border-[#00C950]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#00C950]/5">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#00C950]/10 to-[#4ade80]/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TimerIcon className="w-6 h-6 text-[#00C950]" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                Lightning Fast
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Save your time from copy pasting
              </p>
            </div>

            <div className="group text-center space-y-3 p-6 rounded-xl bg-gradient-to-br from-white to-gray-50/50 border border-gray-100 hover:border-[#FE9900]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#FE9900]/5">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#FE9900]/10 to-[#f59e0b]/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircledIcon className="w-6 h-6 text-[#FE9900]" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                ATS Friendly
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Make your resume ATS ready
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { SomeMoreFeatures };
