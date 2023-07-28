export enum ImgUploadStatusId {
    uploading,
    uploaded,
    failed,
}

export type ImgUploadStatus = {
    id: ImgUploadStatusId
    imageUrl?: string
    errors?: string[]
}
