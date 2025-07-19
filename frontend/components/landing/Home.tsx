import {
  BrainCircuit,
  Wind,
  ShoppingCart,
  BarChart,
  CheckCircle,
  Leaf,
} from "lucide-react";
import Link from "next/link";

// Main Landing Page Component
export default function LandingPage() {
  return (
    <div className="bg-white text-gray-800 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white bg-opacity-90 backdrop-blur-md shadow-sm z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-green-700">
            <Link href="/" className="flex items-center gap-2">
              <Leaf size={28} />
              <span>SmartFarmPro</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/auth"
              className="text-gray-600 hover:text-green-700 transition-colors"
            >
              Login
            </a>
            <a
              href="/auth"
              className="bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 transition-all shadow"
            >
              Register
            </a>
          </div>
        </nav>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section
          className="relative h-[80vh] min-h-[500px] flex items-center text-white bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1492496913980-501348b61469?q=80&w=1887&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative container mx-auto px-6 text-center z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
              Cultivate a Smarter Future for Your Farm
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-gray-200">
              SmartFarmPro is your AI and Blockchain powered assistant, helping
              farmers in Nigeria forecast needs, optimize resources, and connect
              with trusted vendors.
            </p>
            <a
              href="/auth"
              className="bg-green-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition-all shadow-lg"
            >
              Get Started for Free
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                The Future of Farming is Here
              </h2>
              <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
                Leverage cutting-edge technology designed for the modern
                Nigerian farmer.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<BrainCircuit size={40} className="text-green-600" />}
                title="AI-Powered Forecasting"
                description="Our intelligent system analyzes seasonal patterns and historical data to predict your crop needs, from seeds to fertilizer, helping you plan ahead and reduce waste."
              />
              <FeatureCard
                icon={<Wind size={40} className="text-green-600" />}
                title="Real-Time Weather Insights"
                description="Get hyper-local weather forecasts for locations like Kaduna South. Make informed decisions about planting, irrigation, and harvesting based on reliable data."
              />
              <FeatureCard
                icon={<ShoppingCart size={40} className="text-green-600" />}
                title="Blockchain Vendor Marketplace"
                description="Connect with a network of verified, nearby vendors for all your farm supplies. Our blockchain-based system ensures transparent, secure, and fair transactions."
              />
              <FeatureCard
                icon={<BarChart size={40} className="text-green-600" />}
                title="Yield Optimization"
                description="Receive data-driven recommendations to maximize your crop yield and profitability. Our AI helps you choose the right crops for the right season."
              />
              <FeatureCard
                icon={<CheckCircle size={40} className="text-green-600" />}
                title="Quality Assurance"
                description="Blockchain provides an immutable record of your produce's journey, from farm to market, increasing trust with buyers and opening up new premium markets."
              />
              <FeatureCard
                icon={<Leaf size={40} className="text-green-600" />}
                title="Sustainable Practices"
                description="Optimize water and fertilizer usage with our AI suggestions, promoting sustainable farming practices that are both cost-effective and environmentally friendly."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Simple Steps to a Smarter Farm
              </h2>
              <p className="text-lg text-gray-600 mt-2">
                Get up and running in minutes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <HowItWorksStep
                step="1"
                title="Register Your Farm"
                description="Create your free account and provide basic details about your farm, including location and crop types."
              />
              <HowItWorksStep
                step="2"
                title="Get AI Forecasts"
                description="Our system instantly analyzes your data and provides tailored forecasts for your upcoming planting season."
              />
              <HowItWorksStep
                step="3"
                title="Connect & Transact"
                description="Browse the secure marketplace to find and transact with trusted local vendors for your forecasted needs."
              />
            </div>
            <div className="text-center mt-12">
              <a
                href="/register"
                className="bg-green-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition-all shadow-lg"
              >
                Start Your Smart Farm Today
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">SmartFarmPro</h3>
              <p className="text-gray-400">
                Empowering Nigerian Farmers with Technology.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#features" className="hover:text-green-400">
                Features
              </a>
              <a href="/register" className="hover:text-green-400">
                Register
              </a>
              <a href="/login" className="hover:text-green-400">
                Login
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-4 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} SmartFarmPro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sub-component for Feature Cards
// In a real project, this would be in `app/components/landing/FeatureCard.tsx`
const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

// Sub-component for How It Works Steps
// In a real project, this would be in `app/components/landing/HowItWorksStep.tsx`
const HowItWorksStep = ({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) => (
  <div className="relative">
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md">
      {step}
    </div>
    <div className="pt-12 bg-gray-50 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);
