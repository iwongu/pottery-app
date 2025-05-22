import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types'; 
import styles from './EditProfileForm.module.css'; // Import CSS Module

interface EditProfileFormProps {
  currentUser: UserProfile; 
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading: boolean; 
  error: string | null; 
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ currentUser, onSubmit, isLoading, error }) => {
  const [name, setName] = useState(currentUser.name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(currentUser.profile_photo_url || null);
  const [clearProfilePhoto, setClearProfilePhoto] = useState<boolean>(false);

  useEffect(() => {
    setName(currentUser.name || '');
    setBio(currentUser.bio || '');
    setProfilePhotoPreview(currentUser.profile_photo_url || null);
    // Reset file and clear flag when currentUser changes, in case the form is re-used or props update
    setProfilePhotoFile(null);
    setClearProfilePhoto(false);
  }, [currentUser]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
      setClearProfilePhoto(false); // If a new photo is selected, don't clear it
    }
  };

  const handleClearPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setClearProfilePhoto(isChecked);
    if (isChecked) {
      setProfilePhotoFile(null); // Remove any selected file
      setProfilePhotoPreview(null); // Clear preview or set to a default placeholder
    } else {
      // If unchecked, and a file was previously selected, it remains.
      // If no file was selected, and user had an original photo, revert preview to original.
      // This part can be tricky; often, "clear" means "clear and save to remove".
      // If unchecking "clear" should revert to original photo, then:
      if (profilePhotoFile) {
        setProfilePhotoPreview(URL.createObjectURL(profilePhotoFile));
      } else {
        setProfilePhotoPreview(currentUser.profile_photo_url || null);
      }
    }
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();

    // Append name and bio if they have changed or if you always want to send them
    // For simplicity, let's always send them. Backend can handle no-change updates.
    formData.append('name', name);
    formData.append('bio', bio);
    
    if (profilePhotoFile) {
      formData.append('profile_photo', profilePhotoFile);
    }
    
    // IMPORTANT: The backend for `clear_profile_photo` was designed to accept a boolean Form(False)
    // HTML FormData typically sends values as strings.
    // The backend FastAPI endpoint uses `Optional[bool] = Form(False)`.
    // Sending 'true' or 'false' as strings for Optional[bool] = Form(False) works with FastAPI.
    if (clearProfilePhoto) {
      formData.append('clear_profile_photo', 'true');
    }
    // If not sending 'clear_profile_photo' when false, backend defaults to False.
    // If you need to explicitly send 'false':
    // else {
    //   formData.append('clear_profile_photo', 'false'); 
    // }


    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editProfileForm}>
      {error && <p className={styles.errorMessage}>{error}</p>}
      
      <div className={styles.formGroup}>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          className={styles.textInput}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself"
          rows={4}
          className={styles.textareaInput}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="profilePhoto">Profile Photo</label>
        {profilePhotoPreview && (
          <div className={styles.photoPreview}>
            {/* The img style is handled by .photoPreview img in CSS module */}
            <img src={profilePhotoPreview} alt="Profile preview" />
          </div>
        )}
        <input
          type="file"
          id="profilePhoto"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={clearProfilePhoto}
          className={styles.fileInput}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="clearProfilePhoto">
          <input
            type="checkbox"
            id="clearProfilePhoto"
            checked={clearProfilePhoto}
            onChange={handleClearPhotoChange}
            className={styles.checkboxInput}
          />
          Remove profile photo
        </label>
      </div>

      <button type="submit" disabled={isLoading} className={styles.submitButton}>
        {isLoading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};

export default EditProfileForm;
