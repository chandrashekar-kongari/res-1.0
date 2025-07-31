"use client";

import { LinkedInLogoIcon } from "@radix-ui/react-icons";
import React from "react";
import { Button } from "@/components/ui/button";
import { LOGIN_URL, SIGNUP_URL } from "@/utils/constants";

const Footer = () => {
  const sections = [
    {
      title: "Features",
      href: "#features",
    },
    {
      title: "Pricing",
      href: "#pricing",
    },
    {
      title: "Contact",
      href: "mailto:hello@memic.app",
    },
    {
      title: "LinkedIn",
      href: "https://www.linkedin.com/company/memic-app",
    },
  ];

  const legalLinks = [
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Privacy Policy", href: "/privacy-policy" },
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

            <p className="text-sm text-gray-500">
              Memic is a platform that helps you build your resume faster and
              easier. Contact us at{" "}
              <a href="mailto:hello@memic.app" className="text-blue-500">
                hello@memic.app
              </a>
            </p>
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={() => {
                  window.location.href = LOGIN_URL;
                }}
                variant="outline"
                size="sm"
                className="border-gray-300 rounded-xl bg-gray-50 text-gray-700 shadow-lg hover:bg-gray-50/80 hover:text-gray-700/80 text-xs"
              >
                Sign in
              </Button>
              <Button
                onClick={() => {
                  window.location.href = SIGNUP_URL;
                }}
                variant="outline"
                size="sm"
                className="border-[#AD46FF] rounded-xl bg-[#F3EBFD] text-[#AD46FF] shadow-lg hover:bg-[#F3EBFD]/80 hover:text-[#AD46FF]/80 text-xs"
              >
                Start for free
              </Button>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="flex  items-end flex-row gap-4">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="space-y-2">
                <a
                  href={section.href}
                  className="text-sm hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                >
                  {section.title}
                </a>
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
