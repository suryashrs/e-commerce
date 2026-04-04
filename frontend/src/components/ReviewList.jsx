import React from 'react';
import StarRating from './StarRating';
import { Trash2, Edit2, ThumbsUp, BadgeCheck, MessageSquare } from 'lucide-react';

const ReviewList = ({ reviews, currentUserId, onEdit, onDelete, onSortChange, currentSort }) => {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-gray-900">{reviews.length} Reviews</h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <select
                        value={currentSort}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="text-sm font-medium focus:outline-none cursor-pointer bg-transparent border-none"
                    >
                        <option value="latest">Latest</option>
                        <option value="highest">Highest Rating</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-6">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                                    {review.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{review.user_name}</span>
                                        <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                            <BadgeCheck size={12} />
                                            <span>Verified Purchase</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(review.created_at).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <StarRating rating={review.rating} size={16} />
                            </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                        {review.seller_reply && (
                            <div className="mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-widest">
                                    <MessageSquare size={14} className="text-black" />
                                    <span>Seller Response</span>
                                    <span className="text-gray-400 font-medium ml-auto">
                                        {new Date(review.seller_reply_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 italic leading-relaxed">
                                    "{review.seller_reply}"
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
                                <ThumbsUp size={16} />
                                <span>Helpful</span>
                            </button>
                            
                            {parseInt(currentUserId) === parseInt(review.user_id) && (
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => onEdit(review)}
                                        className="text-gray-400 hover:text-black transition-colors flex items-center gap-1 text-sm"
                                    >
                                        <Edit2 size={16} />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => onDelete(review.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm"
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewList;
