"use client";
import React from 'react';
import { Accordion } from '@/components/ui/Accordion';

export default function PrivacyPage() {
    const sections = [
        {
            id: "01",
            title: "1. Introduction",
            content: (
                <>
                    <p>
                        At Musclemanga, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and purchase our products.
                    </p>
                    <p>
                        By using our services, you agree to the collection and use of information in accordance with this policy. We may update this policy from time to time, so please check back regularly.
                    </p>
                </>
            ),
        },
        {
            id: "02",
            title: "2. Information We Collect",
            content: (
                <>
                    <p>
                        We collect several types of information to provide and improve our service to you:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Personal Data:</strong> Name, email address, phone number, and shipping/billing address when you make a purchase or create an account.</li>
                        <li><strong>Payment Information:</strong> We do not store your full credit card details. Payment processing is handled by secure third-party providers.</li>
                        <li><strong>Usage Data:</strong> Information on how you access and use our website, including your IP address, browser type, and pages visited.</li>
                    </ul>
                </>
            ),
        },
        {
            id: "03",
            title: "3. How We Use Your Information",
            content: (
                <>
                    <p>
                        We use the collected data for various purposes:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>To process and deliver your orders.</li>
                        <li>To provide customer support and respond to your inquiries.</li>
                        <li>To notify you about changes to our services or upcoming drops (if you&apos;ve opted in).</li>
                        <li>To monitor and analyze usage patterns to improve our website experience.</li>
                    </ul>
                </>
            ),
        },
        {
            id: "04",
            title: "4. Cookies & Tracking",
            content: (
                <>
                    <p>
                        We use cookies and similar tracking technologies to track activity on our service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
                    </p>
                    <p>
                        You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
                    </p>
                </>
            ),
        },
        {
            id: "05",
            title: "5. Third-Party Services",
            content: (
                <>
                    <p>
                        We may employ third-party companies and individuals to facilitate our service (e.g., payment processors, shipping carriers, analytics providers). These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                    </p>
                </>
            ),
        },
        {
            id: "06",
            title: "6. Data Security",
            content: (
                <>
                    <p>
                        The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                    </p>
                </>
            ),
        },
        {
            id: "07",
            title: "7. Your Rights",
            content: (
                <>
                    <p>
                        Depending on your location, you may have certain rights regarding your personal data, including the right to access, correct, or delete the information we hold about you. If you wish to exercise these rights, please contact us.
                    </p>
                </>
            ),
        },
        {
            id: "08",
            title: "8. Contact Us",
            content: (
                <>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at support@musclemanga.com.
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
                        PRIVACY
                        <span className="block text-outline">POLICY</span>
                    </h1>
                    <p className="mt-8 font-inter text-xs uppercase tracking-widest text-white/40">
                        LAST UPDATED: MARCH 6, 2026
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
