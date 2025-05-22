import api from './api'; // Renamed from apiClient to api for consistency
import { Post, PostCreateFormData, PostUpdateData } from '../types'; // Updated imports

// Base URL for constructing post image URLs.
const POST_IMAGES_BASE_URL = `${process.env.REACT_APP_UPLOADS_URL || 'http://localhost:8000'}/uploads/post_images/`;

// Helper to construct full image URL for a post
const constructPostWithImageUrl = (post: Post): Post => {
  return {
    ...post,
    // Assuming image_filename is just the filename and needs base path
    // If image_filename is already a full URL or relative path handled by backend, adjust this
    image_url: post.image_filename ? `${POST_IMAGES_BASE_URL}${post.image_filename}` : undefined,
  };
};

// Helper to construct image URLs for a list of posts
const constructPostsWithImageUrls = (posts: Post[]): Post[] => {
  return posts.map(constructPostWithImageUrl);
};


export const createPost = async (postData: PostCreateFormData): Promise<Post> => {
    const formData = new FormData();
    formData.append('title', postData.title);
    if (postData.text_content) {
        formData.append('text_content', postData.text_content);
    }
    if (postData.image) {
        formData.append('image', postData.image);
    }
    if (postData.is_showcased !== undefined) { // Handle optional boolean
        formData.append('is_showcased', String(postData.is_showcased));
    }

    const response = await api.post<Post>('/posts/', formData); // Headers automatically set for FormData
    return constructPostWithImageUrl(response.data);
};

export const updatePost = async (postId: string, postUpdateData: PostUpdateData, imageFile?: File | null, removeImage?: boolean): Promise<Post> => {
    const formData = new FormData();
    if (postUpdateData.title !== undefined) formData.append('title', postUpdateData.title);
    if (postUpdateData.text_content !== undefined) formData.append('text_content', postUpdateData.text_content ?? ''); // Handle null by sending empty string or omitting
    // is_showcased is handled by separate endpoints (showcasePost/unshowcasePost)
    // Do not add postUpdateData.is_showcased to this general update FormData

    if (imageFile) {
        formData.append('image', imageFile);
    }
    if (removeImage) {
        formData.append('remove_image', 'true'); // Send as string 'true'
    }

    const response = await api.put<Post>(`/posts/${postId}`, formData);
    return constructPostWithImageUrl(response.data);
};

export const deletePost = async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
};

export const showcasePost = async (postId: string): Promise<Post> => {
    const response = await api.post<Post>(`/posts/${postId}/showcase`);
    return constructPostWithImageUrl(response.data);
};

export const unshowcasePost = async (postId: string): Promise<Post> => {
    const response = await api.delete<Post>(`/posts/${postId}/showcase`);
    return constructPostWithImageUrl(response.data);
};

export const getHomepagePosts = async (limit: number = 10): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/posts/homepage?limit=${limit}`);
    return constructPostsWithImageUrls(response.data);
};

export const getAllPosts = async (): Promise<Post[]> => {
    // Fetches all posts. Used by UserPage for now, which will then filter.
    // Ideally, backend should provide an endpoint like /users/{userId}/posts
    console.warn("Fetching all posts for UserPage. Consider a dedicated backend endpoint for user-specific posts for efficiency.");
    const response = await api.get<Post[]>('/posts/');
    return constructPostsWithImageUrls(response.data);
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
    // Placeholder: In a real scenario, this would ideally call a specific endpoint 
    // like `/users/${userId}/posts` or `/posts/?owner_id=${userId}`.
    // For this subtask, we'll fetch all posts and filter client-side in UserPage.
    // This is inefficient and NOT recommended for production.
    console.warn(`Fetching all posts to filter for user ${userId}. This is inefficient. A dedicated backend endpoint /users/${userId}/posts or /posts/?owner_id=${userId} is recommended.`);
    const allPosts = await getAllPosts(); // Uses the new getAllPosts function
    return allPosts.filter(post => String(post.owner_id) === userId);
};


export const getShowcasedPosts = async (userId: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/users/${userId}/showcased-posts`);
    return constructPostsWithImageUrls(response.data);
};


// You can add other post-related services here, like getPostById, etc.
// Example:
// export const getPostById = async (postId: string): Promise<Post> => {
//   const response = await api.get<Post>(`/posts/${postId}`);
//   return constructPostWithImageUrl(response.data);
// };

export default {
    createPost,
    updatePost,
    deletePost,
    showcasePost,
    unshowcasePost,
    getHomepagePosts,
    getAllPosts, // Exporting for general use if needed
    getUserPosts,
    getShowcasedPosts,
    // getPostById,
};