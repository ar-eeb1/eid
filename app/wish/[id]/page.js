"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Gift, MessageSquare, CheckCircle2, X, Loader2 } from "lucide-react";
import CrescentMoon from "@/components/CrescentMoon";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function ViewWish() {
    const params = useParams();
    const wishId = params.id;

    const [wishData, setWishData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");

    const [isUnlocked, setIsUnlocked] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!wishId) return;

        const fetchWish = async () => {
            try {
                const res = await fetch(`/api/wish/${wishId}`);
                if (!res.ok) {
                    throw new Error("Wish not found");
                }
                const data = await res.json();
                setWishData(data);

                // If the mode is simple, or if there's no password (edge case), auto-unlock
                if (data.mode === "simple" || !data.password) {
                    setIsUnlocked(true);
                }

                // Load existing state
                if (data.isClaimed) setIsClaimed(true);
                if (data.bankDetails && data.bankDetails.accountNumber) setIsWithdrawn(true);
            } catch (err) {
                console.error(err);
                setFetchError(err.message || "Failed to load wish");
            } finally {
                setLoading(false);
            }
        };

        fetchWish();
    }, [wishId]);

    useEffect(() => {
        if (!wishData) return;

        const receiver = wishData.receiverName?.toLowerCase();

        if (receiver) {
            document.title = `Eid Mubarak ${receiver}`;
        } else {
            document.title = wishData.title || "Secret Wish";
        }
    }, [wishId, wishData]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isClaimed, setIsClaimed] = useState(false);

    // Bank withdrawal state
    const [bankDetails, setBankDetails] = useState({ accountTitle: "", accountNumber: "", bankName: "" });
    const [isWithdrawn, setIsWithdrawn] = useState(false);

    const hasBankInfo = bankDetails.accountTitle && bankDetails.accountNumber && bankDetails.bankName;
    // Show Eidi immediately after game completion or if already withdrawn
    const showEidi = quizFinished || revealedAmount !== null || isClaimed || isWithdrawn || hasBankInfo;

    // Guess mode state
    const [shuffledGuessAmounts, setShuffledGuessAmounts] = useState([]);
    const [revealedAmount, setRevealedAmount] = useState(null);

    useEffect(() => {
        if (wishData?.mode === "guess" && wishData.guessAmounts) {
            // Shuffle amounts on every refresh/initial load
            const shuffled = [...wishData.guessAmounts].sort(() => Math.random() - 0.5);
            setShuffledGuessAmounts(shuffled);
        }

        // Recover selected amount if already claimed
        if (wishData?.mode === "guess" && (wishData.isClaimed || wishData.selectedAmount)) {
            setRevealedAmount(wishData.selectedAmount);
            setIsClaimed(true);
        }
    }, [wishData]);

    const handleUnlock = (e) => {
        e.preventDefault();
        if (password === wishData?.password) {
            setIsUnlocked(true);
            setError(false);
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    const handleOptionSelect = (index) => {
        if (selectedOption !== null) return; // Prevent changing answer
        setSelectedOption(index);

        setTimeout(async () => {
            let currentScore = score;
            if (index === wishData.questions[currentQuestionIndex].correctIndex) {
                currentScore += 1;
                setScore(currentScore);
            }

            if (currentQuestionIndex < wishData.questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setSelectedOption(null);
            } else {
                setQuizFinished(true);
                // Save score immediately on finish
                try {
                    await fetch(`/api/wish/${wishId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            isClaimed: true,
                            score: currentScore
                        })
                    });
                } catch (e) {
                    console.error("Error saving score on finish:", e);
                }
            }
        }, 800);
    };

    const calculateEidi = () => {
        if (!wishData) return 0;
        if (wishData.mode === "fixed") return wishData.amount;
        if (wishData.mode === "guess") return wishData.selectedAmount || revealedAmount || 0;
        if (wishData.mode === "challenge") {
            // Priority 1: From DB if already completed and score is saved
            if (wishData.isClaimed || wishData.score !== undefined) {
                const percentage = (wishData.score || score) * 25;
                return (wishData.amount * percentage) / 100;
            }
            // Priority 2: From active session score
            const percentage = score * 25; // Each question is 25%
            return (wishData.amount * percentage) / 100;
        }
        return 0;
    };

    const handleClaimEidi = async () => {
        setIsClaimed(true);
        if (!wishData) return;
        try {
            await fetch(`/api/wish/${wishId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isClaimed: true, score, selectedAmount: revealedAmount })
            });
        } catch (e) {
            console.error("Error saving claim:", e);
        }
    };

    const handleGuessReveal = async (amt) => {
        if (revealedAmount !== null) return;
        setRevealedAmount(amt);
        // Save revealed amount immediately
        try {
            await fetch(`/api/wish/${wishId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isClaimed: true,
                    selectedAmount: amt
                })
            });
        } catch (e) {
            console.error("Error saving guess reveal:", e);
        }
    };

    const handleWithdraw = async () => {
        setIsWithdrawn(true);
        if (!wishData) return;
        try {
            await fetch(`/api/wish/${wishId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isClaimed: true,
                    score,
                    selectedAmount: revealedAmount,
                    bankDetails
                })
            });
        } catch (e) {
            console.error("Error saving bank details:", e);
        }
    };

    return (
        <div className="min-h-screen bg-[#05110d] text-white selection:bg-emerald-500/30 overflow-hidden relative font-sans">
            {/* Background Ornaments */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-600/10 blur-[150px] rounded-full" />
                <CrescentMoon className="absolute top-12 right-12 w-32 h-32 text-emerald-500/5 rotate-12" />
            </div>

            <div className="container mx-auto px-4 py-8 md:py-16 max-w-2xl relative z-10 flex flex-col min-h-[90vh] justify-center">

                {loading && (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                        <p className="text-emerald-100/60 animate-pulse">Unwrapping wish...</p>
                    </div>
                )}

                {!loading && fetchError && (
                    <div className="text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8">
                        <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
                        <p className="text-rose-200/80">{fetchError}</p>
                    </div>
                )}

                {!loading && !fetchError && wishData && (
                    <AnimatePresence mode="wait">
                        {!isUnlocked ? (
                            <motion.div
                                key="lock-screen"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.5 }}
                                className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center max-w-md mx-auto w-full"
                            >
                                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 rotate-3">
                                    <Lock className="w-10 h-10" />
                                </div>

                                <h2 className="text-3xl font-bold mb-3">Secret Wish</h2>
                                <p className="text-emerald-100/60 mb-8">Someone sent you an Eid wish! Enter the password to unlock it.</p>

                                <form onSubmit={handleUnlock} className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className={`w-full bg-black/40 border rounded-2xl px-6 py-4 text-center text-lg placeholder-white/30 focus:outline-none transition-all ${error ? "border-rose-500/50 focus:ring-rose-500/50" : "border-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                                                }`}
                                        />
                                        {error && (
                                            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-6 left-0 right-0 text-rose-400 text-sm">
                                                Incorrect password. Try again!
                                            </motion.p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-medium py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 group mt-6"
                                    >
                                        Unlock Wish
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="wish-content"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="space-y-8"
                            >
                                {/* Hero Section */}
                                <div className="text-center space-y-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.5, delay: 0.5 }}
                                        className="inline-block"
                                    >
                                        <div className="relative">
                                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400/40 to-emerald-600/40 rounded-[2rem] rotate-12 mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                                <CrescentMoon className="w-12 h-12 text-white -rotate-12" />
                                            </div>
                                        </div>
                                    </motion.div>

                                    <div>
                                        <motion.h1
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                                            className="text-5xl md:text-6xl font-bold mb-4"
                                        >
                                            Eid Mubarak, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-300">{wishData.receiverName}!</span>
                                        </motion.h1>
                                        <h1 className="text-5xl py-2">
                                            تَقَبَّلَ اللّٰهُ مِنَّا وَ مِنْکُمْ
                                        </h1>
                                        <motion.p
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                                            className="text-emerald-100/50 text-lg"
                                        >
                                            Sent with much love from
                                            <br />
                                            <span className="text-emerald-400 text-2xl uppercase">{wishData.senderName}</span>
                                        </motion.p>
                                    </div>
                                </div>

                                {/* Message Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
                                    className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden"
                                >
                                    <MessageSquare className="absolute top-6 right-6 w-16 h-16 text-white/5 -rotate-12" />
                                    <p className="text-xl md:text-2xl text-emerald-50/90 leading-relaxed relative z-10 font-light">
                                        "{wishData.message}"
                                    </p>
                                </motion.div>

                                {/* Interaction Modes */}
                                <AnimatePresence mode="wait">
                                    {/* Fixed Eidi Mode */}
                                    {wishData.mode === "fixed" && !isClaimed && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3 }}
                                            className="bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 p-8 rounded-[2.5rem] text-center"
                                        >
                                            <Gift className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                            <h3 className="text-2xl font-bold text-amber-100 mb-2">You received Eidi!</h3>
                                            {showEidi && (
                                                <div className="text-5xl font-black text-amber-400 mb-8 tracking-tighter">
                                                    Rs. {wishData.amount}
                                                </div>
                                            )}
                                            <button onClick={handleClaimEidi} className="bg-amber-500 hover:bg-amber-400 text-[#05110d] font-bold py-4 px-12 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all text-lg hover:scale-105 inline-flex items-center gap-2">
                                                Claim Your Eidi
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* Challenge Eidi Mode */}
                                    {/* {wishData.mode === "challenge" && !quizFinished && ( */}
                                    {wishData.mode === "challenge" && !quizFinished && !wishData.isClaimed && (
                                        <motion.div
                                            key="challenge-ongoing"
                                            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                                            className="w-full rounded-3xl border border-amber-500/20 bg-card p-8 shadow-gold"
                                        >
                                            {/* Progress */}
                                            <div className="flex gap-2 mb-6">
                                                {wishData.questions.map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1.5 flex-1 rounded-full transition-colors ${i < currentQuestionIndex ? "bg-primary" : i === currentQuestionIndex ? "bg-primary/60" : "bg-muted"
                                                            }`}
                                                    />
                                                ))}
                                            </div>

                                            <p className="text-muted-foreground text-sm mb-2 font-mono">
                                                Question {currentQuestionIndex + 1} of {wishData.questions.length}
                                            </p>

                                            <h2 className="text-xl font-bold text-foreground mb-6">
                                                {wishData.questions[currentQuestionIndex].question}
                                            </h2>

                                            <div className="space-y-3">
                                                {wishData.questions[currentQuestionIndex].options.map((opt, idx) => {
                                                    const isSelected = selectedOption === idx;
                                                    const isCorrect = idx === wishData.questions[currentQuestionIndex].correctIndex;

                                                    let optionClass = "border-border bg-muted/50 hover:border-primary/50";
                                                    if (selectedOption !== null) {
                                                        if (isSelected) optionClass = "border-primary bg-primary/10";
                                                        else optionClass = "border-border bg-muted/20 opacity-50";
                                                    }

                                                    return (
                                                        <motion.button
                                                            key={idx}
                                                            onClick={() => handleOptionSelect(idx)}
                                                            disabled={selectedOption !== null}
                                                            className={`w-full text-left rounded-xl border p-4 transition-all flex items-center gap-3 ${optionClass}`}
                                                            whileHover={selectedOption === null ? { scale: 1.02 } : {}}
                                                            whileTap={selectedOption === null ? { scale: 0.98 } : {}}
                                                        >
                                                            <span className="flex-shrink-0 w-8 h-8 rounded-full border border-amber-500/30 flex items-center justify-center text-sm font-semibold text-primary">
                                                                {String.fromCharCode(65 + idx)}
                                                            </span>
                                                            <span className="text-foreground">{opt}</span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-6 text-center">
                                                <p className="text-xs text-muted-foreground">
                                                    Each correct answer = Rs. {Math.round(wishData.amount / 4).toLocaleString()}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Guess Eidi Mode */}
                                    {wishData.mode === "guess" && revealedAmount === null && !wishData.isClaimed && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3 }}
                                            className="space-y-6"
                                        >
                                            <div className="text-center">
                                                <h3 className="text-2xl font-bold text-amber-100 mb-2">Pick your Eidi!</h3>
                                                <p className="text-emerald-100/60">3 cards, 1 choice. Choose wisely!</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                                {shuffledGuessAmounts.map((amt, idx) => (
                                                    <motion.button
                                                        key={idx}
                                                        onClick={() => handleGuessReveal(amt)}
                                                        className="h-48 rounded-[2rem] bg-gradient-to-br from-emerald-600/20 to-emerald-900/40 border border-emerald-500/30 flex flex-col items-center justify-center gap-4 group hover:border-emerald-400 hover:bg-emerald-500/10 transition-all shadow-xl shadow-black/40"
                                                        whileHover={{ scale: 1.05, y: -5 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 1.5 + idx * 0.1 }}
                                                    >
                                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                                            <Gift className="w-8 h-8" />
                                                        </div>
                                                        <span className="text-lg font-bold tracking-widest text-emerald-100/40 group-hover:text-emerald-100 transition-colors uppercase">Card {idx + 1}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Final Claim State (For all modes) */}
                                    {(isClaimed || quizFinished || revealedAmount !== null) && (
                                        <motion.div
                                            key="final-claim"
                                            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: "spring" }}
                                            className="w-full rounded-3xl border border-amber-500/20 bg-card p-10 shadow-gold-lg text-center relative overflow-hidden"
                                        >

                                            <motion.div className="mx-auto mb-4 w-20 h-20 bg-gradient-gold rounded-[2rem] flex items-center justify-center" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                                                <CrescentMoon className="w-10 h-10 text-[#05110d] -rotate-12" />
                                            </motion.div>

                                            {wishData.mode === "challenge" ? (
                                                <>
                                                    <h2 className="text-2xl font-bold text-foreground mb-2">Challenge Complete!</h2>
                                                    <p className="text-muted-foreground mb-6">
                                                        You got <span className="text-primary font-bold">{score}/{wishData.questions.length}</span> correct — {score * 25}%
                                                    </p>
                                                </>
                                            ) : wishData.mode === "guess" ? (
                                                <>
                                                    <h2 className="text-2xl font-bold text-foreground mb-2">Eidi Revealed!</h2>
                                                    <p className="text-muted-foreground mb-6">Excellent choice! Happy Eid!</p>
                                                </>
                                            ) : (
                                                <>
                                                    <h2 className="text-2xl font-bold text-foreground mb-2">Eidi Claimed!</h2>
                                                    <p className="text-muted-foreground mb-6">Enjoy your gift!</p>
                                                </>
                                            )}

                                            {showEidi && (
                                                <motion.div className="rounded-2xl bg-gradient-gold p-1 mb-8" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 150 }}>
                                                    <div className="rounded-xl bg-card p-8">
                                                        <p className="text-muted-foreground text-sm mb-2">
                                                            {wishData.mode === "challenge" ? "You earned" : "You received"}
                                                        </p>
                                                        <motion.p className="text-5xl md:text-6xl font-bold text-gradient-gold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                                                            Rs. {calculateEidi().toLocaleString()}
                                                        </motion.p>
                                                        {wishData.mode === "challenge" && (
                                                            <p className="text-muted-foreground text-xs mt-2">out of Rs. {wishData.amount.toLocaleString()}</p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {calculateEidi() > 0 && !isWithdrawn ? (
                                                <div className="bg-black/20 p-6 rounded-2xl mb-8 space-y-4 text-left border border-emerald-500/10">
                                                    <h4 className="text-emerald-400 font-medium text-lg mb-2">Withdraw Eidi to Bank</h4>
                                                    <input
                                                        type="text"
                                                        placeholder="Account Title"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-emerald-50 placeholder-emerald-100/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                        value={bankDetails.accountTitle}
                                                        onChange={(e) => setBankDetails({ ...bankDetails, accountTitle: e.target.value })}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Account Number / IBAN"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-emerald-50 placeholder-emerald-100/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                        value={bankDetails.accountNumber}
                                                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Bank Name"
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-emerald-50 placeholder-emerald-100/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                        value={bankDetails.bankName}
                                                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                                    />
                                                    <button
                                                        onClick={handleWithdraw}
                                                        disabled={!bankDetails.accountTitle || !bankDetails.accountNumber || !bankDetails.bankName}
                                                        className="w-full bg-emerald-500 disabled:bg-emerald-500/20 disabled:text-emerald-100/30 disabled:cursor-not-allowed hover:bg-emerald-400 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex justify-center items-center mt-4"
                                                    >
                                                        Confirm Withdrawal
                                                    </button>
                                                </div>
                                            ) : isWithdrawn ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                    className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl mb-8 flex flex-col items-center"
                                                >
                                                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="text-emerald-300 font-medium text-lg">Withdrawal Requested</h4>
                                                    <p className="text-emerald-100/60 text-sm mt-1 mb-4">Your Eidi will be deposited to:</p>

                                                    {/* Saved Bank Details */}
                                                    <div className="w-full text-left space-y-2 bg-black/40 p-4 rounded-xl border border-emerald-500/20 mt-2">
                                                        <p className="text-xs text-emerald-100/50">ACCOUNT TITLE</p>
                                                        <p className="text-sm font-medium text-emerald-50">{wishData.bankDetails?.accountTitle || bankDetails.accountTitle}</p>
                                                        <p className="text-xs text-emerald-100/50 mt-3">ACCOUNT NO.</p>
                                                        <p className="text-sm font-mono text-emerald-50">{wishData.bankDetails?.accountNumber || bankDetails.accountNumber}</p>
                                                        <p className="text-xs text-emerald-100/50 mt-3">BANK NAME</p>
                                                        <p className="text-sm font-medium text-emerald-50">{wishData.bankDetails?.bankName || bankDetails.bankName}</p>
                                                    </div>
                                                </motion.div>
                                            ) : null}

                                            <a href="/" className="bg-emerald-950 shadow-lg rounded-full px-4 py-2  min-w-40 text-sm text-white cursor-pointer ">
                                                CREATE YOUR OWN WISH
                                            </a>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
