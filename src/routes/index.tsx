import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Button } from '../components/common/Button';
import { FileText, PlusCircle, BarChart, Zap, Shield, Users } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate({ to: '/dashboard' });
    } else {
      navigate({ to: '/auth/register' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl mb-6 shadow-2xl">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create Amazing Quizzes
            </span>
            <br />
            <span className="text-gray-800">& Forms with Ease</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Build, share, and analyze forms with our powerful platform. Inspired by Microsoft Forms,
            designed for simplicity.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              variant="primary"
              className="shadow-xl hover:shadow-2xl"
              onClick={handleGetStarted}
            >
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 mr-2" />
                Get Started Free
              </div>
            </Button>
            <Link to="/forms">
              <Button size="lg" variant="secondary" className="shadow-lg hover:shadow-xl">
                Browse Forms
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 animate-slide-up">
          {/* Feature 1 */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Lightning Fast</h3>
            <p className="text-gray-600 leading-relaxed">
              Create forms with multiple question types in minutes. Intuitive drag-and-drop
              interface makes it effortless.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Secure & Reliable</h3>
            <p className="text-gray-600 leading-relaxed">
              Your data is protected with Firebase security. Enterprise-grade infrastructure you can
              trust.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg">
                <BarChart className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Powerful Analytics</h3>
            <p className="text-gray-600 leading-relaxed">
              Track responses and analyze results in real-time. Get insights with beautiful charts
              and statistics.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 shadow-2xl">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">3+</div>
              <div className="text-purple-100">Question Types</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">∞</div>
              <div className="text-blue-100">Unlimited Forms</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100%</div>
              <div className="text-purple-100">Free to Use</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">
            Ready to create your first form?
          </h2>
          <Button size="lg" className="shadow-xl hover:shadow-2xl" onClick={handleGetStarted}>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 mr-2" />
              Join Now - It's Free!
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
