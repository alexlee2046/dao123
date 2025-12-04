'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code2 } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function TermsPage() {
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

                <h1 className="text-4xl font-bold mb-8">{t('footer.terms')}</h1>
                
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
                    
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing our website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations. 
                            If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>
                    
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Permission is granted to temporarily download one copy of the materials (information or software) on dao123's website for personal, 
                            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li>modify or copy the materials;</li>
                            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                            <li>attempt to decompile or reverse engineer any software contained on dao123's website;</li>
                            <li>remove any copyright or other proprietary notations from the materials; or</li>
                            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                        </ul>
                    </section>
                    
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The materials on dao123's website are provided on an 'as is' basis. dao123 makes no warranties, expressed or implied, 
                            and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, 
                            fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>
                    
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            In no event shall dao123 or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, 
                            or due to business interruption) arising out of the use or inability to use the materials on dao123's website, 
                            even if dao123 or a dao123 authorized representative has been notified orally or in writing of the possibility of such damage.
                        </p>
                    </section>
                    
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">5. Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction 
                            of the courts in that location.
                        </p>
                    </section>
                </div>
            </main>
            
            <footer className="py-8 border-t border-border/40 bg-background text-center text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} dao123 Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
