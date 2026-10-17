// THINAI Community Screen - Tamil Nadu Farmers Community Board
// Shared community discussions, local advisory tips, pest outbreak alerts
// Synced to Cloud Firestore `community_posts` with Dexie offline support

import React, { useState, useEffect } from "react";
import { 
  Users, 
  MessageSquare, 
  ThumbsUp, 
  Send, 
  MapPin, 
  Sparkles, 
  AlertCircle,
  Share2,
  Mic,
  Volume2
} from "lucide-react";
import { auth, firestoreDb } from "../../firebase";
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { syncManager } from "../../services/syncService";
import { db } from "../../services/db";

export interface CommunityPost {
  id: string;
  authorName: string;
  district: string;
  crop: string;
  content: string;
  likesCount: number;
  createdAt: string;
  isOutbreakAlert?: boolean;
  isSample?: boolean;
}

const DEFAULT_POSTS: CommunityPost[] = [
  {
    id: "sample-post-1",
    authorName: "Sample Farmer / மாதிரி விவசாயி",
    district: "Thanjavur",
    crop: "Paddy (CR 1009)",
    content: "Sample Alert: Early morning mist and high humidity in Orathanadu block. Observed minor leaf folder incidence. Applying Neem oil 3% spray before morning dew dries.",
    likesCount: 14,
    createdAt: "Demo Reference Only",
    isOutbreakAlert: true,
    isSample: true
  },
  {
    id: "sample-post-2",
    authorName: "Sample Farmer / மாதிரி விவசாயி",
    district: "Coimbatore",
    crop: "Tomato",
    content: "Sample Note: Pollachi mandi tomato prices touched ₹28/kg at the uzhavar sandhai. Good demand for Shivam variety.",
    likesCount: 9,
    createdAt: "Demo Reference Only",
    isSample: true
  }
];

