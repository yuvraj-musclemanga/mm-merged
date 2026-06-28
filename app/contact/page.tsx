import React from 'react';
import { H1, Label } from '@/components/ui/Typography';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export const metadata = {
  title: 'Contact Us | Musclemanga',
  description: 'Get in touch with us.',
};

export default function ContactPage() {
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

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Full Name" 
              name="name"
              placeholder="YOUR NAME" 
              required 
            />
            <Input 
              label="Phone Number" 
              name="phone"
              type="tel"
              placeholder="YOUR PHONE" 
              required 
            />
          </div>
          
          <Input 
            label="Email Address" 
            name="email"
            type="email"
            placeholder="YOUR EMAIL" 
            required 
          />

          <Textarea 
            label="Your Query" 
            name="query"
            placeholder="HOW CAN WE HELP YOU?" 
            rows={5}
            required 
          />

          <div className="pt-8 flex justify-center">
             <button type="submit" className="w-full md:w-auto px-12 py-4 border border-white hover:bg-white hover:text-black font-black uppercase tracking-[0.2em] transition-all text-xs">
                Send Message
             </button>
          </div>
        </form>
      </div>
    </main>
  );
}
