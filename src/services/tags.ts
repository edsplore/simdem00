import apiClient from "./api/interceptors";

export interface Tag {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  last_modified_by: string;
  last_modified_at: string;
}

export interface CreateTagResponse {
  id: string;
  status: string;
}

/**
 * Fetches all tags created by users
 * @param userId The user ID making the request
 * @returns Promise with array of tags
 */
export const fetchTags = async (userId: string): Promise<Tag[]> => {
  try {
    const response = await apiClient.post('/tags/fetch', {
      user_id: userId
    });

    return response.data.tags || [];
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
};

/**
 * Creates a new tag
 * @param userId The user ID creating the tag
 * @param tagName The name of the tag to create
 * @returns Promise with the created tag response
 */
export const createTag = async (
  userId: string,
  tagName: string,
): Promise<CreateTagResponse> => {
  try {
    const response = await apiClient.post('/tags/create', {
      user_id: userId,
      name: tagName,
    });

    return response.data;
  } catch (error) {
    console.error("Error creating tag:", error);
    throw error;
  }
};
