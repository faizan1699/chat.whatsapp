'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, Video, Shield, Zap, Globe, Github, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
              <MessageSquare size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">NexChat</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600">Features</a>
            <a href="#about" className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600">About</a>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
            >
              Start Chatting
            </Link>
          </div>
          <button className="rounded-full p-2 text-slate-600 hover:bg-slate-100 md:hidden">
            <svg viewBox="0 0 24 24" height="24" width="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen overflow-auto pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-emerald-50/50 blur-3xl"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              New: High Definition Video Calls
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl lg:leading-[1.1]">
              Connect with anyone, <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">anywhere in real-time.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              NexChat is a premium WebRTC messaging platform designed for speed, security, and simplicity. Experience crystal-clear calls and instant messaging in a beautiful interface.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/chat"
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-emerald-300 active:scale-95 sm:w-auto"
              >
                Launch Application
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="flex w-full items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-bold text-slate-700 shadow-lg shadow-slate-100 ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95 sm:w-auto"
              >
                Explore Features
              </a>
            </div>

            {/* App Preview Mockup */}
            <div className="mt-20 flex justify-center">
              <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&q=80&w=2000"
                  alt="App Screenshot"
                  className="rounded-xl"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 backdrop-blur-[2px] opacity-0 transition-opacity hover:opacity-100">
                  <Link href="/chat" className="rounded-full bg-white px-6 py-3 font-bold text-slate-900 shadow-xl transition-all hover:scale-110">View Live Demo</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="text-base font-bold uppercase tracking-widest text-emerald-600">Built for Quality</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Everything you need for seamless communication</p>
          </div>

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-50 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-100">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                <Video size={32} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">HD Video Calls</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Peer-to-peer High Definition video calling powered by WebRTC. Zero lag, crystal clear quality, and optimized for low bandwidth.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-50 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-100">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                <Zap size={32} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">Real-time Messaging</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Experience sub-millisecond message delivery. Our WebSocket implementation ensures your conversations stay perfectly synchronized.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-50 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-100">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                <Shield size={32} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">End-to-End Secure</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Your privacy is our priority. All media and messages are encrypted, ensuring that only you and the recipient can see your content.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-50 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-100">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                <Globe size={32} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">Built for Web</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                No installations required. NexChat runs directly in your browser on desktop, tablet, or smartphone without any plugins.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-50 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-100">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 transition-colors group-hover:bg-rose-500 group-hover:text-white">
                <Github size={32} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">Open Technology</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Built with modern stacks like Next.js, Socket.io and Tailwind CSS. Modular code architecture designed for scale and performance.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-50 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-100">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                <MessageSquare size={32} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">Interactive UI</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                A premium interface inspired by the best chat apps. Enjoy features like resizable sidebars, emoji support, and delivery statuses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <MessageSquare size={18} />
              </div>
              <span className="text-lg font-bold text-slate-900">NexChat</span>
            </div>
            <p className="text-sm text-slate-500">© 2024 NexChat App. All rights reserved by faizan169.</p>
            <div className="flex gap-6">
              <button className="text-slate-400 hover:text-emerald-500"><Github size={20} /></button>
              <button className="text-slate-400 hover:text-emerald-500">
                <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
