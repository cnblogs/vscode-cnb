use crate::http::RsHttp;
use crate::infra::option::IntoOption;
use crate::panic_hook;
use alloc::string::{String, ToString};
use mime::Mime;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = RsHttp)]
impl RsHttp {
    #[wasm_bindgen(js_name = mimeInfer)]
    pub fn export_mime_infer(path: &str) -> Option<String> {
        panic_hook!();
        let guess = mime_guess::from_path(path);
        guess.first().map(|mime| mime.to_string())
    }

    #[wasm_bindgen(js_name = mimeToImgExt)]
    pub fn export_mime_to_img_ext(mime: &str) -> Option<String> {
        panic_hook!();
        let Ok(mime) = mime.parse::<Mime>() else { return None; };

        match mime.essence_str() {
            "image/jpeg" => "jpg",
            "image/gif" => "gif",
            "image/png" => "png",
            "image/bmp" => "bmp",
            "image/svg+xml" => "svg",
            _ => return None,
        }
        .to_string()
        .into_some()
    }
}
