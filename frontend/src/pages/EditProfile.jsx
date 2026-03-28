import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const EditProfile = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    // State for form fields
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        bio: '',
        phone: '',
        website: '',
        calendarUrl: '',
        // Note: displayEmail is separate from the account email for now, or just use email
        displayEmail: '',
    });

    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            // Fetch latest data from backend to ensure we have everything
            fetch(`${API_BASE_URL}/user/me.php?id=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    setFormData({
                        name: data.name || '',
                        location: data.location || '',
                        bio: data.bio || '',
                        phone: data.phone || '',
                        website: data.website || '',
                        calendarUrl: data.calendar_url || '', // Note snake_case from API
                        displayEmail: data.email || '', // Using account email as default display email
                    });
                })
                .catch(err => {
                    console.error("Failed to fetch user profile", err);
                    setError('Failed to load profile data.');
                });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'bio' && value.length > 1024) return; // Character limit check
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAvatarLoading(true);
        setError('');

        const uploadData = new FormData();
        uploadData.append('avatar', file);
        uploadData.append('id', user.id);

        try {
            const response = await fetch(`${API_BASE_URL}/user/upload_avatar.php`, {
                method: 'POST',
                body: uploadData,
            });

            const data = await response.json();

            if (response.ok) {
                // Update context immediately with new avatar URL
                updateUser({ avatar: data.avatar_url });
                setSuccessMessage('Avatar uploaded successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.message || 'Failed to upload avatar.');
            }
        } catch (err) {
            console.error("Upload error:", err);
            setError('An error occurred while uploading. Please try again.');
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleDeleteAvatar = () => {
        // Placeholder for delete avatar logic
        console.log("Delete avatar clicked");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/user/update.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: user.id,
                    name: formData.name,
                    location: formData.location,
                    bio: formData.bio,
                    phone: formData.phone,
                    website: formData.website,
                    calendar_url: formData.calendarUrl,
                    // Avatar handling would require a separate upload endpoint or base64
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('Profile updated successfully!');
                // Update context
                updateUser({
                    name: formData.name,
                    location: formData.location,
                    bio: formData.bio,
                    phone: formData.phone,
                    website: formData.website,
                    calendarUrl: formData.calendarUrl
                });
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.message || 'Failed to update profile.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500">Please log in to edit your profile.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
                {/* Basic Information Section */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-white">
                        <h1 className="text-2xl font-bold text-gray-900">Basic Information</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Update your photo and personal details.
                        </p>
                    </div>

                    <div className="px-8 py-8 space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center space-x-6">
                            <div className="shrink-0">
                                {user.avatar ? (
                                    <img className="h-20 w-20 object-cover rounded-full border border-gray-200" src={user.avatar} alt="Current profile" />
                                ) : (
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl border border-gray-200">
                                        {user.name ? user.name.charAt(0).toUpperCase() : ''}
                                    </div>
                                )}
                            </div>
                            <div className="flex space-x-3">
                                <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                                    {avatarLoading ? 'Uploading...' : 'Upload new picture'}
                                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={avatarLoading} />
                                </label>
                                <button
                                    type="button"
                                    onClick={handleDeleteAvatar}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                placeholder="Your Name"
                            />
                        </div>

                        {/* Location Field */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="location"
                                    id="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                                    placeholder="City, Country"
                                />
                            </div>
                        </div>

                        {/* Bio Field */}
                        <div>
                            <div className="flex justify-between">
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                    Bio
                                </label>
                                <span className="text-xs text-gray-500">
                                    {formData.bio.length}/1024
                                </span>
                            </div>
                            <div className="mt-1">
                                <textarea
                                    id="bio"
                                    name="bio"
                                    rows={4}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
                                    placeholder="Write a few lines about yourself."
                                    value={formData.bio}
                                    onChange={handleChange}
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Brief description for your profile.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Details Section */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    {/* Header Section */}
                    <div className="px-8 py-6 border-b border-gray-100 bg-white">
                        <h1 className="text-2xl font-bold text-gray-900">Contact Details</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your public contact information.
                        </p>
                    </div>

                    {/* Informational Banner */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 m-8 mb-0 rounded-r-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    You can add and display your contact details as a Designer Advertiser.
                                    <a href="#" className="font-medium underline text-blue-700 hover:text-blue-600 ml-1">
                                        Learn more
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="px-8 py-8 space-y-6">
                        {successMessage && (
                            <div className="mb-4 p-4 rounded-md bg-green-50 text-green-700 border border-green-200">
                                {successMessage}
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            {/* Display Email */}
                            <div className="sm:col-span-4">
                                <label htmlFor="displayEmail" className="block text-sm font-medium text-gray-700 mb-1">
                                    Display Email
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        type="email"
                                        name="displayEmail"
                                        id="displayEmail"
                                        value={formData.displayEmail}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 sm:text-sm border-gray-300 rounded-md py-2 border"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    This email will be displayed publicly.
                                </p>
                            </div>

                            {/* Phone Number */}
                            <div className="sm:col-span-4">
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            {/* Website */}
                            <div className="sm:col-span-6">
                                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                                    Website
                                </label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                        https://
                                    </span>
                                    <input
                                        type="text"
                                        name="website"
                                        id="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300 py-2 px-3 border"
                                        placeholder="www.example.com"
                                    />
                                </div>
                            </div>

                            {/* Calendar URL */}
                            <div className="sm:col-span-6">
                                <label htmlFor="calendarUrl" className="block text-sm font-medium text-gray-700 mb-1">
                                    Calendar URL
                                </label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="url"
                                        name="calendarUrl"
                                        id="calendarUrl"
                                        value={formData.calendarUrl}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300 py-2 px-3 border"
                                        placeholder="https://calendly.com/your-link"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Actions */}
                        <div className="pt-5 border-t border-gray-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
