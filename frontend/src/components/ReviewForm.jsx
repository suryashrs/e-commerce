import React, { useState } from 'react';
import StarRating from './StarRating';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ReviewForm = ({ productId, userId, reviewToEdit = null, onSuccess, onCancel }) => {
    const [rating, setRating] = useState(reviewToEdit ? reviewToEdit.rating : 5); // Default to 5 stars
    const [comment, setComment] = useState(reviewToEdit ? reviewToEdit.comment : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }
        if (comment.trim() === '') {
            setError('Please write a comment');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const endpoint = reviewToEdit 
                ? `${API_BASE_URL}/reviews/update.php`
                : `${API_BASE_URL}/reviews/create.php`;
            
            const payload = {
                user_id: userId,
                product_id: productId,
                rating,
                comment,
                ...(reviewToEdit && { id: reviewToEdit.id })
            };

            const response = await axios.post(endpoint, payload);
            console.log("Review API Response:", response.data);
            
            if (response.status === 200 || response.status === 201) {
                onSuccess();
            } else {
                setError(response.data?.message || 'Failed to submit review. Please try again.');
            }
        } catch (err) {
            console.error("Review Submission Error:", err);
            setError(err.response?.data?.message || 'Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-gray-800">
                {reviewToEdit ? 'Edit Your Review' : 'Write a Review'}
            </h3>
            
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Rating</label>
                <StarRating rating={rating} setRating={setRating} interactive={true} size={28} />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Your Comment</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 resize-none h-32"
                    placeholder="Tell us what you think about this product..."
                />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 mt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : (reviewToEdit ? 'Update Review' : 'Post Review')}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default ReviewForm;
