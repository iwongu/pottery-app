export interface User {
    id: number;
    email: string;
    name?: string | null; // Added
    bio?: string | null; // Added
    profile_photo_filename?: string | null; // Added
    created_at: string; // ISO date string
    // provider?: string;
}

// For displaying user profile, potentially with constructed URLs
export interface UserProfile extends User {
    profile_photo_url?: string | null; 
}

// For updating user profile
export interface UserUpdateData {
    name?: string;
    bio?: string;
    // profile_photo is handled as FormData, not in this type directly for JSON
    // profile_photo_filename?: string | null; // For explicitly setting/clearing filename
}

export interface Post {
    id: number;
    title: string;
    text_content?: string | null; // Ensure nullable is consistent
    image_filename?: string | null; // e.g., "uuid.jpg"
    owner_id: number;
    created_at: string;
    updated_at?: string | null; // Ensure nullable is consistent
    image_url?: string | null; // Added: Full URL for client-side display, constructed by service
    owner: User; // This would be UserProfile if we want full owner details with photo URL
    like_count: number;
    is_showcased: boolean; // Added
    // comments: Comment[]; // If comments are directly nested
}

// For creating posts, client-side, before sending to backend
export interface PostCreateFormData {
    title: string;
    text_content?: string;
    image?: File | null;
    is_showcased?: boolean; // Optional during creation
}

// For updating posts, client-side
export interface PostUpdateData {
    title?: string;
    text_content?: string | null;
    is_showcased?: boolean;
    // image and remove_image handled by FormData in service
}


export interface Comment {
    id: number;
    text: string;
    owner_id: number;
    post_id: number;
    created_at: string;
    owner: User;
}

export interface Like {
    id: number;
    owner_id: number;
    post_id: number;
    owner: User;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
}

// For forms
export interface PostCreateData { // This was already here, renamed to PostCreateFormData for clarity
    title: string;
    text_content?: string;
    image?: File;
}