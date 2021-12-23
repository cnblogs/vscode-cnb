export interface IClipboardImage {
    imgPath: string;
    /**
     * if the path is generate by the extension -> false
     * if the path is a real file path in system -> true
     */
    shouldKeepAfterUploading: boolean;
}
