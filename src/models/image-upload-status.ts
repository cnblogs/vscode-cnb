enum ImageUploadStatusId {
    uploading,
    uploaded,
    failed,
}

interface ImageUploadStatus {
    id: ImageUploadStatusId;
    imageUrl?: string;
    errors?: string[];
}

export { ImageUploadStatusId, ImageUploadStatus };
