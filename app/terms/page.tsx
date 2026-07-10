"use client";
import React from 'react'
import { Accordion } from '@/components/ui/Accordion';

export default function TermsPage() {
    const sections = [
        {
            id: "01",
            title: "1. Introduction",
            content: (
                <>
                    <p>
                        Welcome to Musclemanga. By accessing or using our website, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any part of these terms, please do not use our website.
                    </p>
                    <p>
                        These Terms apply to all visitors, users, and others who wish to access or use the Service. We reserve the right to modify these terms at any time, so please review them frequently.
                    </p>
                </>
            ),
        },
        {
            id: "02",
            title: "2. Use of Website",
            content: (
                <>
                    <p>
                        You agree to use this website only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else&apos;s use and enjoyment of the website. Prohibited behavior includes harassing or causing distress or inconvenience to any other user, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within our website.
                    </p>
                    <p>
                        We reserve the right to terminate your use of the Service or any related website for violating any of the prohibited uses.
                    </p>
                </>
            ),
        },
        {
            id: "03",
            title: "3. Products & Orders",
            content: (
                <>
                    <p>
                        All products are subject to availability. We reserve the right to discontinue any product at any time. Prices for our products are subject to change without notice. We shall not be liable to you or to any third-party for any modification, price change, suspension, or discontinuance of the Service.
                    </p>
                    <p>
                        We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order.
                    </p>
                </>
            ),
        },
        {
            id: "04",
            title: "4. Shipping & Returns",
            content: (
                <>
                    <p>
                        We offer Pan India shipping, with deliveries typically arriving within 7-10 business days. Orders are processed and dispatched within 48 hours of placement. All orders are shipped and tracked via premium courier partners.
                    </p>
                    <p>
                        As part of our commitment to exclusivity and quality control, we do not offer returns. Size exchanges are permitted, subject to stock availability. Requests for exchanges must be raised within 24 hours of delivery.
                    </p>
                </>
            ),
        },
        {
            id: "05",
            title: "5. Intellectual Property",
            content: (
                <>
                    <p>
                        The Service and its original content, features, and functionality are and will remain the exclusive property of Musclemanga and its licensors. The Service is protected by copyright, trademark, and other laws of both the United Kingdom and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Musclemanga.
                    </p>
                </>
            ),
        },
        {
            id: "06",
            title: "6. Limitation of Liability",
            content: (
                <>
                    <p>
                        In no event shall Musclemanga, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.
                    </p>
                </>
            ),
        },
        {
            id: "07",
            title: "7. Contact Information",
            content: (
                <>
                    <p>
                        Questions about the Terms and Conditions should be sent to us at support@musclemanga.in.
                    </p>
                </>
            ),
        },
    ];

    return (
        <main className="min-h-screen bg-background-dark pt-32 pb-24">
            <div className="container mx-auto px-4 md:px-8">
                {/* Header Section */}
                <div className="mb-16 border-b border-white/10 pb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px w-12 bg-white/30" />
                        <span className="font-syncopate text-xs uppercase tracking-widest text-white/50">LEGAL</span>
                    </div>
                    <h1 className="font-syncopate text-5xl font-bold uppercase leading-tight tracking-tighter md:text-7xl lg:text-8xl">
                        TERMS AND
                        <span className="block text-outline">CONDITIONS</span>
                    </h1>
                    <p className="mt-8 font-inter text-xs uppercase tracking-widest text-white/40">
                        LAST UPDATED: OCTOBER 24, 2024
                    </p>
                </div>

                <div className="flex flex-col gap-12 lg:flex-row lg:gap-24">
                    {/* Table of Contents Sidebar */}
                    <aside className="lg:w-1/4">
                        <div className="sticky top-32">
                            <h2 className="font-syncopate mb-8 text-xs font-bold uppercase tracking-widest">TABLE OF CONTENTS</h2>
                            <nav className="space-y-4">
                                {sections.map((section) => (
                                    <a
                                        key={section.id}
                                        href={`#section-${section.id}`}
                                        className="flex items-center gap-4 group"
                                    >
                                        <span className="font-syncopate text-[10px] text-white/30 group-hover:text-primary transition-colors">{section.id}</span>
                                        <span className="font-syncopate text-xs uppercase tracking-wider text-white/60 group-hover:text-white transition-colors">
                                            {section.title.split('. ')[1]}
                                        </span>
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content Sections */}
                    <div className="lg:w-3/4">
                        <div className="divide-y divide-white/10">
                            {sections.map((section) => (
                                <div key={section.id} id={`section-${section.id}`} className="scroll-mt-32">
                                    <Accordion title={section.title}>
                                        <div className="space-y-4">
                                            {section.content}
                                        </div>
                                    </Accordion>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </main>
    );
}
