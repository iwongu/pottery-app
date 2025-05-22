import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import postService from '../services/postService';
import ProfileDisplay from '../components/ProfileDisplay';
import UserPostCard from '../components/Post/UserPostCard';
import { UserProfile, Post } from '../types';

const UserPage: React.FC = () => {
  const { userId: routeUserId } = useParams<{ userId: string }>(); // userId from route params
  const { user: authUser, token } = useAuth(); // Authenticated user
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [showcasedPosts, setShowcasedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState<boolean>(false);

  // Determine the actual user ID to fetch data for (could be 'me' or a specific ID)
  const effectiveUserId = routeUserId === 'me' && authUser ? String(authUser.id) : routeUserId;

  const fetchData = useCallback(async () => {
    if (!effectiveUserId) {
      setError("User ID not found.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Parallel fetching
      const [profileData, allPostsData, showcasedData] = await Promise.all([
        userService.getUserProfile(effectiveUserId),
        postService.getUserPosts(effectiveUserId), // Filters client-side for now
        postService.getShowcasedPosts(effectiveUserId),
      ]);

      setProfile(profileData);
      setUserPosts(allPostsData);
      setShowcasedPosts(showcasedData);
      setIsCurrentUserProfile(authUser?.id === profileData?.id);

    } catch (err: any) {
      console.error('Error fetching user page data:', err);
      setError(err.message || 'Failed to load user data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, authUser]); // Add authUser to dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Use fetchData in dependency array

  const handleDeletePost = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      // Refetch or filter locally
      setUserPosts(prevPosts => prevPosts.filter(p => String(p.id) !== postId));
      setShowcasedPosts(prevPosts => prevPosts.filter(p => String(p.id) !== postId));
      // Add user feedback (e.g., toast notification)
    } catch (err) {
      console.error('Failed to delete post:', err);
      setError('Failed to delete post. Please try again.');
      // Add user feedback
    }
  };

  const handleToggleShowcase = async (postId: string, isCurrentlyShowcased: boolean) => {
    try {
      const updatedPost = isCurrentlyShowcased
        ? await postService.unshowcasePost(postId)
        : await postService.showcasePost(postId);
      
      // Refetch or update locally for better UX
      // For simplicity here, refetch all data. Could be optimized.
      fetchData(); 
      // More optimized update:
      // setUserPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
      // setShowcasedPosts(prev => 
      //   updatedPost.is_showcased 
      //     ? [...prev.filter(p => p.id !== updatedPost.id), updatedPost] 
      //     : prev.filter(p => p.id !== updatedPost.id)
      // );

    } catch (err) {
      console.error('Failed to toggle showcase status:', err);
      setError('Failed to update showcase status. Please try again.');
    }
  };

  const handleEditPost = (postId: string) => {
    // Navigate to an edit post page (this page needs to be created)
    // For now, we'll assume a route like /edit-post/:postId
    navigate(`/edit-post/${postId}`); 
    // Or if you have a modal for editing, trigger it here.
  };

  if (isLoading) {
    return <p>Loading user profile...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!profile) {
    return <p>User not found.</p>;
  }

  // Filter out showcased posts from the "All Posts" list to avoid duplication if desired
  // Or, display all and let the card show its status.
  // For this example, let's filter them out from the "All Posts" list.
  const showcasedPostIds = new Set(showcasedPosts.map(p => p.id));
  const nonShowcasedUserPosts = userPosts.filter(p => !showcasedPostIds.has(p.id));

  return (
    <div className="user-page-container">
      <ProfileDisplay user={profile} />
      
      {isCurrentUserProfile && token && (
        <Link to="/users/me/edit" className="edit-profile-button" style={{display: 'inline-block', marginBottom: '20px', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Edit Profile
        </Link>
      )}

      <section className="posts-section">
        <h2>Showcased Posts</h2>
        {showcasedPosts.length > 0 ? (
          <div className="posts-grid">
            {showcasedPosts.map(post => (
              <UserPostCard
                key={`showcased-${post.id}`}
                post={post}
                isOwner={isCurrentUserProfile}
                onDelete={handleDeletePost}
                onToggleShowcase={handleToggleShowcase}
                onEdit={isCurrentUserProfile ? handleEditPost : undefined} // Only pass onEdit if owner
              />
            ))}
          </div>
        ) : (
          <p>This user hasn't showcased any posts yet.</p>
        )}
      </section>

      <section className="posts-section">
        <h2>All Posts by {profile.name || 'User'}</h2>
        {nonShowcasedUserPosts.length > 0 ? (
          <div className="posts-grid">
            {nonShowcasedUserPosts.map(post => (
              <UserPostCard
                key={`userpost-${post.id}`}
                post={post}
                isOwner={isCurrentUserProfile}
                onDelete={handleDeletePost}
                onToggleShowcase={handleToggleShowcase}
                onEdit={isCurrentUserProfile ? handleEditPost : undefined}
              />
            ))}
          </div>
        ) : (
          <p>This user hasn't created any other posts yet.</p>
        )}
        {/* If userPosts was not filtered, and showcased posts are also in userPosts: */}
        {/* {userPosts.length > 0 ? (
          <div className="posts-grid">
            {userPosts.map(post => (
              <UserPostCard
                key={post.id}
                post={post}
                isOwner={isCurrentUserProfile}
                onDelete={handleDeletePost}
                onToggleShowcase={handleToggleShowcase}
                onEdit={handleEditPost}
              />
            ))}
          </div>
        ) : (
          <p>This user has no posts.</p>
        )} */}
      </section>
      <style jsx>{`
        .user-page-container {
          padding: 20px;
        }
        .posts-section {
          margin-top: 30px;
        }
        .posts-section h2 {
          margin-bottom: 15px;
          border-bottom: 2px solid #eee;
          padding-bottom: 5px;
        }
        .posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .edit-profile-button { /* Example style */
          /* styles already applied inline for simplicity */
        }
      `}</style>
    </div>
  );
};

export default UserPage;
