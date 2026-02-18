'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, Star, Users, Video, Shield, Zap, Crown, Sparkles } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  excludedFeatures?: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  buttonText: string;
  buttonColor: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for personal use and trying out NexChat',
    price: '$0',
    period: 'forever',
    icon: <Users size={24} />,
    color: 'bg-slate-600',
    buttonText: 'Get Started',
    buttonColor: 'bg-slate-600 hover:bg-slate-700',
    features: [
      'Unlimited 1-on-1 video calls',
      'Unlimited instant messaging',
      'End-to-end encryption',
      'Basic emojis & reactions',
      'Mobile app access',
      'Email support',
    ],
    excludedFeatures: [
      'Group video calls',
      'Screen sharing',
      'Call recording',
      'Advanced analytics',
      'Priority support',
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals and small teams who need more',
    price: '$9.99',
    period: 'per month',
    icon: <Zap size={24} />,
    color: 'bg-emerald-600',
    buttonText: 'Start Free Trial',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    popular: true,
    features: [
      'Everything in Free',
      'Group video calls (up to 4 people)',
      'Screen sharing',
      'HD video quality',
      'Custom backgrounds',
      'Message scheduling',
      'Priority email support',
      'Ad-free experience',
    ],
    excludedFeatures: [
      'Large group calls (10+ people)',
      'Call recording',
      'Advanced analytics',
      'API access',
      'Dedicated support',
    ]
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For growing teams and businesses',
    price: '$24.99',
    period: 'per user/month',
    icon: <Shield size={24} />,
    color: 'bg-blue-600',
    buttonText: 'Start Free Trial',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    features: [
      'Everything in Pro',
      'Group video calls (up to 10 people)',
      'Call recording & storage',
      'Team management dashboard',
      'Advanced analytics & insights',
      'Custom branding',
      'API access',
      'SSO authentication',
      'Priority phone support',
      '99.9% uptime SLA',
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: 'Custom',
    period: 'pricing',
    icon: <Crown size={24} />,
    color: 'bg-purple-600',
    buttonText: 'Contact Sales',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    features: [
      'Everything in Business',
      'Unlimited group calls',
      'White-label solution',
      'On-premise deployment option',
      'Advanced security features',
      'Custom integrations',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom SLA agreements',
      'Training & onboarding',
    ]
  }
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const getAdjustedPrice = (plan: PricingPlan) => {
    if (plan.id === 'free' || plan.id === 'enterprise') return plan.price;
    
    if (isAnnual) {
      const monthlyPrice = parseFloat(plan.price.replace('$', ''));
      const annualPrice = monthlyPrice * 10; // 2 months free
      return `$${annualPrice.toFixed(2)}`;
    }
    
    return plan.price;
  };

  const getAdjustedPeriod = (plan: PricingPlan) => {
    if (plan.id === 'free' || plan.id === 'enterprise') return plan.period;
    return isAnnual ? 'per year' : 'per month';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link 
              href="/"
              className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <Sparkles size={16} />
              </div>
              <span className="text-lg font-bold text-slate-900">NexChat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-500 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Sparkles size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-emerald-50 text-lg max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your needs. Start free and upgrade as you grow.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-emerald-200'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-emerald-400' : 'bg-emerald-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-emerald-200'}`}>
              Annual
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-emerald-400 text-emerald-900 text-xs font-bold rounded-full">
              Save 20%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          {pricingPlans.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 ${
                plan.popular 
                  ? 'border-emerald-500 shadow-2xl scale-105' 
                  : 'border-slate-200 shadow-lg'
              } overflow-hidden`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}
              
              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${plan.color} text-white mb-4`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-600 text-sm mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-slate-900">{getAdjustedPrice(plan)}</span>
                      <span className="text-slate-600 text-sm">{getAdjustedPeriod(plan)}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="text-emerald-600 mt-0.5 flex-shrink-0" size={16} />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.excludedFeatures?.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 opacity-50">
                      <X className="text-slate-400 mt-0.5 flex-shrink-0" size={16} />
                      <span className="text-slate-500 text-sm line-through">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  href={plan.id === 'free' ? '/chat' : '#'}
                  className={`w-full inline-flex items-center justify-center px-4 py-3 rounded-lg font-semibold text-white transition-colors ${plan.buttonColor}`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Free</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Pro</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Business</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">Video Call Quality</td>
                  <td className="text-center py-3 px-4 text-slate-600">Standard</td>
                  <td className="text-center py-3 px-4 text-slate-600">HD</td>
                  <td className="text-center py-3 px-4 text-slate-600">HD</td>
                  <td className="text-center py-3 px-4 text-slate-600">4K</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">Max Call Participants</td>
                  <td className="text-center py-3 px-4 text-slate-600">2</td>
                  <td className="text-center py-3 px-4 text-slate-600">4</td>
                  <td className="text-center py-3 px-4 text-slate-600">10</td>
                  <td className="text-center py-3 px-4 text-slate-600">Unlimited</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">Screen Sharing</td>
                  <td className="text-center py-3 px-4">
                    <X className="text-slate-400 mx-auto" size={16} />
                  </td>
                  <td className="text-center py-3 px-4">
                    <Check className="text-emerald-600 mx-auto" size={16} />
                  </td>
                  <td className="text-center py-3 px-4">
                    <Check className="text-emerald-600 mx-auto" size={16} />
                  </td>
                  <td className="text-center py-3 px-4">
                    <Check className="text-emerald-600 mx-auto" size={16} />
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">Call Recording</td>
                  <td className="text-center py-3 px-4">
                    <X className="text-slate-400 mx-auto" size={16} />
                  </td>
                  <td className="text-center py-3 px-4">
                    <X className="text-slate-400 mx-auto" size={16} />
                  </td>
                  <td className="text-center py-3 px-4">
                    <Check className="text-emerald-600 mx-auto" size={16} />
                  </td>
                  <td className="text-center py-3 px-4">
                    <Check className="text-emerald-600 mx-auto" size={16} />
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">API Access</td>
                  <td className="text-center py-3 px-4">
                    <X className="text-slate-400 mx-auto" size={16} />
                  </td>
                  <td className="text-center py-3 px-4">
                    <X className="text-slate-400 mx-auto" size={16} />
                  </td>
                  <td className="text-center py-3 px-4">
                    <Check className="text-emerald-600 mx-auto" size={16} />
                  </td>
                  <td className="text-center py-3 px-4">
                    <Check className="text-emerald-600 mx-auto" size={16} />
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 text-slate-700">Support Level</td>
                  <td className="text-center py-3 px-4 text-slate-600">Email</td>
                  <td className="text-center py-3 px-4 text-slate-600">Priority Email</td>
                  <td className="text-center py-3 px-4 text-slate-600">Phone</td>
                  <td className="text-center py-3 px-4 text-slate-600">24/7 Dedicated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-600">Common questions about our pricing plans</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Can I change my plan anytime?</h3>
            <p className="text-slate-600 text-sm">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Is there a free trial for paid plans?</h3>
            <p className="text-slate-600 text-sm">
              Yes! We offer a 14-day free trial for Pro and Business plans. No credit card required to start your trial.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-slate-600 text-sm">
              We accept all major credit cards, PayPal, and wire transfers for Enterprise plans. All payments are processed securely.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-emerald-50 mb-6">
            Join thousands of users who trust NexChat for their communication needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              <Users size={20} />
              Start Free
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-800 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
