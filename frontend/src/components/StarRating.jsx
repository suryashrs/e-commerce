import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, setRating, interactive = false, size = 20 }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={size}
                    className={`${
                        interactive ? 'cursor-pointer transition-colors duration-200' : ''
                    } ${
                        star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                    } ${
                        interactive && star > rating ? 'hover:text-yellow-200' : ''
                    }`}
                    onClick={() => interactive && setRating(star)}
                />
            ))}
        </div>
    );
};

export default StarRating;
