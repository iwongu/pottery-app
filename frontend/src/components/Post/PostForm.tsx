import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../../services/postService';
import { PostCreateData } from '../../types';

const PostForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImage(event.target.files[0]);
        } else {
            setImage(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const postData: PostCreateData = { title, text_content: textContent };
        if (image) {
            postData.image = image;
        }

        try {
            const newPost = await createPost(postData);
            setSuccess(`Post "${newPost.title}" created successfully!`);
            // Clear form
            setTitle('');
            setTextContent('');
            setImage(null);
            // Optionally navigate to the new post or homepage
            setTimeout(() => navigate(`/`), 2000); // Or navigate(`/posts/${newPost.id}`) if you have a post detail page
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    // Format FastAPI validation errors
                    const messages = err.response.data.detail.map((detailItem: any) => {
                        const field = detailItem.loc && detailItem.loc.length > 1 ? detailItem.loc[1] : 'Error';
                        return `${field}: ${detailItem.msg}`;
                    }).join('; ');
                    setError(messages);
                } else {
                    setError(String(err.response.data.detail));
                }
            } else {
                setError('Failed to create post. Please try again.');
            }
            console.error("Create post error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Create a New Post</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            <div>
                <label htmlFor="post-title">Title:</label>
                <input
                    type="text"
                    id="post-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="post-text">Story/Content:</label>
                <textarea
                    id="post-text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={5}
                />
            </div>
            <div>
                <label htmlFor="post-image">Image (optional):</label>
                <input type="file" id="post-image" accept="image/*" onChange={handleImageChange} />
            </div>
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Post'}
            </button>
        </form>
    );
};

export default PostForm;