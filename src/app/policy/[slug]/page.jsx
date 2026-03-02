"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PolicyPage({ params }) {
    const { slug } = use(params);
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function fetchPolicy() {
            try {
                const res = await fetch('/api/app-config');
                const data = await res.json();
                if (data.success && data.config?.legalPolicies) {
                    const found = data.config.legalPolicies.find(p => p.slug === slug);
                    if (found) {
                        setPolicy(found);
                    } else {
                        setNotFound(true);
                    }
                } else {
                    setNotFound(true);
                }
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        fetchPolicy();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
                <h1 className="text-2xl font-bold text-foreground">Policy Not Found</h1>
                <p className="text-muted-foreground">The policy you&apos;re looking for doesn&apos;t exist.</p>
                <Link href="/" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 lg:px-8 py-12 max-w-4xl">
                {/* Breadcrumb */}
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium inline-flex items-center gap-1 mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8">
                    {policy.title}
                </h1>

                {/* Policy Content (HTML from rich text editor) */}
                <div
                    className="policy-content text-muted-foreground leading-relaxed [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-relaxed [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1 [&_li]:leading-relaxed [&_strong]:text-foreground [&_strong]:font-semibold [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4 [&_th]:border [&_th]:border-border [&_th]:px-4 [&_th]:py-2 [&_th]:bg-muted [&_th]:text-foreground [&_th]:font-medium [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4"
                    dangerouslySetInnerHTML={{ __html: policy.content }}
                />
            </div>
        </div>
    );
}
