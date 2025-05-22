import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types'; // Assuming UserProfile includes profile_photo_url

interface EditProfileFormProps {
  currentUser: UserProfile; 
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading: boolean; // Changed from isSubmitting
  error: string | null; // For displaying submission errors
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
    <form onSubmit={handleSubmit} className="edit-profile-form">
      {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
      
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself"
          rows={4}
        />
      </div>

      <div className="form-group">
        <label htmlFor="profilePhoto">Profile Photo</label>
        {profilePhotoPreview && (
          <div className="photo-preview">
            <img src={profilePhotoPreview} alt="Profile preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
        )}
        <input
          type="file"
          id="profilePhoto"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={clearProfilePhoto} // Disable file input if "clear" is checked
        />
      </div>

      <div className="form-group">
        <label htmlFor="clearProfilePhoto">
          <input
            type="checkbox"
            id="clearProfilePhoto"
            checked={clearProfilePhoto}
            onChange={handleClearPhotoChange}
          />
          Remove profile photo
        </label>
      </div>

      <button type="submit" disabled={isLoading} className="submit-button">
        {isLoading ? 'Saving...' : 'Save Profile'}
      </button>
      <style jsx>{`
        .edit-profile-form {
          max-width: 500px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .form-group input[type="text"],
        .form-group textarea,
        .form-group input[type="file"],
        .form-group input[type="checkbox"] {
          /* General styling for inputs */
        }
        .form-group input[type="text"],
        .form-group textarea,
        .form-group input[type="file"] { /* Specific to block elements */
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        .form-group input[type="checkbox"] {
           margin-right: 5px;
           vertical-align: middle;
        }
        .form-group textarea {
          resize: vertical;
        }
        .photo-preview {
          margin-bottom: 10px;
        }
        .submit-button {
          background-color: #007bff;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1em;
        }
        .submit-button:disabled {
          background-color: #aaa;
        }
        .submit-button:hover:not(:disabled) {
          background-color: #0056b3;
        }
        .error-message {
          color: red;
          margin-bottom: 15px;
        }
      `}</style>
    </form>
  );
};

export default EditProfileForm;
