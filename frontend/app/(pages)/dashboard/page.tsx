"use client";

import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Home,
  Tractor,
  Store,
  History,
  X,
  Leaf,
  Menu,
  Bell,
  ChevronDown,
  BarChart2,
  Users,
  ShoppingBasket,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// --- Reusable Utility ---
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// --- Mock Data ---
const user = {
  name: "Benjamin Agro",
  email: "ben.agro@smartfarm.ng",
  imageUrl: "https://placehold.co/32x32/4ADE80/ffffff?text=BA",
};

const navigation = [
  { name: "Dashboard", href: "#", view: "dashboard", icon: Home },
  { name: "My Farms", href: "#", view: "farms", icon: Tractor },
  { name: "Vendors", href: "#", view: "vendors", icon: Store },
  { name: "Transaction History", href: "#", view: "history", icon: History },
];

// --- Child Components ---

const SidebarContent = ({
  activeView,
  setActiveView,
}: {
  activeView: string;
  setActiveView: (view: string) => void;
}) => (
  <>
    <div className="flex h-16 shrink-0 items-center px-4 bg-green-700">
      <Link href="/" className="flex items-center gap-2 text-white">
        <Leaf size={28} />
        <span className="text-2xl font-bold">SmartFarmPro</span>
      </Link>
    </div>
    <nav className="flex flex-1 flex-col mt-4">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => setActiveView(item.view)}
                  className={classNames(
                    activeView === item.view
                      ? "bg-green-700 text-white"
                      : "text-gray-700 hover:text-white hover:bg-green-700/80",
                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-left"
                  )}
                >
                  <item.icon
                    className={classNames(
                      activeView === item.view
                        ? "text-white"
                        : "text-gray-400 group-hover:text-white",
                      "h-6 w-6 shrink-0"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </nav>
  </>
);

const Header = ({
  setSidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void;
}) => (
  <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
    <button
      type="button"
      className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
      onClick={() => setSidebarOpen(true)}
    >
      <span className="sr-only">Open sidebar</span>
      <Menu className="h-6 w-6" aria-hidden="true" />
    </button>
    <div className="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />
    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="relative">
          <button className="-m-1.5 flex items-center p-1.5">
            <span className="sr-only">Open user menu</span>
            <Image
              className="h-8 w-8 rounded-full bg-gray-50"
              src={user.imageUrl}
              alt=""
               width={32}
              height={32}
            />
            <span className="hidden lg:flex lg:items-center">
              <span
                className="ml-4 text-sm font-semibold leading-6 text-gray-900"
                aria-hidden="true"
              >
                {user.name}
              </span>
              <ChevronDown
                className="ml-2 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

const WelcomeBanner = () => {
  const date = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="relative overflow-hidden rounded-lg bg-green-600 p-6 shadow-lg text-white">
      <div className="relative z-10">
        <h2 className="text-2xl font-bold">Welcome back, {user.name}!</h2>
        <p className="mt-1 text-green-100">
          Here&apos;s your farm&apos;s summary for {date}.
        </p>
        <p className="mt-1 text-green-200 text-sm">
          Location: Kaduna South, Kaduna
        </p>
      </div>
      <Leaf className="absolute -right-4 -bottom-8 h-32 w-32 text-green-500/30 opacity-50" />
    </div>
  );
};

const DashboardContent = () => {
  const summaryCards = [
    {
      title: "Total Farms Managed",
      value: "3",
      icon: Leaf,
      change: "+1 this month",
    },
    {
      title: "Active Forecasts",
      value: "5",
      icon: BarChart2,
      change: "2 upcoming",
    },
    {
      title: "Verified Vendors",
      value: "28",
      icon: Users,
      change: "Kaduna region",
    },
    {
      title: "Pending Orders",
      value: "2",
      icon: ShoppingBasket,
      change: "Awaiting confirmation",
    },
  ];
  return (
    <div className="space-y-8">
      <WelcomeBanner />
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Farm Overview
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="overflow-hidden rounded-lg bg-white p-5 shadow transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <card.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      {card.title}
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {card.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">{card.change}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <div className="mt-4 text-center text-gray-500">
          <p>Activity feed will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

const PlaceholderContent = ({ title }: { title: string }) => (
  <div className="bg-white p-8 rounded-lg shadow">
    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
    <p className="mt-4 text-gray-600">
      This is a placeholder page for the {title} section. Content will be added
      here soon.
    </p>
  </div>
);

// --- Main App Component ---
export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardContent />;
      case "farms":
        return <PlaceholderContent title="My Farms" />;
      case "vendors":
        return <PlaceholderContent title="Vendors" />;
      case "history":
        return <PlaceholderContent title="Transaction History" />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100/50">
      {/* Mobile Sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white pb-4">
                  <SidebarContent
                    activeView={activeView}
                    setActiveView={setActiveView}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white">
          <SidebarContent
            activeView={activeView}
            setActiveView={setActiveView}
          />
        </div>
      </div>

      <div className="lg:pl-72">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
