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
    const [loading, setLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/reviews/read.php?product_id=${productId}&sort=${sort}`);
            setReviews(response.data.records || []);
            setStats(response.data.stats || { avg_rating: 0, review_count: 0 });
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [productId, sort]);

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

                        {!isWriting && !reviewToEdit && !hasUserReviewed && (
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-2">Review this product</h4>
                                <p className="text-sm text-gray-500 mb-4">Share your thoughts with other customers</p>
                                <button
                                    onClick={() => setIsWriting(true)}
                                    className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-all shadow-lg shadow-black/5"
                                >
                                    Write a Review
                                </button>
                                <p className="text-xs text-center text-gray-400 mt-2 italic">Only verified purchasers can submit a review</p>
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
