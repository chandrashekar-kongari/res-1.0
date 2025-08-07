"use client";

import { MenuIcon } from "lucide-react";
import { LOGIN_URL, SIGNUP_URL } from "@/utils/constants";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";

const Navbar = () => {
  return (
    <section className="sticky top-2 sm:top-2 z-[100]  max-w-4xl w-full mx-auto px-4 sm:px-6">
      <div className="py-2 sm:py-3 px-3 sm:px-6 border border-white/20 rounded-2xl mt-2 sm:mt-4 bg-white/20 backdrop-blur ">
        <nav className="flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <div className="w-8 h-12 rounded-lg  flex items-center justify-center flex-shrink-0  ">
              <Image
                src="/memic-logo-4.svg"
                alt="Memic"
                width={48}
                height={48}
              />
            </div>
            <span className="text-sm sm:text-lg font-semibold tracking-tight truncate text-gray-900">
              Memic
            </span>
          </a>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#features"
                  className={`${navigationMenuTriggerStyle()} text-gray-700 text-xs rounded-xl hover:text-gray-900 hover:bg-gray-50 transition-colors`}
                >
                  Features
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#pricing"
                  className={`${navigationMenuTriggerStyle()} text-gray-700 text-xs rounded-xl hover:text-gray-900 hover:bg-gray-50 transition-colors`}
                >
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="mailto:hello@memic.app"
                  className={`${navigationMenuTriggerStyle()} text-gray-700 text-xs rounded-xl hover:text-gray-900 hover:bg-gray-50 transition-colors`}
                >
                  Contact
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-3">
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
              className="rounded-xl bg-[#AD46FF] hover:bg-[#AD46FF]/80 text-white shadow-lg border-none shadow-[#AD46FF]/25 text-xs hover:text-white"
            >
              Start for free
            </Button>
          </div>

          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 flex-shrink-0 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <MenuIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="top"
              className="max-h-screen overflow-auto bg-white/95 backdrop-blur-md"
            >
              <SheetHeader className="text-left">
                <SheetTitle>
                  <a href="#" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#AD46FF] to-[#ca92f7] flex items-center justify-center shadow-lg shadow-[#AD46FF]/25">
                      <span className="text-white font-bold text-base">M</span>
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-gray-900">
                      Memic
                    </span>
                  </a>
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col space-y-4 mt-6">
                {/* Mobile Navigation Links */}
                <div className="flex flex-col space-y-2">
                  <a
                    href="#features"
                    className="font-medium text-base py-2 px-3 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Features
                  </a>
                  <a
                    href="#pricing"
                    className="font-medium text-base py-2 px-3 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Pricing
                  </a>
                  <a
                    href="mailto:hello@memic.app"
                    className="font-medium text-base py-2 px-3 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Contact
                  </a>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      window.location.href = LOGIN_URL;
                    }}
                    variant="outline"
                    className="w-full border-gray-300 rounded-xl bg-gray-50 text-gray-700 shadow-lg hover:bg-gray-50/80 hover:text-gray-700/80"
                  >
                    Sign in
                  </Button>
                  <Button
                    onClick={() => {
                      window.location.href = SIGNUP_URL;
                    }}
                    variant="outline"
                    className="w-full border-[#AD46FF] rounded-xl bg-[#F3EBFD] text-[#AD46FF] shadow-lg hover:bg-[#F3EBFD]/80 hover:text-[#AD46FF]/80"
                  >
                    Start for free
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </section>
  );
};

export { Navbar };
