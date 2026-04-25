import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import { API_BASE_URL } from '../config';

const ReviewSection = ({ productId, userId, userName }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ avg_rating: 0, review_count: 0 });
    const [sort, setSort] = useState('latest');
    const [isWriting, setIsWriting] = useState(false);
    const [reviewToEdit, setReviewToEdit] = useState(null);
    const [canReview, setCanReview] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        try {
            const url = `${API_BASE_URL}/reviews/read.php?product_id=${productId}&sort=${sort}${userId ? `&user_id=${userId}` : ''}`;
            const response = await axios.get(url);
            setReviews(response.data.records || []);
            setStats(response.data.stats || { avg_rating: 0, review_count: 0 });
            setCanReview(response.data.can_review || false);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [productId, sort, userId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            await axios.post(`${API_BASE_URL}/reviews/delete.php`, {
                id,
                user_id: userId
            });
            fetchReviews();
        } catch (error) {
            alert('Error deleting review');
        }
    };

    const handleSuccess = () => {
        setIsWriting(false);
        setReviewToEdit(null);
        fetchReviews();
    };

    const hasUserReviewed = reviews.some(r => parseInt(r.user_id) === parseInt(userId));

    return (
        <section className="mt-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Summary and Form */}
                <div className="lg:col-span-1 border-r-0 lg:border-r border-gray-100 pr-0 lg:pr-12">
                    <div className="sticky top-24 space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
                            <div className="flex items-center gap-4">
                                <div className="text-5xl font-extrabold text-black">
                                    {parseFloat(stats.avg_rating).toFixed(1)}
                                </div>
                                <div className="flex flex-col">
                                    <StarRating rating={Math.round(stats.avg_rating)} size={24} />
                                    <span className="text-sm text-gray-500 mt-1">Based on {stats.review_count} ratings</span>
                                </div>
                            </div>
                        </div>

                        {!isWriting && !reviewToEdit && (
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                {hasUserReviewed ? (
                                    <>
                                        <h4 className="font-semibold text-gray-900 mb-2">You've reviewed this</h4>
                                        <p className="text-sm text-gray-500">Thank you for your feedback!</p>
                                    </>
                                ) : canReview ? (
                                    <>
                                        <h4 className="font-semibold text-gray-900 mb-2">Review this product</h4>
                                        <p className="text-sm text-gray-500 mb-4">Share your thoughts with other customers</p>
                                        <button
                                            onClick={() => setIsWriting(true)}
                                            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-all shadow-lg shadow-black/5"
                                        >
                                            Write a Review
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="font-semibold text-gray-400 mb-2">Review Restricted</h4>
                                        <p className="text-xs text-gray-400 italic">
                                            Only verified purchasers of this item can submit a review.
                                        </p>
                                        {!userId && (
                                            <p className="text-[10px] text-gray-400 mt-2">Please log in to check your eligibility.</p>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {(isWriting || reviewToEdit) && (
                            <ReviewForm
                                productId={productId}
                                userId={userId}
                                reviewToEdit={reviewToEdit}
                                onSuccess={handleSuccess}
                                onCancel={() => { setIsWriting(false); setReviewToEdit(null); }}
                            />
                        )}
                    </div>
                </div>

                {/* Right Column: List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                        </div>
                    ) : (
                        <ReviewList
                            reviews={reviews}
                            currentUserId={userId}
                            currentSort={sort}
                            onSortChange={setSort}
                            onEdit={(review) => { setReviewToEdit(review); setIsWriting(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </div>
        </section>
    );
};

export default ReviewSection;
