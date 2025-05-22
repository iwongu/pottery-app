export interface User {
    id: number;
    email: string;
    created_at: string; // ISO date string
    // provider?: string;
}

export interface Post {
    id: number;
    title: string;
    text_content?: string;
    image_filename?: string; // e.g., "uuid.jpg"
    owner_id: number;
    created_at: string;
    updated_at?: string;
    owner: User;
    like_count: number;
    // comments: Comment[]; // If comments are directly nested
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
export interface PostCreateData {
    title: string;
    text_content?: string;
    image?: File;
}