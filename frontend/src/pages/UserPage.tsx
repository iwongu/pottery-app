import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import postService from '../services/postService';
import ProfileDisplay from '../components/ProfileDisplay';
import UserPostCard from '../components/Post/UserPostCard';
import { UserProfile, Post } from '../types';
import styles from './UserPage.module.css'; // Import CSS Module

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
    navigate(`/edit-post/${postId}`); 
  };

  if (isLoading) {
    return <p className={styles.loadingMessage}>Loading user profile...</p>;
  }

  if (error) {
    return <p className={styles.errorMessage}>Error: {error}</p>;
  }

  if (!profile) {
    return <p className={styles.infoMessage}>User not found.</p>;
  }

  const showcasedPostIds = new Set(showcasedPosts.map(p => p.id));
  const nonShowcasedUserPosts = userPosts.filter(p => !showcasedPostIds.has(p.id));

  return (
    <div className={styles.userPageContainer}>
      <ProfileDisplay user={profile} />
      
      {isCurrentUserProfile && token && (
        <Link to="/users/me/edit" className={styles.editProfileButton}>
          Edit Profile
        </Link>
      )}

      <section className={styles.postsSection}>
        <h2>Showcased Posts</h2>
        {showcasedPosts.length > 0 ? (
          <div className={styles.postsGrid}>
            {showcasedPosts.map(post => (
              <UserPostCard
                key={`showcased-${post.id}`}
                post={post}
                isOwner={isCurrentUserProfile}
                onDelete={handleDeletePost}
                onToggleShowcase={handleToggleShowcase}
                onEdit={isCurrentUserProfile ? handleEditPost : undefined}
              />
            ))}
          </div>
        ) : (
          <p className={styles.infoMessage}>This user hasn't showcased any posts yet.</p>
        )}
      </section>

      <section className={styles.postsSection}>
        <h2>All Posts by {profile.name || 'User'}</h2>
        {nonShowcasedUserPosts.length > 0 ? (
          <div className={styles.postsGrid}>
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
          <p className={styles.infoMessage}>This user hasn't created any other posts yet.</p>
        )}
      </section>
    </div>
  );
};

export default UserPage;
