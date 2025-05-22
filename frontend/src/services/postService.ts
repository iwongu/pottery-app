import apiClient from './api';
import { Post, PostCreateData } from '../types'; // Assuming PostCreateData is defined in types

export const createPost = async (postData: PostCreateData): Promise<Post> => {
    const formData = new FormData();
    formData.append('title', postData.title);
    if (postData.text_content) {
        formData.append('text_content', postData.text_content);
    }
    if (postData.image) {
        formData.append('image', postData.image);
    }

    const response = await apiClient.post<Post>('/posts/', formData, {
        headers: {
            // 'Content-Type': 'multipart/form-data' is automatically set by Axios when using FormData
        },
    });
    return response.data;
};

export const getHomepagePosts = async (limit: number = 10): Promise<Post[]> => {
    const response = await apiClient.get<Post[]>(`/posts/homepage?limit=${limit}`);
    return response.data;
};

// You can add other post-related services here, like getPosts, getPostById, etc.