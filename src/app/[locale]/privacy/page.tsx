'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code2 } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
    const t = useTranslations('marketing');
    const common = useTranslations('common');

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="px-6 lg:px-10 h-16 flex items-center border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-50">
                <Link className="flex items-center justify-center gap-2 group" href="/">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Code2 className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">dao123</span>
                </Link>
            </header>

            <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
                <Button variant="ghost" asChild className="mb-8 pl-0 hover:bg-transparent hover:text-primary">
                    <Link href="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        {common('home')}
                    </Link>
                </Button>

                <h1 className="text-4xl font-bold mb-8">{t('footer.privacy')}</h1>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Welcome to dao123. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you as to how we look after your personal data when you visit our website
                            and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data</strong> includes email address and telephone number.</li>
                            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                            <li>Where we need to comply with a legal or regulatory obligation.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us through our support channels.
                        </p>
                    </section>
                </div>
            </main>

            <footer className="py-8 border-t border-border/40 bg-background text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} alexlee2046. All rights reserved.</p>
            </footer>
        </div>
    );
}
