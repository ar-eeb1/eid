"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check, MessageCircle, Gift, HelpCircle, Eye, Lock, Zap, Banknote } from "lucide-react";
import CrescentMoon from "../components/CrescentMoon";
import { Toaster, toast } from "sonner";
import Link from "next/link";

const modes = [
  { id: "simple", label: "Simple Wish", icon: <MessageCircle className="h-5 w-5" />, color: "border-accent", desc: "Send a heartfelt Eid wish" },
  { id: "fixed", label: "Fixed Eidi", icon: <Gift className="h-5 w-5" />, color: "border-primary", desc: "Set a fixed Eidi amount" },
  { id: "challenge", label: "Challenge Eidi", icon: <HelpCircle className="h-5 w-5" />, color: "border-destructive", desc: "Gamified quiz with Eidi reward" },
  { id: "request", label: "Request Eidi", icon: <Banknote className="h-5 w-5" />, color: "border-blue-500", desc: "Request Eidi with bank details" },
  { id: "guess", label: "Guess Eidi", icon: <Banknote className="h-5 w-5" />, color: "border-primary", desc: "Guess and win" },

];

const emptyQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctIndex: 0,
});

export default function WishCreator() {
  const [mode, setMode] = useState(null);
  const [senderName, setSenderName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [guessAmounts, setGuessAmounts] = useState(["", "", ""]);
  const [bankDetails, setBankDetails] = useState({ accountTitle: "", accountNumber: "", bankName: "" });
  const [questions, setQuestions] = useState([
    emptyQuestion(), emptyQuestion(), emptyQuestion(), emptyQuestion(),
  ]);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auth State
  const [authMode, setAuthMode] = useState("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dashboard State
  const [currentTab, setCurrentTab] = useState("create"); // "create" | "dashboard"
  const [userWishes, setUserWishes] = useState([]);
  const [isLoadingWishes, setIsLoadingWishes] = useState(false);

  // Payment State
  const [showBankDetails, setShowBankDetails] = useState(false);

  // Admin Stats
  const [adminStats, setAdminStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdatingUser, setIsUpdatingUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated && (activeUser?.role === "admin" || activeUser?.role === "master")) {
      const fetchAdminData = async () => {
        try {
          const endpoint = activeUser.role === "master"
            ? `/api/admin?username=${activeUser.username}${searchQuery ? `&search=${searchQuery}` : ""}`
            : `/api/admin?username=${activeUser.username}`;

          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            if (activeUser.role === "master") {
              setAllUsers(data.users || []);
              setAdminStats({ totalUsers: data.totalUsers, totalPaid: data.totalPaid });
            } else {
              setAdminStats(data);
            }
          }
        } catch (error) {
          console.error("Failed to fetch admin data", error);
        }
      };
      fetchAdminData();
    }
  }, [isAuthenticated, activeUser, searchQuery]);

  const toggleIsPaid = async (userId, currentStatus) => {
    setIsUpdatingUser(userId);
    try {
      const res = await fetch(`/api/admin?username=${activeUser.username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isPaid: !currentStatus }),
      });

      if (res.ok) {
        const { user } = await res.json();
        setAllUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isPaid: user.isPaid } : u)));
        toast.success(`User ${user.isPaid ? "activated" : "deactivated"} successfully`);
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsUpdatingUser(null);
    }
  };



  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (field === "question") updated[idx] = { ...updated[idx], question: value };
      else if (field === "correctIndex") updated[idx] = { ...updated[idx], correctIndex: value };
      else if (field.startsWith("option")) {
        const optIdx = parseInt(field.replace("option", ""));
        const newOpts = [...updated[idx].options];
        newOpts[optIdx] = value;
        updated[idx] = { ...updated[idx], options: newOpts };
      }
      return updated;
    });
  };

  const handleGenerate = () => {
    if (!mode || !senderName || !receiverName || !message || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if ((mode === "fixed" || mode === "challenge") && (!amount || parseInt(amount) <= 0)) {
      toast.error("Please enter a valid Eidi amount");
      return;
    }
    if (mode === "request") {
      if (!bankDetails.accountTitle || !bankDetails.accountNumber || !bankDetails.bankName) {
        toast.error("Please fill in all bank details");
        return;
      }
    }
    if (mode === "guess") {
      if (guessAmounts.some((a) => !a || parseInt(a) <= 0)) {
        toast.error("Please enter 3 valid Eidi amounts");
        return;
      }
    }
    if (mode === "challenge") {
      for (let i = 0; i < 4; i++) {
        if (!questions[i].question || questions[i].options.some((o) => !o)) {
          toast.error(`Please complete question ${i + 1}`);
          return;
        }
      }
    }

    const data = {
      mode,
      senderName: senderName.trim(),
      receiverName: receiverName.trim(),
      message: message.trim(),
      password: password.trim(),
      creator: activeUser?.username, // Add creator directly here
      ...(mode !== "simple" && mode !== "guess" && mode !== "request" && { amount: parseInt(amount) }),
      ...(mode === "guess" && { guessAmounts: guessAmounts.map(a => parseInt(a)) }),
      ...(mode === "challenge" && { questions }),
      ...(mode === "request" && { bankDetails }),
    };

    if (mode === "simple") {
      saveWishToDb(data);
    } else {
      // Premium mode path
      if (activeUser?.isPaid) {
        saveWishToDb(data);
      } else {
        setShowBankDetails(true);
      }
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authUsername || !authPassword) {
      toast.error("Please enter username and password");
      return;
    }

    setIsAuthenticating(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, password: authPassword, action: authMode }),
      });
      const resData = await res.json();

      if (!res.ok) {
        toast.error(resData.message || "Failed to authenticate");
        setIsAuthenticating(false);
        return;
      }

      toast.success("Welcome, " + resData.user.username + "!");
      setActiveUser(resData.user);
      setIsAuthenticated(true);
      fetchUserWishes(resData.user.username);

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const saveWishToDb = async (data) => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save wish");

      const { id } = await res.json();
      const link = `${window.location.origin}/wish/${id}`;
      setGeneratedLink(link);

      // Refresh the wishes list behind the scenes
      if (activeUser?.username) {
        fetchUserWishes(activeUser.username);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate wish link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchUserWishes = async (username) => {
    setIsLoadingWishes(true);
    try {
      const res = await fetch(`/api/wish?creator=${username}`);
      if (res.ok) {
        const data = await res.json();
        setUserWishes(data);
      }
    } catch (e) {
      console.error("Failed to load wishes", e);
    } finally {
      setIsLoadingWishes(false);
    }
  };

  return (
    <div className="relative min-h-screen p-4 md:p-8 bg-[#05110d] text-white">
      <Toaster position="top-center" theme="dark" />
      <div className="mx-auto max-w-2xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 pt-8"
        >
          <motion.div
            className="mx-auto mb-4 w-16"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <CrescentMoon className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-amber-300 mb-2">
            Eid Wish Creator
          </h1>
          <p className="text-emerald-100/60">
            Create a magical Eid greeting for someone special
          </p>
        </motion.div>

        {!isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto bg-black/20 border border-emerald-500/20 rounded-3xl p-8 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden"
          >
            <form onSubmit={handleAuthSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-amber-300">
                  {authMode === "login" ? "Welcome Back" : "Create an Account"}
                </h3>
                <p className="text-sm text-emerald-100/60 mt-2">
                  {authMode === "login" ? "Login to start spreading joy." : "Sign up to start spreading joy."}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-emerald-50">Username</Label>
                  <Input
                    placeholder="Enter your username"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="bg-black/40 border-white/10 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-emerald-50">Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="bg-black/40 border-white/10 text-white"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-linear-to-r from-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-300 text-[#05110d] font-bold py-6 shadow-md transition-all disabled:opacity-70"
              >
                {isAuthenticating ? "Processing..." : authMode === "login" ? "Login" : "Sign Up"}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer bg-white/10 px-2 py-1 rounded-full"
                >
                  {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <>
            {/* Admin Stats Banner */}
            {(activeUser?.role === "admin" || activeUser?.role === "master") && adminStats && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 grid grid-cols-2 gap-4"
              >
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-100/50 uppercase tracking-wider font-semibold">Total Users</p>
                    <p className="text-xl font-bold text-white">{adminStats.totalUsers}</p>
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-100/50 uppercase tracking-wider font-semibold">Paid Users</p>
                    <p className="text-xl font-bold text-white">{adminStats.totalPaid}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Dashboard Tabs Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-black/40 border border-white/10 p-1 rounded-2xl inline-flex relative">
                <button
                  onClick={() => setCurrentTab("create")}
                  className={`relative z-10 px-6 py-2.5 text-sm font-medium transition-colors cursor-pointer ${currentTab === "create" ? "text-[#05110d]" : "text-emerald-100/60 hover:text-white"}`}
                >
                  Create Wish
                </button>
                <button
                  onClick={() => setCurrentTab("dashboard")}
                  className={`relative z-10 px-6 py-2.5 text-sm font-medium transition-colors cursor-pointer ${currentTab === "dashboard" ? "text-[#05110d]" : "text-emerald-100/60 hover:text-white"}`}
                >
                  My Dashboard
                </button>
                {activeUser?.role === "master" && (
                  <button
                    onClick={() => setCurrentTab("users")}
                    className={`relative z-10 px-6 -mr-5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${currentTab === "users" ? "text-[#05110d]" : "text-emerald-100/60 hover:text-white"}`}
                  >
                    User Management
                  </button>
                )}
                {/* Active Slider */}
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-1 bottom-1 bg-linear-to-r from-emerald-500 to-teal-400 rounded-xl shadow-md"
                  initial={false}
                  animate={{
                    left: currentTab === "create" ? "4px" : currentTab === "dashboard" ? "calc(33.33% + 2px)" : "calc(66.66% + 2px)",
                    width: activeUser?.role === "master" ? "calc(33.33% - 4px)" : "calc(50% - 4px)"
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  style={{
                    left: currentTab === "create"
                      ? "4px"
                      : activeUser?.role === "master"
                        ? currentTab === "dashboard" ? "33.33%" : "66.66%"
                        : "50%"
                  }}
                />
              </div>
            </div>

            {currentTab === "dashboard" ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl mx-auto space-y-4"
              >
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-emerald-400 to-emerald-200">Your Created Wishes</h2>
                    <p className="text-emerald-100/60 text-sm">Monitor Eidi claims and partner scores</p>
                  </div>
                  {isLoadingWishes && <div className="text-emerald-400 text-sm animate-pulse">Refreshing...</div>}
                </div>

                {userWishes.length === 0 && !isLoadingWishes ? (
                  <div className="text-center bg-black/20 border border-emerald-500/20 rounded-3xl p-12">
                    <Gift className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
                    <h3 className="text-white font-medium text-lg">No wishes yet!</h3>
                    <p className="text-emerald-100/60 text-sm mt-1 mb-6">Create your first magical Eid wish to see it here.</p>
                    <Button onClick={() => setCurrentTab("create")} className="bg-emerald-500 hover:bg-emerald-400 text-black">Create Wish</Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {userWishes.map((w, idx) => (
                      <div key={idx} className="bg-black/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div>
                                <h3 className="text-lg font-bold text-white">To: {w.receiverName}</h3>
                                <h3 className="text-sm text-emerald-100/60">Password: {w.password}</h3>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${w.mode === 'simple' ? 'bg-accent/10 text-accent border-accent/20' : w.mode === 'fixed' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                                {w.mode.charAt(0).toUpperCase() + w.mode.slice(1)}
                              </span>
                            </div>
                            <p className="text-xs text-emerald-100/40">{new Date(w.createdAt).toLocaleDateString()}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={`${window.location.origin}/wish/${w._id}`}
                              className="h-8 max-w-[150px] bg-black/40 border-white/10 text-xs text-emerald-100/60"
                            />
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/wish/${w._id}`);
                                toast.success("Link copied!");
                              }}
                              variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 grid md:grid-cols-2 gap-4 relative z-10">
                          {/* Left Status Data */}
                          <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-emerald-100/50 
                             tracking-wider font-semibold">Status</p>
                            <div className="flex items-center gap-2">
                              {w.isClaimed ? (
                                <div>

                                  <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                                    <Check className="w-4 h-4" /> Claimed
                                  </span>
                                  <div className="mt-1 text-sm text-emerald-50">
                                    <span className="text-emerald-100/60 mr-2">Eidi:</span>
                                    <strong className="text-emerald-400">
                                      ₨{w.mode === 'request' ? (w.requestedAmount || 0) : w.amount}
                                    </strong>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-amber-200/60">{w.mode === 'request' ? "Awaiting Response" : "Pending View / Unclaimed"}</span>
                              )}
                            </div>

                            {w.mode === "challenge" && w.isClaimed && (
                              <>
                                <div className="mt-2 text-sm text-emerald-50">
                                  <span className="text-emerald-100/60 mr-2">Score:</span>
                                  <strong className="text-emerald-400">{w.score}/{w.questions?.length}</strong> ({(w.score * 25) || 0}%)
                                </div>
                                {/* final amount calculation: deduct 25% per wrong answer */}
                                <div className="mt-1 text-sm text-emerald-50">
                                  <span className="text-emerald-100/60 mr-2">Final Eidi:</span>
                                  <strong className="text-emerald-400">
                                    ₨{Math.round((w.amount || 0) * (w.score / (w.questions?.length || 1)))}
                                  </strong>
                                </div>
                              </>
                            )}

                          </div>

                          {/* Right Bank Data */}
                          {((w.mode === "challenge" || w.mode === "fixed" || w.mode === "request") && w.bankDetails && w.bankDetails.accountNumber) && (
                            <div className="space-y-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                              <p className="text-xs text-emerald-100/50 uppercase tracking-wider font-semibold">
                                {w.mode === "request" ? "Your Bank Details" : "Partner Bank Details"}
                              </p>
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-emerald-100/50">Bank:</span>
                                  <span className="text-emerald-50 font-medium">{w.bankDetails.bankName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-emerald-100/50">Title:</span>
                                  <span className="text-emerald-50 font-medium">{w.bankDetails.accountTitle}</span>
                                </div>
                                <div className="flex justify-between mt-1 pt-1 border-t border-white/5">
                                  <span className="text-emerald-100/50 mt-1">Acct:</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-emerald-400 font-mono text-xs">{w.bankDetails.accountNumber}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : currentTab === "users" && activeUser?.role === "master" ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl mx-auto space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-emerald-400 to-emerald-200">User Management</h2>
                  <p className="text-emerald-100/60 text-sm">Update activation status for users</p>
                </div>

                <div className="relative">
                  <Input
                    placeholder="Search users by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/40 border-white/10 text-white pl-10 h-12 rounded-xl"
                  />
                  <Eye className="absolute left-3 top-3.5 w-5 h-5 text-emerald-100/30" />
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-6 py-4 text-xs font-semibold text-emerald-100/50 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-xs font-semibold text-emerald-100/50 uppercase tracking-wider">Password</th>
                        <th className="px-6 py-4 text-xs font-semibold text-emerald-100/50 uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-emerald-100/50 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allUsers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-emerald-100/30 italic">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        allUsers.map((user) => (
                          <tr key={user._id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-white">{user.username}</div>
                              <div className="text-xs text-emerald-100/40 uppercase">{user.role}</div>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-emerald-400">
                              {user.password}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${user.isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                {user.isPaid ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                size="sm"
                                onClick={() => toggleIsPaid(user._id, user.isPaid)}
                                disabled={isUpdatingUser === user._id}
                                className={`h-8 px-4 rounded-lg text-xs font-bold transition-all ${user.isPaid ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                              >
                                {isUpdatingUser === user._id ? "..." : user.isPaid ? "Deactivate" : "Activate"}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Mode Selection */}
                {!mode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid gap-4"
                  >
                    <p className="text-center text-sm text-emerald-100/60 mb-2">Choose a mode</p>
                    {modes.map((m) => (
                      <motion.button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`cursor-pointer rounded-2xl border ${m.id === 'simple' ? 'border-emerald-500' : m.id === 'fixed' ? 'border-amber-500' : 'border-rose-500'} border-opacity-30 bg-black/20 p-6 text-left transition-all hover:shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:border-opacity-100 flex items-center gap-4`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`shrink-0 w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center ${m.id === 'simple' ? 'text-emerald-400' : m.id === 'fixed' ? 'text-amber-400' : 'text-rose-400'}`}>
                          {m.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">{m.label}</h3>
                          <p className="text-sm text-emerald-100/60">{m.desc}</p>
                        </div>
                      </motion.button>
                    ))}
                    <div className="text-center text-sm text-emerald-100/60 my-4 py-2 border border-white/10 rounded-2xl p-2">
                      Keep checking — more modes coming soon.
                    </div>
                  </motion.div>
                )}

                {/* Form */}
                <AnimatePresence mode="wait">
                  {mode && !generatedLink && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <button
                        onClick={() => setMode(null)}
                        className="text-sm text-emerald-100/60 hover:text-emerald-400 transition-colors"
                      >
                        ← Change mode
                      </button>

                      <div className="rounded-2xl border border-amber-500/20 bg-black/20 p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-emerald-50">Your Name</Label>
                            <Input
                              placeholder="Sender name"
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              className="bg-black/40 border-white/10 text-white"
                              maxLength={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-emerald-50">Receiver Name</Label>
                            <Input
                              placeholder="Receiver name"
                              value={receiverName}
                              onChange={(e) => setReceiverName(e.target.value)}
                              className="bg-black/40 border-white/10 text-white"
                              maxLength={100}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-emerald-50">Eid Message</Label>
                          <Textarea
                            placeholder="Write your Eid wish here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="bg-black/40 border-white/10 text-white min-h-25"
                            maxLength={1000}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-emerald-50">Password</Label>
                          <Input
                            placeholder="Set a password for the receiver"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-black/40 border-white/10 text-white"
                            maxLength={50}
                          />
                          <p className="text-xs text-emerald-100/60">Share this password with the receiver separately</p>
                        </div>

                        {(mode === "fixed" || mode === "challenge") && (
                          <div className="space-y-2">
                            <Label className="text-emerald-50">Eidi Amount (Rs.)</Label>
                            <Input
                              type="number"
                              placeholder="e.g. 5000"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="bg-black/40 border-white/10 text-white"
                              min={1}
                            />
                          </div>
                        )}

                        {mode === "request" && (
                          <div className="space-y-4">
                            <Label className="text-emerald-50 block mb-2">Bank Details</Label>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-emerald-100/40">Account Title</Label>
                                <Input
                                  placeholder="e.g. Areeb"
                                  value={bankDetails.accountTitle}
                                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountTitle: e.target.value }))}
                                  className="bg-black/40 border-white/10 text-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-emerald-100/40">Account Number</Label>
                                <Input
                                  placeholder="e.g. 1234567890123"
                                  value={bankDetails.accountNumber}
                                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                                  className="bg-black/40 border-white/10 text-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-emerald-100/40">Bank Name</Label>
                                <Input
                                  placeholder="e.g. Easypaisa"
                                  value={bankDetails.bankName}
                                  onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                                  className="bg-black/40 border-white/10 text-white"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-emerald-100/60">Recipients will see these details after setting their Eidi amount</p>
                          </div>
                        )}

                        {mode === "guess" && (
                          <div className="space-y-4">
                            <Label className="text-emerald-50 block mb-2">3 Eidi Amounts (Recipient will pick one!)</Label>
                            <div className="grid grid-cols-3 gap-3">
                              {guessAmounts.map((val, idx) => (
                                <div key={idx} className="space-y-1">
                                  <Label className="text-xs text-emerald-100/40">Amount {idx + 1}</Label>
                                  <Input
                                    type="number"
                                    placeholder="e.g. 500"
                                    value={val}
                                    onChange={(e) => {
                                      const newAmounts = [...guessAmounts];
                                      newAmounts[idx] = e.target.value;
                                      setGuessAmounts(newAmounts);
                                    }}
                                    className="bg-black/40 border-white/10 text-white"
                                    min={1}
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-emerald-100/60 font-mono italic">Recipient will see 3 cards and pick one to reveal their Eidi!</p>
                          </div>
                        )}
                      </div>

                      {/* Challenge Questions */}
                      {mode === "challenge" && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-emerald-50">
                            Quiz Questions (4 required)
                          </h3>
                          {questions.map((q, qi) => (
                            <motion.div
                              key={qi}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: qi * 0.1 }}
                              className="rounded-xl border border-white/10 bg-black/20 p-5 space-y-3"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                                  {qi + 1}
                                </span>
                                <Label className="text-emerald-50">Question {qi + 1}</Label>
                              </div>
                              <Input
                                placeholder="Type your question..."
                                value={q.question}
                                onChange={(e) => updateQuestion(qi, "question", e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                                maxLength={300}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateQuestion(qi, "correctIndex", oi)}
                                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${q.correctIndex === oi
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-emerald-100/30"
                                        }`}
                                    >
                                      {q.correctIndex === oi && <Check className="h-3 w-3" />}
                                    </button>
                                    <Input
                                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                      value={opt}
                                      onChange={(e) => updateQuestion(qi, `option${oi}`, e.target.value)}
                                      className="bg-black/40 border-white/10 text-white text-sm"
                                      maxLength={100}
                                    />
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-emerald-100/60">Click the circle to mark the correct answer</p>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-linear-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-[#05110d] font-bold text-lg py-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
                      >
                        {isGenerating ? "Generating..." : "Generate Wish Link 🌙"}
                      </Button>
                    </motion.div>
                  )}

                  {/* Generated Link */}
                  {generatedLink && (
                    <motion.div
                      key="link"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      <div className="rounded-2xl border border-amber-500/30 bg-black/20 p-8 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="text-5xl mb-4"
                        >
                          🎉
                        </motion.div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-amber-300 mb-2">
                          Wish Created!
                        </h2>
                        <p className="text-emerald-100/60 mb-6">
                          Share this link with <span className="text-emerald-400 font-semibold">{receiverName}</span>
                        </p>

                        <div className="flex items-center gap-2 rounded-xl bg-black/40 border border-white/10 p-3 mb-4">
                          <input
                            readOnly
                            value={generatedLink}
                            className="flex-1 bg-transparent text-sm text-white outline-none truncate"
                          />
                          <Button
                            onClick={handleCopy}
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>

                        <p className="text-xs text-emerald-100/60">
                          Password: <span className="text-white font-semibold">{password}</span> — share this separately!
                        </p>

                        <div className="flex flex-col gap-3 mt-6">
                          <Link href={generatedLink} target="_blank">
                            <Button
                              variant="outline"
                              className="w-full bg-white/5 border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-100 hover:text-emerald-50"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview Wish
                            </Button>
                          </Link>

                          <Button
                            onClick={() => {
                              setGeneratedLink("");
                              setMode(null);
                              setSenderName("");
                              setReceiverName("");
                              setMessage("");
                              setPassword("");
                              setAmount("");
                              setQuestions([emptyQuestion(), emptyQuestion(), emptyQuestion(), emptyQuestion()]);
                            }}
                            variant="ghost"
                            className="text-emerald-100/60 hover:text-emerald-400"
                          >
                            Create another wish
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bank Details Modal */}
                <AnimatePresence>
                  {showBankDetails && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                      <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="w-full max-w-md bg-[#05110d] border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative overflow-hidden text-center"
                      >
                        <div className="mx-auto w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 text-rose-500">
                          <Zap className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Account Not Activated</h3>
                          <p className="text-sm text-emerald-100/60 leading-relaxed">
                            To use premium templates, please subscribe. Transfer the amount of <span className="text-[#E6C239] font-extrabold text-xl">{(50).toLocaleString('en-PK', {
                              style: 'currency',
                              currency: 'PKR',
                            })}</span> membership fee to the following bank details:
                          </p>
                        </div>


                        {/* national */}
                        <h3 className="text-xl font-bold text-white my-2">Users from Pakistan</h3>

                        <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3 text-left">
                          <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-xs text-emerald-100/50 uppercase tracking-wider">Bank Name</span>
                            <span className="text-sm font-medium text-emerald-50">United Bank Limited</span>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-xs text-emerald-100/50 uppercase tracking-wider">IBAN</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-emerald-400">PK19UNIL0109000337815072</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText("PK19UNIL0109000337815072");
                                  toast.success("Account number copied!");
                                }}
                                className="text-emerald-100/40 hover:text-emerald-400"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {/* ACCOUNT NO */}
                          <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-xs text-emerald-100/50 uppercase tracking-wider">Account No</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-emerald-400">337815072</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText("337815072");
                                  toast.success("Account number copied!");
                                }}
                                className="text-emerald-100/40 hover:text-emerald-400"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-xs text-emerald-100/50 uppercase tracking-wider">Account Title</span>
                            <span className="text-sm font-medium text-emerald-50">Areeb Amir</span>
                          </div>

                          <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-xs text-emerald-100/50 uppercase tracking-wider">Easypaisa</span>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-emerald-400">03171232544</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText("03171232544");
                                    toast.success("Account number copied!");
                                  }}
                                  className="text-emerald-100/40 hover:text-emerald-400"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* international */}
                        <h3 className="text-xl font-bold text-white my-2">International users</h3>

                        <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-left">
                          <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-xs text-emerald-100/50 uppercase tracking-wider">Bank Name</span>
                            <span className="text-sm font-medium text-emerald-50">United Bank Limited</span>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-xs text-emerald-100/50 uppercase tracking-wider">Account Title</span>
                            <span className="text-sm font-medium text-emerald-50">Areeb Amir</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-emerald-100/50 uppercase tracking-wider">IBAN</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-emerald-400">PK84UNIL0109000340275083</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText("PK84UNIL0109000340275083");
                                  toast.success("Account number copied!");
                                }}
                                className="text-emerald-100/40 hover:text-emerald-400"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-rose-400/80 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 mt-6 md:mb-6 flex items-center justify-center flex-col">
                          Send a screenshot of your payment receipt to WhatsApp to activate your account.{" "}
                          <a
                            className="hover:text-green-500 flex text-xl"
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://wa.me/923700182844?text=Hi%20I%20want%20membership%20of%20your%20website"
                          >
                            Contact WhatsApp: 03700182844
                          </a>

                          <a
                            className="bg-green-500 text-white px-4 py-2 rounded-lg mt-2"
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://wa.me/923700182844?text=Hi%20I%20want%20membership%20of%20your%20website"
                          >
                            OPEN WHATSAPP
                          </a>

                        </p>

                        <Button
                          onClick={() => setShowBankDetails(false)}
                          variant="outline"
                          className="w-full mt-4 bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        >
                          Close
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

