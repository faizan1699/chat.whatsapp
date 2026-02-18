'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Database, Shield, Activity, Clock, Download, Upload, Server, Smartphone, Globe, Users, MessageSquare, Mail, Phone } from 'lucide-react';

export default function DataUsagePage() {
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
                <Database size={16} />
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
              <Database size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Data Usage Policy
          </h1>
          <p className="text-emerald-50 text-lg max-w-2xl mx-auto">
            Transparent information about how we collect, use, and protect your data on NexChat.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-8 py-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Database size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Data Usage Policy</h1>
            </div>
            <p className="text-emerald-50 text-lg max-w-2xl">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Document Content */}
          <div className="px-8 py-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  At NexChat, we are committed to transparency about how we handle your data. This Data Usage Policy explains what information we collect, how we use it, and what measures we take to protect your privacy.
                </p>
                <p className="text-slate-600 leading-relaxed mt-3">
                  Our approach is built on the principle of data minimization - we only collect and process data that is essential for providing our communication services.
                </p>
              </div>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Data We Collect</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Account Information</h3>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• Email address and username</li>
                      <li>• Profile information (optional)</li>
                      <li>• Authentication tokens</li>
                      <li>• Account creation timestamp</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Communication Data</h3>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• Message content (encrypted)</li>
                      <li>• Message metadata (timestamp, sender/receiver)</li>
                      <li>• Call duration and participant information</li>
                      <li>• File attachments (encrypted)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 flex-shrink-0">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Usage Analytics</h3>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• App usage statistics (aggregated)</li>
                      <li>• Feature usage patterns</li>
                      <li>• Performance metrics</li>
                      <li>• Error reports and crash data</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 flex-shrink-0">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Technical Data</h3>
                    <ul className="text-slate-600 text-sm space-y-1">
                      <li>• IP address (for connection routing)</li>
                      <li>• Device and browser information</li>
                      <li>• Connection quality metrics</li>
                      <li>• Network performance data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Storage */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Data Storage & Retention</h2>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Server className="text-emerald-600 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Storage Locations</h3>
                      <p className="text-slate-600 text-sm">
                        Your data is stored in secure, SOC 2 certified data centers. We use geographic redundancy to ensure data availability and disaster recovery.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Clock className="text-emerald-600 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Retention Periods</h3>
                      <ul className="text-slate-600 text-sm space-y-1">
                        <li>• Messages: 30 days (unless saved by user)</li>
                        <li>• Call metadata: 90 days</li>
                        <li>• Analytics data: 12 months</li>
                        <li>• Account data: Until account deletion</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Usage */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. How We Use Your Data</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="text-emerald-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Service Delivery</h3>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Enable real-time messaging, video calls, and core functionality
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="text-emerald-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Service Improvement</h3>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Analyze usage patterns to enhance user experience
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="text-emerald-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Network Optimization</h3>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Optimize connection routing and call quality
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="text-emerald-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Security</h3>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Detect and prevent fraud, abuse, and security threats
                  </p>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Security Measures</h2>
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Shield className="text-emerald-600 mt-1" size={24} />
                    <div>
                      <h3 className="font-semibold text-emerald-900 mb-3">Encryption & Protection</h3>
                      <ul className="text-emerald-800 text-sm space-y-2">
                        <li>• <strong>End-to-end encryption</strong> for all messages and video calls</li>
                        <li>• <strong>AES-256 encryption</strong> for data at rest</li>
                        <li>• <strong>TLS 1.3</strong> for data in transit</li>
                        <li>• <strong>Zero-knowledge architecture</strong> for sensitive data</li>
                        <li>• <strong>Regular security audits</strong> and penetration testing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Data Sharing</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  We do not sell your personal data to third parties. We only share data in limited circumstances:
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <ul className="text-amber-800 text-sm space-y-1">
                    <li>• With your explicit consent</li>
                    <li>• To comply with legal obligations</li>
                    <li>• To protect our rights and prevent fraud</li>
                    <li>• With trusted service providers under strict contracts</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Your Data Rights</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <Download size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Data Portability</h3>
                    <p className="text-slate-600 text-sm">
                      You can request a copy of your data at any time through your account settings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Data Deletion</h3>
                    <p className="text-slate-600 text-sm">
                      You have the right to delete your account and all associated data permanently.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Access & Correction</h3>
                    <p className="text-slate-600 text-sm">
                      You can review and update your personal information at any time.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* International Data Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. International Data Transfers</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  NexChat operates globally and may transfer data across borders. We ensure all international transfers comply with applicable data protection laws through:
                </p>
                <ul className="text-slate-600 text-sm mt-3 space-y-1">
                  <li>• Standard Contractual Clauses (SCCs)</li>
                  <li>• Adequacy decisions where applicable</li>
                  <li>• Binding Corporate Rules (BCRs)</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Contact Information</h2>
              <div className="bg-slate-50 rounded-lg p-6">
                <p className="text-slate-600 mb-4">
                  If you have questions about this Data Usage Policy or want to exercise your data rights, please contact us:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="text-emerald-600" size={20} />
                    <span className="text-slate-700">privacy@nexchat.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-emerald-600" size={20} />
                    <span className="text-slate-700">+1 (555) 123-4567</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            This Data Usage Policy is part of our legal framework. Please also review our:
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/legal/privacy-policy" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              Privacy Policy
            </Link>
            <span className="text-slate-400">•</span>
            <Link href="/legal/user-agreement" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              User Agreement
            </Link>
            <span className="text-slate-400">•</span>
            <Link href="/faq" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              FAQs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
