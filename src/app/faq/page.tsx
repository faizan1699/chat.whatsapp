'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, MessageSquare, Video, Shield, Zap, Users, Globe, Mail } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ReactNode;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What is NexChat and how does it work?',
    answer: 'NexChat is a WebRTC-based communication platform that enables real-time video calls and instant messaging directly in your browser. Using peer-to-peer technology, we provide crystal-clear video calls and instant messaging without requiring any software installation. Simply create an account and start connecting with others instantly.',
    category: 'General',
    icon: <MessageSquare size={20} />
  },
  {
    id: '2',
    question: 'Is NexChat really free to use?',
    answer: 'Yes! NexChat offers a free tier with unlimited messaging and video calls. Our basic features are completely free, and we also offer premium features for users who need advanced functionality like group calls, screen sharing, and enhanced security features.',
    category: 'Pricing',
    icon: <Zap size={20} />
  },
  {
    id: '3',
    question: 'How secure are my conversations on NexChat?',
    answer: 'Security is our top priority. All video calls and messages are encrypted using industry-standard encryption protocols. We use end-to-end encryption for direct peer-to-peer connections, ensuring that only you and the person you\'re communicating with can access your conversation content.',
    category: 'Security',
    icon: <Shield size={20} />
  },
  {
    id: '4',
    question: 'Do I need to install any software to use NexChat?',
    answer: 'No installation required! NexChat runs entirely in your web browser using modern WebRTC technology. As long as you have a recent version of Chrome, Firefox, Safari, or Edge, you can start using NexChat immediately without any downloads or plugins.',
    category: 'Technical',
    icon: <Globe size={20} />
  },
  {
    id: '5',
    question: 'Can I use NexChat on mobile devices?',
    answer: 'Yes! NexChat is fully responsive and works great on smartphones and tablets. Simply open your mobile browser and navigate to our website. The interface automatically adapts to your screen size for optimal mobile experience.',
    category: 'Technical',
    icon: <Video size={20} />
  },
  {
    id: '6',
    question: 'How many people can join a video call?',
    answer: 'Our free tier supports 1-on-1 video calls. Premium users can host group calls with up to 10 participants. We\'re continuously working to increase these limits and add new features based on user feedback.',
    category: 'Features',
    icon: <Users size={20} />
  },
  {
    id: '7',
    question: 'What are the system requirements for NexChat?',
    answer: 'NexChat works on any modern device with a web browser and internet connection. For the best experience, we recommend: Chrome 80+, Firefox 75+, Safari 13+, or Edge 80+. You\'ll also need a webcam and microphone for video calls, and a stable internet connection (minimum 1 Mbps for video calls).',
    category: 'Technical',
    icon: <Globe size={20} />
  },
  {
    id: '8',
    question: 'How does NexChat handle my data and privacy?',
    answer: 'We take privacy seriously. We only collect the minimum data necessary to provide our service. Your messages and video calls are encrypted and not stored on our servers. We don\'t sell your data to third parties. For complete details, please review our Privacy Policy.',
    category: 'Privacy',
    icon: <Shield size={20} />
  },
  {
    id: '9',
    question: 'Can I delete my account and data?',
    answer: 'Yes, you have full control over your account. You can delete your account at any time from your account settings. Upon deletion, all your personal data, messages, and account information will be permanently removed from our systems within 30 days.',
    category: 'Privacy',
    icon: <Shield size={20} />
  },
  {
    id: '10',
    question: 'What should I do if I experience connection issues?',
    answer: 'If you\'re experiencing connection problems, try these steps: 1) Check your internet connection, 2) Refresh the page, 3) Clear your browser cache, 4) Disable VPN or proxy, 5) Make sure your browser allows camera/microphone access. If issues persist, contact our support team.',
    category: 'Troubleshooting',
    icon: <HelpCircle size={20} />
  },
  {
    id: '11',
    question: 'Does NexChat work in all countries?',
    answer: 'NexChat is available globally, but some features may be restricted in certain regions due to local regulations or network limitations. WebRTC technology may be blocked in some countries or corporate networks. We\'re working to expand availability worldwide.',
    category: 'General',
    icon: <Globe size={20} />
  },
  {
    id: '12',
    question: 'How can I report bugs or request features?',
    answer: 'We love hearing from our users! You can report bugs or request new features through our in-app feedback form, by emailing support@nexchat.com, or by visiting our GitHub repository. We review all feedback and prioritize features based on user demand.',
    category: 'Support',
    icon: <Mail size={20} />
  }
];

const categories = ['All', 'General', 'Pricing', 'Security', 'Technical', 'Features', 'Privacy', 'Troubleshooting', 'Support'];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
                <HelpCircle size={16} />
              </div>
              <span className="text-lg font-bold text-slate-900">FAQs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-500 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <HelpCircle size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-emerald-50 text-lg max-w-2xl mx-auto">
            Find answers to common questions about NexChat, our features, and how to get the most out of your communication experience.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <HelpCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {filteredFAQs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
            <HelpCircle className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
            <p className="text-slate-600">
              Try adjusting your search terms or browse different categories.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQs.map(faq => (
              <div key={faq.id} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                      {faq.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 pr-4">{faq.question}</h3>
                      <span className="inline-block mt-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                        {faq.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {expandedItems.has(faq.id) ? (
                      <ChevronUp className="text-slate-400" size={20} />
                    ) : (
                      <ChevronDown className="text-slate-400" size={20} />
                    )}
                  </div>
                </button>
                {expandedItems.has(faq.id) && (
                  <div className="px-6 pb-4 border-t border-slate-100">
                    <div className="pt-4 pl-13">
                      <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-emerald-50 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="mailto:support@nexchat.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              <Mail size={20} />
              Email Support
            </Link>
            <Link
              href="/legal/user-agreement"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-800 transition-colors"
            >
              <MessageSquare size={20} />
              Live Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
