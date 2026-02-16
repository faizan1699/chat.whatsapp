'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Lock, Users, Database, AlertTriangle, Mail, Phone, Check } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
                <Shield size={16} />
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
              <Shield size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-emerald-50 text-lg max-w-2xl mx-auto">
            Your privacy is our priority. Learn how we protect and handle your personal information.
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
                <Shield size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
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
                  NexChat Inc. ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our WebRTC communication platform.
                </p>
                <p className="text-slate-600 leading-relaxed mt-3">
                  This policy applies to all users of NexChat, including free and paid users. By using our Service, you agree to the collection and use of information in accordance with this policy.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Users className="text-emerald-600 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Personal Information</h3>
                      <ul className="text-slate-600 text-sm space-y-1">
                        <li>• Email address and username</li>
                        <li>• Profile picture (optional)</li>
                        <li>• Display name</li>
                        <li>• Account preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Database className="text-emerald-600 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Communication Content</h3>
                      <ul className="text-slate-600 text-sm space-y-1">
                        <li>• Text messages (encrypted end-to-end)</li>
                        <li>• Video and audio call data</li>
                        <li>• File attachments (encrypted)</li>
                        <li>• Contact lists (with consent)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Eye className="text-emerald-600 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Usage Information</h3>
                      <ul className="text-slate-600 text-sm space-y-1">
                        <li>• App usage patterns</li>
                        <li>• Feature interactions</li>
                        <li>• Connection quality metrics</li>
                        <li>• Device information</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Check className="text-emerald-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Service Provision</h3>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Enable messaging, video calls, and core features
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Check className="text-emerald-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Security</h3>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Protect accounts and prevent unauthorized access
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Check className="text-emerald-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Improvement</h3>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Enhance user experience and add new features
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Check className="text-emerald-600" size={20} />
                    <h3 className="font-semibold text-slate-900">Communication</h3>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Send important updates and support messages
                  </p>
                </div>
              </div>
            </section>

            {/* Data Protection */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Protection & Security</h2>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Lock className="text-emerald-600 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-emerald-900 mb-3">Our Security Commitment</h3>
                    <ul className="text-emerald-800 text-sm space-y-2">
                      <li>• <strong>End-to-end encryption</strong> for all messages and calls</li>
                      <li>• <strong>AES-256 encryption</strong> for stored data</li>
                      <li>• <strong>Regular security audits</strong> and penetration testing</li>
                      <li>• <strong>Secure data centers</strong> with 24/7 monitoring</li>
                      <li>• <strong>Zero-knowledge architecture</strong> for sensitive communications</li>
                      <li>• <strong>Compliance</strong> with GDPR, CCPA, and other privacy laws</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Information Sharing</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  We do not sell, rent, or trade your personal information. We only share data in these limited circumstances:
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-2">When We May Share Information</h3>
                      <ul className="text-amber-800 text-sm space-y-1">
                        <li>• <strong>With your consent</strong> - When you explicitly authorize sharing</li>
                        <li>• <strong>Legal requirements</strong> - To comply with laws, regulations, or court orders</li>
                        <li>• <strong>Safety & security</strong> - To protect rights, property, or safety</li>
                        <li>• <strong>Service providers</strong> - With trusted partners under strict confidentiality agreements</li>
                        <li>• <strong>Business transfers</strong> - In case of merger, acquisition, or asset sale</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Privacy Rights</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Right to Access</h3>
                    <p className="text-slate-600 text-sm">
                      Request a copy of your personal data and understand how it's used.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <Database size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Right to Portability</h3>
                    <p className="text-slate-600 text-sm">
                      Obtain your data in a machine-readable format for transfer to other services.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Right to Erasure</h3>
                    <p className="text-slate-600 text-sm">
                      Request deletion of your personal data when no longer necessary.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Right to Object</h3>
                    <p className="text-slate-600 text-sm">
                      Object to processing of your data for certain purposes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Data Retention</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law.
                </p>
                <div className="bg-slate-50 rounded-lg p-4 mt-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Typical Retention Periods</h3>
                  <ul className="text-slate-600 text-sm space-y-1">
                    <li>• Messages: 30 days (unless saved by user)</li>
                    <li>• Account data: Until account deletion</li>
                    <li>• Analytics: 12 months</li>
                    <li>• Legal records: As required by law</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Children's Privacy</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  NexChat is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    Parents or guardians who believe their child has provided personal information to NexChat should contact us immediately at privacy@nexchat.com.
                  </p>
                </div>
              </div>
            </section>

            {/* International Users */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. International Data Transfers</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  NexChat operates globally and may transfer your data to countries other than your own. We ensure adequate protection through:
                </p>
                <ul className="text-slate-600 text-sm mt-3 space-y-1">
                  <li>• Standard Contractual Clauses (SCCs)</li>
                  <li>• EU-US Privacy Shield Framework</li>
                  <li>• Binding Corporate Rules (BCRs)</li>
                  <li>• Compliance with local data protection laws</li>
                </ul>
              </div>
            </section>

            {/* Policy Updates */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Changes to This Policy</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  We may update this Privacy Policy from time to time. When we make changes, we will:
                </p>
                <ul className="text-slate-600 text-sm mt-3 space-y-1">
                  <li>• Update the "Last updated" date at the top</li>
                  <li>• Notify users via email or in-app notification</li>
                  <li>• Post a notice on our website</li>
                  <li>• Obtain consent where required by law</li>
                </ul>
                <p className="text-slate-600 leading-relaxed mt-3">
                  Your continued use of NexChat after any changes constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Contact Us</h2>
              <div className="bg-slate-50 rounded-lg p-6">
                <p className="text-slate-600 mb-4">
                  If you have questions about this Privacy Policy or want to exercise your privacy rights, please contact our Data Protection Officer:
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
                  <div className="flex items-center gap-3">
                    <Shield className="text-emerald-600" size={20} />
                    <span className="text-slate-700">NexChat Inc. Privacy Team</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            This Privacy Policy is part of our legal framework. Please also review our:
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/legal/user-agreement" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              User Agreement
            </Link>
            <span className="text-slate-400">•</span>
            <Link href="/legal/data-usage" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              Data Usage Policy
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
