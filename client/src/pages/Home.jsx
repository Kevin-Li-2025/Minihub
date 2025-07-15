import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Github, Users, Code, Star, ArrowRight } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Github,
      title: 'Project Management',
      description: 'Create and manage your coding projects with ease. Share your work with the community.'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Invite collaborators to your projects and work together on amazing ideas.'
    },
    {
      icon: Code,
      title: 'Markdown Support',
      description: 'Rich README support with markdown rendering for beautiful documentation.'
    },
    {
      icon: Star,
      title: 'Showcase Your Work',
      description: 'Display your projects to potential employers and fellow developers.'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 text-balance">
            Your <span className="text-primary-600">Coding Projects</span>, Beautifully Organized
          </h1>
          <p className="text-xl text-gray-600 mb-8 text-balance max-w-2xl mx-auto">
            MiniHub is a mini GitHub-style platform where you can create, manage, and showcase your coding projects. Perfect for building your developer portfolio.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
                  Get Started Free
                </Link>
                <Link to="/projects" className="btn btn-secondary text-lg px-8 py-3 flex items-center space-x-2">
                  <span>Explore Projects</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/create-project" className="btn btn-primary text-lg px-8 py-3">
                  Create New Project
                </Link>
                <Link to="/my-projects" className="btn btn-secondary text-lg px-8 py-3">
                  View My Projects
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to showcase your work
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              MiniHub provides all the essential features to help you organize and present your coding projects professionally.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="flex justify-center mb-4">
                  <feature.icon className="h-12 w-12 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16 rounded-2xl mx-4">
        <div className="text-center max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to showcase your projects?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of developers who use MiniHub to organize and share their coding projects.
          </p>
          
          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors">
                Sign Up for Free
              </Link>
              <Link to="/login" className="border border-primary-300 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                Sign In
              </Link>
            </div>
          ) : (
            <Link to="/create-project" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors inline-block">
              Create Your First Project
            </Link>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">1,000+</div>
              <div className="text-gray-600">Projects Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600">Active Developers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
              <div className="text-gray-600">Programming Languages</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 