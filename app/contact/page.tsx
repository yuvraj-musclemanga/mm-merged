'use client';

import React, { useState } from 'react';
import { H1, Label } from '@/components/ui/Typography';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', query: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      setStatus('success');
      setForm({ name: '', phone: '', email: '', query: '' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send. Please try again.');
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1600px] mx-auto">
      <div className="max-w-3xl mx-auto border border-white/10 p-8 md:p-16 bg-card-dark relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

        <Label className="mb-6 block text-center">Get in Touch</Label>
        <H1 className="text-4xl md:text-6xl mb-4 text-center">Contact Us</H1>
        <p className="text-white/50 text-center mb-12 text-sm max-w-xl mx-auto leading-relaxed">
          Have a question about an order, a drop, or just want to connect? Fill out the form below and our team will get back to you within 24-48 hours.
        </p>

        {/* Success State */}
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-6 py-12 text-center">
            <span className="material-symbols-outlined text-5xl text-green-400">check_circle</span>
            <div>
              <p className="text-lg font-black uppercase tracking-[0.2em] mb-2">Message Sent!</p>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm">
                We've received your message and will get back to you within 24–48 hours. Check your inbox for a confirmation email.
              </p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="border border-white/30 px-8 py-3 text-xs font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
            >
              Send Another
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Banner */}
            {status === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500 text-red-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                ⚠ {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="contact-name"
                label="Full Name"
                name="name"
                placeholder="YOUR NAME"
                value={form.name}
                onChange={handleChange}
                required
                disabled={status === 'loading'}
              />
              <Input
                id="contact-phone"
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="YOUR PHONE"
                value={form.phone}
                onChange={handleChange}
                disabled={status === 'loading'}
              />
            </div>

            <Input
              id="contact-email"
              label="Email Address"
              name="email"
              type="email"
              placeholder="YOUR EMAIL"
              value={form.email}
              onChange={handleChange}
              required
              disabled={status === 'loading'}
            />

            <Textarea
              id="contact-query"
              label="Your Query"
              name="query"
              placeholder="HOW CAN WE HELP YOU?"
              rows={5}
              value={form.query}
              onChange={handleChange}
              required
              disabled={status === 'loading'}
            />

            <div className="pt-8 flex justify-center">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full md:w-auto px-12 py-4 border border-white hover:bg-white hover:text-black font-black uppercase tracking-[0.2em] transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {status === 'loading' ? (
                  <>
                    <span className="animate-spin inline-block size-4 border-2 border-current border-t-transparent rounded-full"></span>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
