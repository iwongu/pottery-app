import React from 'react';
import { UserProfile } from '../../types';
import styles from './ProfileDisplay.module.css'; // Import CSS Module

interface ProfileDisplayProps {
  user: UserProfile | null; 
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
    <div className={styles.profileDisplay}>
      <div className={styles.profilePictureContainer}>
        <img 
          src={profile_photo_url || defaultProfileImage} 
          alt={name || 'User profile'} 
          className={styles.profilePicture}
          onError={(e) => {
            // In case the image link is broken or file doesn't exist, fallback to default
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevent infinite loop if default also fails
            target.src = defaultProfileImage;
          }}
        />
      </div>
      <div className={styles.profileInfo}>
        <h2>{name || 'Anonymous User'}</h2>
        <p className={styles.bio}>{bio || 'No bio provided.'}</p>
      </div>
    </div>
  );
};

export default ProfileDisplay;
