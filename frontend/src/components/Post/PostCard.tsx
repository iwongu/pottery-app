import React from 'react';
import { Post } from '../../types';

interface PostCardProps {
    post: Post;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const imageUrl = post.image_filename ? `${API_BASE_URL}/uploads/images/${post.image_filename}` : undefined;

    return (
        <div style={{ border: '1px solid #ccc', margin: '10px', padding: '10px', borderRadius: '8px' }}>
            <h2>{post.title}</h2>
            <p><small>By: {post.owner.email} on {new Date(post.created_at).toLocaleDateString()}</small></p>
            {imageUrl && (
                <img 
                    src={imageUrl} 
                    alt={post.title} 
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover' }} 
                />
            )}
            {post.text_content && <p>{post.text_content}</p>}
            <div>
                <span>Likes: {post.like_count}</span>
                {/* Add Like button and comment section trigger here */}
            </div>
            {/* Potentially link to PostDetailPage */}
        </div>
    );
};

export default PostCard;