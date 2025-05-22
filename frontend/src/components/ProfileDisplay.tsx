import React from 'react';
import { UserProfile } from '../../types'; // Import UserProfile type

interface ProfileDisplayProps {
  user: UserProfile | null; // User can be null if not loaded or not found
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ user }) => {
  // Define a path to a generic placeholder image in your public folder or import it
  const defaultProfileImage = '/images/default-profile-placeholder.png'; 

  if (!user) {
    // Or a more sophisticated loading spinner, or return null to render nothing
    return <p>Loading profile information...</p>; 
  }

  // User object is available, destructure its properties
  const { name, bio, profile_photo_url } = user;

  return (
    <div className="profile-display">
      <div className="profile-picture-container">
        <img 
          src={profile_photo_url || defaultProfileImage} 
          alt={name || 'User profile'} 
          className="profile-picture"
          onError={(e) => {
            // In case the image link is broken or file doesn't exist, fallback to default
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevent infinite loop if default also fails
            target.src = defaultProfileImage;
          }}
        />
      </div>
      <div className="profile-info">
        <h2>{name || 'Anonymous User'}</h2>
        <p className="bio">{bio || 'No bio provided.'}</p>
      </div>
      {/* Styling for this component will be needed */}
      <style jsx>{`
        .profile-display {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 8px;
        }
        .profile-picture-container {
          margin-right: 20px;
        }
        .profile-picture {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
        }
        .profile-info h2 {
          margin-top: 0;
          margin-bottom: 5px;
        }
        .profile-info .bio {
          font-size: 0.9em;
          color: #555;
          white-space: pre-wrap; /* Respect newlines in bio */
        }
      `}</style>
    </div>
  );
};

export default ProfileDisplay;
