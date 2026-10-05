import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../api/config';
import { ShieldCheck, MessageSquare, Flame, Clock, User, AlertTriangle, Plus, MessageCircle, ThumbsUp, Heart, Smile, Frown, Angry, Trash2, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const REACTION_TYPES = [
  { type: 'like', icon: ThumbsUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  { type: 'heart', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  { type: 'laugh', icon: Smile, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { type: 'sad', icon: Frown, color: 'text-orange-500', bg: 'bg-orange-50' },
  { type: 'angry', icon: Angry, color: 'text-rose-500', bg: 'bg-rose-50' },
];

export default function StudentFreedomWallDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('recent');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isCommentAnonymous, setIsCommentAnonymous] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeReactionMenu, setActiveReactionMenu] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, postId: null, commentId: null });

  const [isPostFormExpanded, setIsPostFormExpanded] = useState(false);
  const [newPostData, setNewPostData] = useState({ title: '', description: '', is_anonymous: false });
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostData.title || !newPostData.description) return;
    
    setIsSubmittingPost(true);
    try {
      const formPayload = new FormData();
      formPayload.append('title', newPostData.title);
      formPayload.append('description', newPostData.description);
      formPayload.append('is_anonymous', newPostData.is_anonymous);
      formPayload.append('location', 'Community Feed');
      formPayload.append('submission_type', 'share_experience');
      formPayload.append('category', 'Other');

      const res = await fetch(API_ENDPOINTS.FW_COMMUNITY_CREATE, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formPayload
      });

      if (res.ok) {
        setNewPostData({ title: '', description: '', is_anonymous: false });
        setIsPostFormExpanded(false);
        fetchCommunityPosts(); // Refresh feed
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const getAvatarUrl = (name, isAnonymous, seedId) => {
    if (isAnonymous) {
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${seedId}&backgroundColor=e6f7f0`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2bd99b&color=003624&bold=true`;
  };

  const handleReaction = async (postId, reactionType) => {
    setActiveReactionMenu(null);
    try {
      const res = await fetch(API_ENDPOINTS.FW_COMMUNITY_REACT(postId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reaction_type: reactionType })
      });
      if (res.ok) {
        // Optimistic refresh
        fetchCommunityPosts();
      }
    } catch (err) {
      console.error("Failed to react", err);
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(API_ENDPOINTS.FW_COMMUNITY_COMMENT(postId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: commentText,
          is_anonymous: isCommentAnonymous
        })
      });
      
      if (res.ok) {
        const newComment = await res.json();
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comments: [...(p.comments || []), newComment],
              comment_count: p.comment_count + 1
            };
          }
          return p;
        }));
        setCommentText('');
        setIsCommentAnonymous(false);
      }
    } catch (err) {
      console.error("Failed to submit comment", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  const handleDeletePost = (postId) => {
    setDeleteModal({ isOpen: true, type: 'post', postId, commentId: null });
  };

  const handleDeleteComment = (postId, commentId) => {
    setDeleteModal({ isOpen: true, type: 'comment', postId, commentId });
  };

  const confirmDelete = async () => {
    const { type, postId, commentId } = deleteModal;
    
    try {
      if (type === 'post') {
        const res = await fetch(API_ENDPOINTS.FW_COMMUNITY_DETAIL(postId), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          setPosts(posts.filter(p => p.id !== postId));
        }
      } else if (type === 'comment') {
        const res = await fetch(API_ENDPOINTS.FW_COMMUNITY_COMMENT_DELETE(commentId), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          setPosts(posts.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                comments: p.comments.filter(c => c.id !== commentId),
                comment_count: p.comment_count - 1
              };
            }
            return p;
          }));
        }
      }
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setDeleteModal({ isOpen: false, type: null, postId: null, commentId: null });
    }
  };
  useEffect(() => {
    if (user?.token) {
      fetchCommunityPosts();
    }
  }, [filter, sort, user?.token]);

  const fetchCommunityPosts = async () => {
    setLoading(true);
    try {
      const url = new URL(API_ENDPOINTS.FW_COMMUNITY, window.location.origin);
      if (filter !== 'All') {
        url.searchParams.append('category', filter);
      }
      url.searchParams.append('sort', sort);

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch community posts", err);
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = [
    'All', 'Professor', 'Subject', 'Administration', 'Student Services',
    'Facilities', 'Safety', 'Welfare', 'Activities', 'Policies', 'Other'
  ];

  return (
    <div className="max-w-[1580px] mx-auto font-pjs animate-in fade-in duration-500 pb-12">
      {/* ─── PREMIUM HERO BANNER ──────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-[1580px] mx-auto rounded-[2.5rem] bg-[#003624] overflow-hidden mb-8 shadow-2xl shadow-emerald-900/20">
        <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#10b981]/10 blur-[80px]"></div>
        
        <div className="relative z-10 px-8 py-10 md:px-12 md:py-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
                    <MessageSquare size={12} /> Student Voice Module
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-pjs font-extrabold text-white tracking-tight mb-3 leading-tight">
                    SWAFO Connect
                </h1>
                <p className="text-emerald-100/80 text-base md:text-lg font-medium leading-relaxed max-w-lg mb-6">
                    Your voice matters. Share your concerns, suggestions, feedback, or ideas with SWAFO securely and privately.
                </p>
            </div>
            
            <div className="hidden lg:flex max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-6 items-start gap-4 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-emerald-100 shrink-0">
                    <ShieldCheck size={20} />
                </div>
                <div>
                    <h4 className="font-pjs font-bold text-white text-base mb-1">Private & Secure</h4>
                    <p className="text-sm text-emerald-100/80 font-medium leading-relaxed">
                        Your submission is strictly private and accessible only by authorized SWAFO Directors. Provide accurate details so we can assist you properly.
                    </p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* MAIN FEED */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* INLINE CREATE POST */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-emerald-50 relative">
            <div className="flex gap-4 items-start">
              <img 
                src={getAvatarUrl(user?.full_name || 'Student', false, 'self')} 
                alt="Your Avatar" 
                className="w-10 h-10 rounded-full border-2 border-emerald-50 shrink-0" 
              />
              <div className="flex-1">
                {!isPostFormExpanded ? (
                  <button 
                    onClick={() => setIsPostFormExpanded(true)}
                    className="w-full text-left bg-slate-50 hover:bg-slate-100 transition-colors rounded-full px-5 py-2.5 text-slate-500 font-medium text-sm border border-slate-100/60"
                  >
                    What's on your mind?
                  </button>
                ) : (
                  <form onSubmit={handleCreatePost} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input 
                      autoFocus
                      type="text" 
                      required
                      placeholder="Post Title..."
                      value={newPostData.title || ""}
                      onChange={e => setNewPostData({...newPostData, title: e.target.value})}
                      className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-[#003624] outline-none focus:ring-2 focus:ring-[#2bd99b] focus:bg-white transition-all placeholder:text-slate-300"
                    />
                    <textarea 
                      required
                      placeholder="Share the details..."
                      value={newPostData.description || ""}
                      onChange={e => setNewPostData({...newPostData, description: e.target.value})}
                      className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#2bd99b] focus:bg-white transition-all min-h-[100px] resize-none placeholder:text-slate-300"
                    ></textarea>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${newPostData.is_anonymous ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-transparent group-hover:bg-slate-300'}`}>
                          <ShieldCheck size={12} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 select-none">Post Anonymously</span>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={newPostData.is_anonymous}
                          onChange={(e) => setNewPostData({...newPostData, is_anonymous: e.target.checked})}
                        />
                      </label>
                      
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => {
                            setIsPostFormExpanded(false);
                            setNewPostData({ title: '', description: '', is_anonymous: false });
                          }}
                          className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmittingPost || !newPostData.title || !newPostData.description}
                          className="flex items-center gap-2 bg-[#003624] text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-[#004d33] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingPost ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Post
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
          
          {/* Feed Navigation */}
          <div className="bg-white rounded-[1.5rem] p-2 shadow-sm border border-emerald-50 flex overflow-x-auto hide-scrollbar">
            <button onClick={() => setSort('recent')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${sort === 'recent' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Clock size={16} /> Recent
            </button>
            <button onClick={() => setSort('popular')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${sort === 'popular' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Flame size={16} /> Popular
            </button>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-white/50 rounded-[2rem] border border-dashed border-emerald-200">
                <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold text-sm">Loading community posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-white/50 rounded-[2rem] border border-dashed border-emerald-200">
                <div className="w-16 h-16 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-extrabold text-[#003624] mb-2">No posts found</h3>
                <p className="text-slate-500 font-medium text-sm mb-6 max-w-sm">
                  {filter === 'All' ? 'Be one of the first students to share something with the community.' : `No posts in the ${filter} category yet.`}
                </p>
                {filter === 'All' && (
                  <button 
                    onClick={() => navigate('/student/freedom-wall/post')}
                    className="text-emerald-700 font-bold text-sm hover:text-emerald-800 transition-colors inline-flex items-center gap-1.5 bg-emerald-50 px-5 py-2.5 rounded-xl hover:bg-emerald-100"
                  >
                    <Plus size={16} /> Make a Post
                  </button>
                )}
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-white rounded-[2rem] p-7 border border-emerald-50 shadow-sm transition-all overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getAvatarUrl(post.author_name, post.is_anonymous, post.id)} 
                        alt="avatar" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-emerald-50"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-slate-700 flex items-center gap-1">
                            {post.is_anonymous ? <ShieldCheck size={14} className="text-emerald-500" /> : <User size={14} className="text-slate-400" />}
                            {post.author_name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 ml-1">{new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {post.is_owner && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Post"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <h3 className="text-[22px] font-extrabold text-[#003624] mb-3 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-slate-600 font-medium text-[15px] leading-relaxed mb-6 whitespace-pre-wrap">
                    {post.description}
                  </p>
                  
                  <div className="border-t border-slate-100 pt-3 mt-2">
                    {/* Top Reactions & Reactor List Toggle */}
                    {post.reactions && post.reactions.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 px-2 group/reactors relative cursor-pointer">
                        <div className="flex -space-x-1">
                          {[...new Set(post.reactions.map(r => r.reaction_type))].slice(0, 3).map((type, i) => {
                            const reactConf = REACTION_TYPES.find(r => r.type === type);
                            if (!reactConf) return null;
                            const Icon = reactConf.icon;
                            return (
                              <div key={type} className={`w-5 h-5 rounded-full ${reactConf.bg} flex items-center justify-center border border-white z-[${3-i}]`}>
                                <Icon size={10} className={reactConf.color} />
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-xs font-bold text-slate-500 hover:text-slate-700">{post.reactions.length}</span>
                        
                        {/* Reactor List Tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 invisible group-hover/reactors:opacity-100 group-hover/reactors:visible transition-all z-50 shadow-xl">
                          <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                            {post.reactions.map(r => (
                              <div key={r.id} className="flex items-center justify-between">
                                <span className="font-medium truncate pr-2">{r.user_name}</span>
                                {REACTION_TYPES.find(rt => rt.type === r.reaction_type) && (
                                  <span className={REACTION_TYPES.find(rt => rt.type === r.reaction_type).color}>
                                    {React.createElement(REACTION_TYPES.find(rt => rt.type === r.reaction_type).icon, { size: 12 })}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="relative" onMouseLeave={() => setActiveReactionMenu(null)}>
                        {/* Hover Menu */}
                        <div className={`absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border border-slate-100 p-1.5 flex gap-1 transition-all duration-200 z-50 ${activeReactionMenu === post.id ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible translate-y-2 scale-95'}`}>
                          {REACTION_TYPES.map(react => (
                            <button
                              key={react.type}
                              onClick={() => handleReaction(post.id, react.type)}
                              className={`p-2 rounded-full hover:${react.bg} transition-all hover:scale-125 active:scale-95 group/btn`}
                            >
                              <react.icon size={20} className={`${react.color} drop-shadow-sm`} />
                            </button>
                          ))}
                        </div>
                        
                        {/* Main Reaction Button */}
                        <button 
                          onMouseEnter={() => setActiveReactionMenu(post.id)}
                          onClick={() => handleReaction(post.id, 'like')}
                          className="flex items-center gap-2 text-slate-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors active:scale-95"
                        >
                          {(() => {
                            const userReaction = post.reactions?.find(r => r.user_name === user.name);
                            if (userReaction) {
                              const rConf = REACTION_TYPES.find(rt => rt.type === userReaction.reaction_type);
                              const Icon = rConf ? rConf.icon : ThumbsUp;
                              return (
                                <>
                                  <Icon size={18} className={rConf ? rConf.color : 'text-blue-500'} />
                                  <span className={rConf ? rConf.color : 'text-blue-500 capitalize'}>{rConf ? rConf.type : 'Like'}</span>
                                </>
                              );
                            }
                            return (
                              <>
                                <ThumbsUp size={18} /> Like
                              </>
                            );
                          })()}
                        </button>
                      </div>
                    <button 
                      onClick={() => {
                        if (expandedPostId === post.id) {
                          setExpandedPostId(null);
                        } else {
                          setExpandedPostId(post.id);
                          setCommentText('');
                          setIsCommentAnonymous(false);
                        }
                      }}
                      className="flex items-center gap-2 text-slate-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                    >
                      <MessageCircle size={16} /> {post.comment_count} Comments
                    </button>
                  </div>
                </div>

                  {/* COMMENTS SECTION */}
                  {expandedPostId === post.id && (
                    <div className="mt-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                      <h4 className="text-[13px] font-black uppercase tracking-widest text-slate-400 mb-4">Comments</h4>
                      
                      <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(!post.comments || post.comments.length === 0) ? (
                          <p className="text-sm text-slate-500 font-medium italic text-center py-4 bg-slate-50 rounded-xl">No comments yet. Be the first to share your thoughts!</p>
                        ) : (
                          post.comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                              <img 
                                src={getAvatarUrl(comment.author_name, comment.is_anonymous, comment.id + 'c')} 
                                alt="avatar" 
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 mt-1"
                              />
                              <div className="bg-slate-50 rounded-2xl rounded-tl-none p-4 flex-1 group/comment relative">
                                <div className="flex items-baseline justify-between mb-1">
                                  <span className="text-[13px] font-bold text-slate-700 flex items-center gap-1">
                                    {comment.is_anonymous && <ShieldCheck size={12} className="text-emerald-500" />}
                                    {comment.author_name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {comment.is_owner && (
                                      <button
                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100"
                                        title="Delete Comment"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(comment.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* ADD COMMENT FORM */}
                      <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-3 items-start">
                        <img 
                          src={getAvatarUrl(isCommentAnonymous ? "Anonymous" : user.name, isCommentAnonymous, 'preview')} 
                          alt="avatar" 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div className="flex-1 space-y-2">
                          <textarea 
                            required
                            placeholder="Write a comment..."
                            value={commentText || ""}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#2bd99b] focus:bg-white transition-all min-h-[44px] resize-none"
                            rows={2}
                          ></textarea>
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${isCommentAnonymous ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-transparent group-hover:bg-slate-300'}`}>
                                <ShieldCheck size={12} />
                              </div>
                              <span className="text-[12px] font-bold text-slate-500 group-hover:text-slate-700">Comment Anonymously</span>
                            </label>
                            <button 
                              type="submit" 
                              disabled={isSubmittingComment || !commentText.trim()}
                              className="bg-[#003624] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-[#004d33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-[#003624] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-900/10 hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <h3 className="text-2xl font-extrabold mb-3 relative z-10">Share Your Voice</h3>
            <p className="text-emerald-50 text-[15px] font-medium mb-8 relative z-10 leading-relaxed opacity-90">
              Have something you'd like SWAFO to know? Report an issue or suggest an improvement anonymously.
            </p>
            <button 
              onClick={() => navigate('/student/freedom-wall/submit')}
              className="w-full bg-[#2bd99b] text-[#003624] py-4 rounded-xl font-bold text-[15px] hover:bg-[#1bc689] transition-colors flex items-center justify-center gap-2 relative z-10 shadow-lg shadow-emerald-900/20"
            >
              <AlertTriangle size={18} /> Submit a Report
            </button>
          </div>

          <div className="bg-white rounded-[2rem] p-7 border border-emerald-50 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" /> Community Guidelines
            </h3>
            <div className="space-y-4">
              <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
                Keep discussions respectful, constructive, and relevant to student life.
              </p>
              <p className="text-[14px] text-slate-600 font-medium leading-relaxed bg-red-50 p-4 rounded-xl text-red-800 border border-red-100">
                Hate speech, bullying, and inappropriate content will be removed.
              </p>
            </div>
          </div>
        </div>
      </div>
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">Delete {deleteModal.type === 'post' ? 'Post' : 'Comment'}?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Are you sure you want to delete this {deleteModal.type}? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteModal({ isOpen: false, type: null, postId: null, commentId: null })}
                  className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3.5 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
