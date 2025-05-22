import React from 'react';
import { Post } from '../../types';
import styles from './UserPostCard.module.css'; // Import CSS Module

interface UserPostCardProps {
  post: Post;
  isOwner: boolean;
  onEdit?: (postId: string) => void;
  onDelete: (postId: string) => Promise<void>;
  onToggleShowcase: (postId: string, isCurrentlyShowcased: boolean) => Promise<void>;
}

const UserPostCard: React.FC<UserPostCardProps> = ({
  post,
  isOwner,
  onEdit,
  onDelete,
  onToggleShowcase,
}) => {
  // post.image_url is expected to be the full URL constructed by the service
  const imageUrl = post.image_url; 
  // const defaultPostImage = '/path/to/default-post-placeholder.png';

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await onDelete(String(post.id));
      } catch (error) {
        console.error('Failed to delete post:', error);
        alert('Error deleting post. Please try again.');
      }
    }
  };

  const handleToggleShowcase = async () => {
    try {
      await onToggleShowcase(String(post.id), !!post.is_showcased);
    } catch (error) {
      console.error('Failed to toggle showcase status:', error);
      alert('Error updating showcase status. Please try again.');
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(String(post.id));
    }
  };

  const showcaseButtonClasses = [
    styles.actionButton,
    styles.showcaseButton,
    post.is_showcased ? styles.unshowcase : ''
  ].join(' ').trim();

  return (
    <div className={styles.userPostCard}>
      {imageUrl ? (
        <img src={imageUrl} alt={post.title} className={styles.postImage} />
      ) : (
        <div className={styles.postImagePlaceholder}>
          <span>No Image Available</span>
        </div>
      )}
      <div className={styles.postContent}>
        <h4>{post.title}</h4>
        {post.text_content && (
            <p className={styles.postTextSnippet}>
                {post.text_content.substring(0, 100)}{post.text_content.length > 100 ? '...' : ''}
            </p>
        )}
        {isOwner && (
          <div className={styles.postActions}>
            {onEdit && <button onClick={handleEdit} className={`${styles.actionButton} ${styles.editButton}`}>Edit</button>}
            <button onClick={handleDelete} className={`${styles.actionButton} ${styles.deleteButton}`}>Delete</button>
            <button 
              onClick={handleToggleShowcase} 
              className={showcaseButtonClasses}
            >
              {post.is_showcased ? 'Un-showcase' : 'Showcase'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPostCard;
