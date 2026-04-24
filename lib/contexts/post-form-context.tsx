"use client";
import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { PostStatus } from "@/generated/prisma/enums";

export interface PostFormData {
  title?: string;
  description?: string;
  url?: string;
  media?: Record<string, unknown>[];
}

interface PostFormContextType {
  // Form data
  formData: PostFormData;
  setFormData: (data: PostFormData) => void;
  updateFormData: (partial: Partial<PostFormData>) => void;

  // Upload state
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;

  // Post state
  postId: string | null;
  setPostId: (id: string | null) => void;
  postStatus: PostStatus;
  setPostStatus: (status: PostStatus) => void;

  // Edit mode
  isEdit: boolean;
  setIsEdit: (isEdit: boolean) => void;

  // Reset form
  resetForm: () => void;
}

const PostFormContext = createContext<PostFormContextType | undefined>(
  undefined,
);

const initialFormData: PostFormData = {
  title: "",
  description: "",
  url: "",
  media: [],
};

export function PostFormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<PostFormData>(initialFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [postStatus, setPostStatus] = useState<PostStatus>(PostStatus.DRAFT);
  const [isEdit, setIsEdit] = useState(false);

  const updateFormData = useCallback((partial: Partial<PostFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setIsUploading(false);
    setPostId(null);
    setPostStatus(PostStatus.DRAFT);
    setIsEdit(false);
  }, []);

  const value: PostFormContextType = {
    formData,
    setFormData,
    updateFormData,
    isUploading,
    setIsUploading,
    postId,
    setPostId,
    postStatus,
    setPostStatus,
    isEdit,
    setIsEdit,
    resetForm,
  };

  return (
    <PostFormContext.Provider value={value}>
      {children}
    </PostFormContext.Provider>
  );
}

export function usePostForm() {
  const context = useContext(PostFormContext);
  if (context === undefined) {
    throw new Error("usePostForm must be used within PostFormProvider");
  }
  return context;
}
