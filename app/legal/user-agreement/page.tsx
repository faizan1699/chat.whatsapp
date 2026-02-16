'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Shield, Users, AlertTriangle, Mail, Phone } from 'lucide-react';

export default function UserAgreementPage() {
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
                <FileText size={16} />
              </div>
              <span className="text-lg font-bold text-slate-900">NexChat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-8 py-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <FileText size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">User Agreement</h1>
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
                  Welcome to NexChat ("the Service"). This User Agreement ("Agreement") is a legally binding contract between you ("User") and NexChat Inc. ("we," "us," or "our") that governs your use of our WebRTC-based communication platform.
                </p>
                <p className="text-slate-600 leading-relaxed mt-3">
                  By accessing or using NexChat, you agree to be bound by this Agreement, our Privacy Policy, and all applicable laws and regulations. If you do not agree to these terms, you may not access or use our Service.
                </p>
              </div>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Acceptance of Terms</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  By creating an account, accessing our Service, or otherwise using NexChat, you acknowledge that you have read, understood, and agree to be bound by this Agreement.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-amber-900">Important Notice</p>
                      <p className="text-amber-800 text-sm mt-1">
                        If you are using the Service on behalf of a company or organization, you represent and warrant that you have the authority to bind that entity to this Agreement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Responsibilities</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="text-emerald-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-slate-900">Account Security</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="text-emerald-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-slate-900">Acceptable Use</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      You agree to use NexChat only for lawful purposes and in accordance with this Agreement. You shall not:
                    </p>
                    <ul className="list-disc list-inside text-slate-600 text-sm mt-2 space-y-1">
                      <li>Send unsolicited or unauthorized advertising</li>
                      <li>Harass, abuse, or threaten other users</li>
                      <li>Share illegal, harmful, or inappropriate content</li>
                      <li>Attempt to gain unauthorized access to our systems</li>
                      <li>Interfere with or disrupt the Service</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Privacy and Data Protection */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Privacy and Data Protection</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into this Agreement by reference.
                </p>
                <p className="text-slate-600 leading-relaxed mt-3">
                  By using NexChat, you consent to the collection, use, and sharing of your information as described in our Privacy Policy. We implement appropriate technical and organizational measures to protect your personal data.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Intellectual Property</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of NexChat Inc. and its licensors. The Service is protected by copyright, trademark, and other laws.
                </p>
                <p className="text-slate-600 leading-relaxed mt-3">
                  You retain ownership of any content you create, share, or transmit through the Service. By using NexChat, you grant us a license to use, reproduce, and distribute your content solely for the purpose of providing the Service.
                </p>
              </div>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Service Availability</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  We strive to maintain high availability of the Service, but we do not guarantee uninterrupted access. NexChat may be temporarily unavailable for maintenance, updates, or other reasons beyond our control.
                </p>
                <p className="text-slate-600 leading-relaxed mt-3">
                  We reserve the right to modify, suspend, or discontinue the Service at any time without prior notice.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Limitation of Liability</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  To the maximum extent permitted by law, NexChat shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the Service.
                </p>
                <p className="text-slate-600 leading-relaxed mt-3">
                  Our total liability to you for all claims arising from this Agreement shall not exceed the amount you paid for the Service, if any, during the twelve (12) months preceding the claim.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Termination</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Agreement.
                </p>
                <p className="text-slate-600 leading-relaxed mt-3">
                  You may also terminate your account at any time through your account settings or by contacting our support team.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Contact Information</h2>
              <div className="bg-slate-50 rounded-lg p-6">
                <p className="text-slate-600 mb-4">
                  If you have any questions about this User Agreement, please contact us:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="text-emerald-600" size={20} />
                    <span className="text-slate-700">legal@nexchat.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-emerald-600" size={20} />
                    <span className="text-slate-700">+1 (555) 123-4567</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Agreement Changes */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Changes to This Agreement</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  We reserve the right to modify this Agreement at any time. When we make changes, we will update the "Last updated" date at the top of this page and notify you via email or through the Service.
                </p>
                <p className="text-slate-600 leading-relaxed mt-3">
                  Your continued use of the Service after any modifications constitutes acceptance of the updated Agreement.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            This Agreement is part of our legal framework. Please also review our:
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/legal/privacy-policy" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              Privacy Policy
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
