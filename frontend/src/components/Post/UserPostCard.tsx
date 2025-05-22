import React from 'react';
import { Post } from '../../types'; // Import the main Post type

interface UserPostCardProps {
  post: Post; // Uses the main Post type which should include image_url
  isOwner: boolean;
  onEdit?: (postId: string) => void; // Optional onEdit
  onDelete: (postId: string) => Promise<void>;
  onToggleShowcase: (postId: string, isCurrentlyShowcased: boolean) => Promise<void>;
  // uploadsBaseUrl is no longer needed if post.image_url is provided by the service
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
  // const defaultPostImage = '/path/to/default-post-placeholder.png'; // For if no image_url

  const handleDelete = async () => {
    // Add confirmation dialog before deleting
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await onDelete(String(post.id));
      } catch (error) {
        console.error('Failed to delete post:', error);
        // Handle error display to user, e.g., a toast notification
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

  return (
    <div className="user-post-card">
      {imageUrl ? (
        <img src={imageUrl} alt={post.title} className="post-image" />
      ) : (
        <div className="post-image-placeholder">
          <span>No Image Available</span>
        </div>
      )}
      <div className="post-content">
        <h4>{post.title}</h4>
        {/* Display text_content snippet if available */}
        {post.text_content && (
            <p className="post-text-snippet">
                {post.text_content.substring(0, 100)}{post.text_content.length > 100 ? '...' : ''}
            </p>
        )}
        {isOwner && (
          <div className="post-actions">
            {onEdit && <button onClick={handleEdit} className="action-button edit-button">Edit</button>}
            <button onClick={handleDelete} className="action-button delete-button">Delete</button>
            <button 
              onClick={handleToggleShowcase} 
              className={`action-button showcase-button ${post.is_showcased ? 'unshowcase' : ''}`}
            >
              {post.is_showcased ? 'Un-showcase' : 'Showcase'}
            </button>
          </div>
        )}
      </div>
      <style jsx>{`
        .user-post-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 15px;
          background-color: #fff;
        }
        .post-text-snippet {
          font-size: 0.9em;
          color: #555;
          margin-bottom: 10px;
        }
        .post-image, .post-image-placeholder {
          width: 100%;
          height: 180px; /* Adjust as needed */
          object-fit: cover;
          background-color: #f0f0f0; /* For placeholder */
          display: flex; /* For placeholder text centering */
          align-items: center; /* For placeholder text centering */
          justify-content: center; /* For placeholder text centering */
          color: #aaa; /* For placeholder text */
        }
        .post-content {
          padding: 10px;
        }
        .post-content h4 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.1em;
        }
        .post-actions {
          display: flex;
          gap: 8px; /* Space between buttons */
          margin-top: 10px; /* Add some space above action buttons */
        }
        .action-button {
          padding: 6px 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
        }
        .edit-button {
          background-color: #ffc107; /* Amber */
          color: black;
        }
        .delete-button {
          background-color: #f44336; /* Red */
          color: white;
        }
        .showcase-button {
          background-color: #2196F3; /* Blue */
          color: white;
        }
        .showcase-button.unshowcase {
          background-color: #757575; /* Grey */
        }
        .action-button:hover {
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
};

export default UserPostCard;
