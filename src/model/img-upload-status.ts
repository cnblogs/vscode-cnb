enum ImageUploadStatusId {
    uploading,
    uploaded,
    failed,
}

interface ImgUploadStatus {
    id: ImageUploadStatusId
    imageUrl?: string
    errors?: string[]
}

export { ImageUploadStatusId, ImgUploadStatus }
