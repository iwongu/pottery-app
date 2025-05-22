import React, { useEffect, useState } from 'react';
import PostCard from '../components/Post/PostCard'; // Assuming you might use it here
import { getHomepagePosts } from '../services/postService';
import { Post } from '../types';

const HomePage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                const homepagePosts = await getHomepagePosts();
                setPosts(homepagePosts);
            } catch (err) {
                console.error("Failed to fetch homepage posts:", err);
                setError("Could not load posts. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);
    return (
        <div>
            <h1>Welcome to the Pottery Class App!</h1>
            <p>Here you'll see showcases of amazing pottery projects.</p>
            {loading && <p>Loading posts...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div className="posts-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
};

export default HomePage;