"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ChatWidget() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Check if chatbot is enabled
    useEffect(() => {
        async function checkConfig() {
            try {
                const res = await fetch('/api/chat/config');
                const data = await res.json();
                if (data.success && data.isEnabled) {
                    setIsEnabled(true);
                    setWelcomeMessage(data.welcomeMessage || 'Hi! How can I help you today?');
                }
            } catch {
                // Silently fail — chatbot just won't show
            }
        }
        checkConfig();
    }, []);

    // Add welcome message when chat opens for the first time
    useEffect(() => {
        if (isOpen && messages.length === 0 && welcomeMessage) {
            setMessages([{ role: 'model', text: welcomeMessage }]);
        }
    }, [isOpen, welcomeMessage, messages.length]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    async function handleSend() {
        const text = input.trim();
        if (!text || isLoading) return;

        setInput('');

        const userMsg = { role: 'user', text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Build history for API (exclude welcome message, cap at 10)
            const history = newMessages
                .filter((m, i) => !(i === 0 && m.role === 'model'))
                .slice(-10)
                .map(m => ({ role: m.role, text: m.text }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history }),
            });

            const data = await res.json();

            if (data.success) {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'model',
                        text: data.reply,
                        products: data.products || [],
                    },
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'model',
                        text: data.message || 'Sorry, something went wrong. Please try again.',
                    },
                ]);
            }
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    role: 'model',
                    text: 'Unable to connect. Please check your internet and try again.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    if (!isEnabled) return null;

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
                    aria-label="Open chat"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] h-[100dvh] sm:h-[560px] flex flex-col bg-background border border-border sm:rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <span className="font-semibold text-sm">Chat with us</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                            aria-label="Close chat"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i}>
                                {msg.role === 'user' ? (
                                    <div className="flex justify-end">
                                        <div className="max-w-[80%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">
                                            {msg.text}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <Bot className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="max-w-[85%]">
                                            <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-foreground whitespace-pre-wrap">
                                                {msg.text}
                                            </div>
                                            {/* Product Cards */}
                                            {msg.products?.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    {msg.products.map((product) => (
                                                        <ProductCard key={product.id} product={product} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="flex gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-primary" />
                                </div>
                                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Bar */}
                    <div className="shrink-0 border-t border-border p-3">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                rows={1}
                                className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary max-h-24"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                aria-label="Send message"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function ProductCard({ product }) {
    return (
        <Link
            href={`/products/${product.id}`}
            className="flex gap-3 p-2.5 bg-background border border-border rounded-xl hover:border-primary/40 transition-colors group"
        >
            {product.image && (
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <Image
                        src={product.image}
                        alt={product.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {product.name}
                </p>
                {product.category && (
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                )}
                <p className="text-sm font-semibold text-primary mt-0.5">
                    ₹{product.price?.toLocaleString('en-IN')}
                </p>
            </div>
        </Link>
    );
}
