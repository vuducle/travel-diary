'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import api from '@/lib/api/client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getAssetUrl } from '@/lib/utils/image-utils';
import {
  MessageCircle,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

interface Comment {
  id: string;
  content: string;
  user: User;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  tripId: string;
  onCommentCountChange?: (count: number) => void;
}

export default function CommentSection({
  tripId,
  onCommentCountChange,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const user = useSelector((state: RootState) => state.auth.user);
  const { showToast } = useToast();

  const fetchComments = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get(
        `/trips/${tripId}/comments?page=${pageNum}&limit=20`
      );
      const data = response.data;

      // Organize comments into parent-child structure
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data.items.forEach((comment: Comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });
      // Second pass to link replies to parents
      data.items.forEach((comment: Comment) => {
        if (comment.parentId) {
          const parent = commentMap.get(comment.parentId);
          if (parent) {
            parent.replies!.push(commentMap.get(comment.id)!);
          }
          // Update the comment map with the parent having the new reply
        } else {
          rootComments.push(commentMap.get(comment.id)!);
        }
      });

      // Set comments
      if (pageNum === 1) {
        setComments(rootComments);
      } else {
        // Append to existing comments
        setComments((prev) => [...prev, ...rootComments]);
      }

      setHasMore(data.hasNextPage);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      showToast('Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/trips/${tripId}/comments`, {
        content: newComment,
      });

      setComments((prev) => [
        ...prev,
        { ...response.data, replies: [] },
      ]);
      setNewComment('');
      showToast('Comment added!', 'success');
    } catch (error) {
      console.error('Failed to add comment:', error);
      showToast('Failed to add comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit a reply to a comment
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/trips/${tripId}/comments`, {
        content: replyContent,
        parentId,
      });
      // Update comments state to add the reply under the correct parent
      setComments((prev) => {
        const updated = prev.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), response.data],
            };
          }
          return comment;
        });
        // Update the comment count after adding a reply
        onCommentCountChange?.(countAllComments(updated));
        return updated;
      });

      setReplyTo(null);
      setReplyContent('');
      showToast('Reply added!', 'success');
    } catch (error) {
      console.error('Failed to add reply:', error);
      showToast('Failed to add reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      await api.patch(`/trips/comments/${commentId}`, {
        content: editContent,
      });

      const updateCommentInTree = (
        comments: Comment[]
      ): Comment[] => {
        return comments.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, content: editContent };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateCommentInTree(comment.replies),
            };
          }
          return comment;
        });
      };

      setComments((prev) => updateCommentInTree(prev));
      setEditingId(null);
      setEditContent('');
      showToast('Comment updated!', 'success');
    } catch (error) {
      console.error('Failed to update comment:', error);
      showToast('Failed to update comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?'))
      return;

    try {
      await api.delete(`/trips/comments/${commentId}`);

      const removeCommentFromTree = (
        comments: Comment[]
      ): Comment[] => {
        return comments
          .filter((comment) => comment.id !== commentId)
          .map((comment) => ({
            ...comment,
            replies: comment.replies
              ? removeCommentFromTree(comment.replies)
              : [],
          }));
      };

      setComments((prev) => {
        const updated = removeCommentFromTree(prev);
        onCommentCountChange?.(countAllComments(updated));
        return updated;
      });
      showToast('Comment deleted!', 'success');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      showToast('Failed to delete comment', 'error');
    }
  };

  const countAllComments = (comments: Comment[]): number => {
    let count = 0;
    const countRecursive = (comment: Comment) => {
      count++;
      if (comment.replies) {
        comment.replies.forEach(countRecursive);
      }
    };
    comments.forEach(countRecursive);
    return count;
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderComment = (
    comment: Comment,
    isReply: boolean = false
  ) => {
    const isEditing = editingId === comment.id;
    const isReplying = replyTo === comment.id;
    const isOwner = user?.id === comment.user.id;

    return (
      <div
        key={comment.id}
        className={isReply ? 'ml-6 sm:ml-12' : ''}
      >
        <div className="flex gap-3 py-3 items-start">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
            <AvatarImage
              src={getAssetUrl(comment.user.avatarUrl) || undefined}
              alt={comment.user.name}
            />
            <AvatarFallback className="bg-linear-to-br from-blue-400 to-purple-500 text-white text-sm">
              {getUserInitials(comment.user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="font-semibold text-sm text-gray-900">
                    {comment.user.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    @{comment.user.username}
                  </span>
                </div>
                {isOwner && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleDeleteComment(comment.id)
                        }
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                    placeholder="Edit your comment..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditComment(comment.id)}
                      disabled={submitting || !editContent.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 ml-3 sm:ml-4">
              <span className="text-xs text-gray-500">
                {formatDate(comment.createdAt)}
              </span>
              {!isReply && (
                <button
                  onClick={() => {
                    setReplyTo(comment.id);
                    setReplyContent('');
                  }}
                  className="text-xs text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
              )}
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-gray-400">
                  (edited)
                </span>
              )}
            </div>

            {/* Reply Input */}
            {isReplying && (
              <div className="mt-3 ml-3 sm:ml-4">
                <div className="flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.user.name}...`}
                    className="min-h-14 sm:min-h-20 text-sm"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={submitting || !replyContent.trim()}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyTo(null);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Render Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map((reply) =>
                  renderComment(reply, true)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 px-4 sm:px-6">
      {/* Comment Input */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="flex gap-3 items-start">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
            <AvatarImage
              src={getAssetUrl(user?.avatarUrl) || undefined}
              alt={user?.name || 'User'}
            />
            <AvatarFallback className="bg-linear-to-br from-blue-400 to-purple-500 text-white">
              {user?.name ? getUserInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-16 sm:min-h-20 resize-none text-sm"
            />
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-white rounded-2xl shadow-sm">
        {loading && comments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No comments yet</p>
            <p className="text-sm mt-1">Be the first to comment!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="p-4 text-center border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchComments(page + 1)}
            >
              Load more comments
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
