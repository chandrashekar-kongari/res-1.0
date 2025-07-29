import { LinkedInLogoIcon } from "@radix-ui/react-icons";
import React from "react";

const Footer = () => {
  const sections = [
    {
      title: "Features",
    },
    {
      title: "Pricing",
    },
    {
      title: "Contact",
    },
    {
      title: "LinkedIn",
    },
  ];

  const socialLinks = [
    {
      icon: <LinkedInLogoIcon className="size-5" />,
      href: "#",
      label: "LinkedIn",
    },
  ];

  const legalLinks = [
    { name: "Terms of Service", href: "#" },
    { name: "Privacy Policy", href: "#" },
  ];

  return (
    <section className="flex justify-center items-center w-full  ">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col justify-between gap-8 sm:gap-10 lg:gap-12 lg:flex-row lg:items-start">
          {/* Logo and Description Section */}
          <div className="flex w-full flex-col gap-4 sm:gap-6 lg:w-1/3 lg:max-w-sm">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-lg sm:text-xl font-semibold truncate text-gray-900">
                Memic
              </h2>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="flex  items-end flex-row gap-4">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="space-y-2">
                <h3 className="text-sm ">{section.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 sm:mt-12 lg:mt-16 pt-6 sm:pt-8 border-t border-gray-200">
          <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
            {/* Copyright */}
            <p className="text-gray-500 text-xs sm:text-sm font-medium order-2 md:order-1">
              © 2025 Memic. All rights reserved.
            </p>

            {/* Legal Links */}
            <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:gap-6 order-1 md:order-2">
              {legalLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  className="text-black hover:text-gray-900 transition-colors duration-200 text-xs "
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Subtle bottom accent */}
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-[#AD46FF] to-transparent rounded-full opacity-30"></div>
              <div className="w-1 h-1 bg-gradient-to-r from-[#00C950] to-transparent rounded-full opacity-40"></div>
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-[#FE9900] to-transparent rounded-full opacity-35"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Footer };