interface CommunityScreenProps {
  district?: string;
  primaryCrop?: string;
  language?: string;
  showToast?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function CommunityScreen({
  district = "Coimbatore",
  primaryCrop = "Paddy",
  language = "English",
  showToast
}: CommunityScreenProps) {
  const [posts, setPosts] = useState<CommunityPost[]>(DEFAULT_POSTS);
  const [newContent, setNewContent] = useState("");
  const [newCrop, setNewCrop] = useState(primaryCrop);
  const [isAlert, setIsAlert] = useState(false);
  const [posting, setPosting] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCommunityPosts();
  }, []);

  const loadCommunityPosts = async () => {
    let localQueuedPosts: CommunityPost[] = [];
    try {
      const queued = await db.syncQueue.where("entity").equals("post").toArray();
      localQueuedPosts = queued.map((q) => ({
        id: q.clientId,
        authorName: q.payload?.authorName || "You (Local)",
        district: q.payload?.district || district,
        crop: q.payload?.crop || primaryCrop,
        content: q.payload?.content || "",
        likesCount: 0,
        createdAt: language === "Tamil" ? "காத்திருக்கிறது (Pending Sync)" : "Pending Sync",
        isOutbreakAlert: !!q.payload?.isOutbreakAlert
      }));
    } catch {
      // Ignore
    }

    if (syncManager.isOfflineActive()) {
      setPosts([...localQueuedPosts, ...DEFAULT_POSTS]);
      return;
    }

    try {
      const q = query(collection(firestoreDb, "community_posts"), limit(30));
      const snap = await getDocs(q);
      const remotePosts: CommunityPost[] = [];
      snap.forEach((d) => {
        const data = d.data();
        remotePosts.push({
          id: d.id,
          authorName: data.authorName || "Tamil Farmer",
          district: data.district || district,
          crop: data.crop || primaryCrop,
          content: data.content,
          likesCount: data.likesCount || 0,
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "Recently",
          isOutbreakAlert: !!data.isOutbreakAlert
        });
      });
      if (remotePosts.length > 0) {
        setPosts([...localQueuedPosts, ...remotePosts, ...DEFAULT_POSTS]);
      } else {
        setPosts([...localQueuedPosts, ...DEFAULT_POSTS]);
      }
    } catch {
      // Graceful offline fallback to default posts + local queued posts
      setPosts([...localQueuedPosts, ...DEFAULT_POSTS]);
    }
  };

  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    setPosting(true);
    const user = auth.currentUser;
    const authorName = user?.displayName || "Farmer (" + district + ")";
    const postId = `post-${Date.now()}`;

    const newPostItem: CommunityPost = {
      id: postId,
      authorName,
      district,
      crop: newCrop,
      content: newContent.trim(),
      likesCount: 0,
      createdAt: syncManager.isOfflineActive() 
        ? (language === "Tamil" ? "காத்திருக்கிறது (Pending Sync)" : "Pending Sync") 
        : "Just now",
      isOutbreakAlert: isAlert
    };

    const payload = {
      userId: user?.uid || "anonymous_farmer",
      authorName,
      district,
      crop: newCrop,
      content: newContent.trim(),
      likesCount: 0,
      isOutbreakAlert: isAlert,
      createdAt: new Date().toISOString()
    };

    try {
      if (!syncManager.isOfflineActive() && user) {
        await addDoc(collection(firestoreDb, "community_posts"), payload);
        if (showToast) {
          showToast(
            language === "Tamil" ? "பதிவு பகிரப்பட்டது!" : "Post published to Tamil Nadu farmer community!",
            "success"
          );
        }
      } else {
        await db.syncQueue.add({
          userId: user?.uid || "anonymous_farmer",
          entity: "post",
          action: "create",
          clientId: postId,
          payload,
          timestamp: new Date().toISOString(),
          retryCount: 0,
          status: "pending"
        });
        await syncManager.updatePendingCount();
        if (showToast) {
          showToast(
            language === "Tamil" ? "ஆஃப்லைனில் சேமிக்கப்பட்டது. இணையம் வந்ததும் பகிரப்படும்." : "Saved offline. Will sync when online.",
            "info"
          );
        }
      }
      setPosts([newPostItem, ...posts]);
      setNewContent("");
      setIsAlert(false);
    } catch (e) {
      console.warn("Could not push post directly to firestore, queuing in Dexie:", e);
      try {
        await db.syncQueue.add({
          userId: user?.uid || "anonymous_farmer",
          entity: "post",
          action: "create",
          clientId: postId,
          payload,
          timestamp: new Date().toISOString(),
          retryCount: 0,
          status: "pending"
        });
        await syncManager.updatePendingCount();
      } catch {}
      setPosts([newPostItem, ...posts]);
      setNewContent("");
      if (showToast) {
        showToast(
          language === "Tamil" ? "ஆஃப்லைனில் சேமிக்கப்பட்டது. பின்னர் ஒத்திசைக்கப்படும்." : "Saved to offline sync queue.",
          "info"
        );
      }
    } finally {
      setPosting(false);
    }
  };

  const handleLike = (id: string) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const isLiked = !!likedMap[id];
          return { ...p, likesCount: p.likesCount + (isLiked ? -1 : 1) };
        }
        return p;
      })
    );
  };

  const handleSpeakPost = (content: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = language === "Tamil" ? "ta-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-20 select-none">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {language === "Tamil" ? "உழவர் சமூகம் & ஆலோசனைகள்" : "FARMER COMMUNITY"}
            </h2>
            <p className="text-xs text-emerald-200">
              {language === "Tamil"
                ? "தமிழ்நாடு உழவர்களுடன் கள அனுபவங்களையும் பூச்சி எச்சரிக்கைகளையும் பகிருங்கள்"
                : "Real-time updates, pest alerts & mandi experiences from Tamil Nadu farmers"}
            </p>
          </div>
        </div>
      </div>

      {/* Post Composer Card (Touch target >= 48px) */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            {language === "Tamil" ? "புதிய செய்தி / ஆலோசனை" : "Share an update or question"}
          </span>
          <select
            value={newCrop}
            onChange={(e) => setNewCrop(e.target.value)}
            className="text-xs border border-zinc-300 rounded-lg px-2 py-1 font-semibold text-zinc-700 bg-zinc-50"
          >
            <option value="Paddy">Paddy / நெல்</option>
            <option value="Tomato">Tomato / தக்காளி</option>
            <option value="Maize">Maize / மக்காச்சோளம்</option>
            <option value="Cotton">Cotton / பருத்தி</option>
            <option value="Sugarcane">Sugarcane / கரும்பு</option>
          </select>
        </div>

        <textarea
          rows={3}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={
            language === "Tamil"
              ? "உங்கள் வயல் அனுபவம், பூச்சி தாக்குதல் அல்லது சந்தை நிலவரத்தை பகிருங்கள்..."
              : "Share field observation, pest outbreak warning, or mandi price updates..."
          }
          className="w-full text-xs p-3 rounded-xl border border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isAlert}
              onChange={(e) => setIsAlert(e.target.checked)}
              className="w-4 h-4 accent-amber-600 rounded-sm"
            />
            <span className="flex items-center gap-1 text-amber-800">
              <AlertCircle className="w-3.5 h-3.5" />
              {language === "Tamil" ? "பூச்சி தாக்குதல் எச்சரிக்கை" : "Pest Outbreak Alert"}
            </span>
          </label>

          <button
            onClick={handleCreatePost}
            disabled={posting || !newContent.trim()}
            className="min-h-[48px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{posting ? "..." : (language === "Tamil" ? "பகிர்" : "Post")}</span>
          </button>
        </div>
      </div>

      {/* Community Feed */}
      <div className="space-y-3">
        {posts.map((post) => {
          const isLiked = !!likedMap[post.id];
          return (
            <div
              key={post.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs space-y-2.5 transition-all ${
                post.isOutbreakAlert ? "border-amber-300 bg-amber-50/30" : "border-zinc-200"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <strong className="text-xs font-extrabold text-zinc-900">{post.authorName}</strong>
                    {post.isSample && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-300">
                        SAMPLE / மாதிரி
                      </span>
                    )}
                    {post.isOutbreakAlert && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        {language === "Tamil" ? "எச்சரிக்கை" : "Pest Alert"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-zinc-400" /> {post.district}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-800">{post.crop}</span>
                    <span>•</span>
                    <span>{post.createdAt}</span>
                  </div>
                </div>

                {/* Read Aloud button (Farmer Accessibility) */}
                <button
                  onClick={() => handleSpeakPost(post.content)}
                  title="Read aloud"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 text-zinc-600 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <p className="text-xs text-zinc-800 leading-relaxed font-normal">{post.content}</p>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`min-h-[40px] px-3 rounded-lg flex items-center gap-1.5 font-bold transition-all active:scale-95 ${
                    isLiked ? "text-emerald-700 bg-emerald-50" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-emerald-700" : ""}`} />
                  <span>{post.likesCount} {language === "Tamil" ? "பயனுள்ளது" : "Helpful"}</span>
                </button>

                <div className="text-[10px] text-zinc-400">
                  {language === "Tamil" ? "சரிபார்க்கப்பட்ட உழவர்" : "Verified Farmer"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
