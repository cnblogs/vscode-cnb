use crate::cnb::img::ImgBytes;
use crate::infra::result::{IntoResult, ResultExt};
use crate::panic_hook;
use alloc::string::{String, ToString};
use anyhow::anyhow;
use anyhow::Result;
use data_url::DataUrl;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = ImgBytes)]
impl ImgBytes {
    #[wasm_bindgen(js_name = fromDataUrl)]
    pub fn export_from_data_url(data_url: &str) -> Result<ImgBytes, String> {
        panic_hook!();
        let ib = from_data_url(data_url);
        ib.err_to_string()
    }
}

fn from_data_url(data_url: &str) -> Result<ImgBytes> {
    let data_url = DataUrl::process(data_url).map_err(|e| anyhow!("{:?}", e))?;
    let (body, _) = data_url.decode_to_vec().map_err(|e| anyhow!("{:?}", e))?;

    let bytes = body.into_boxed_slice();
    let mime = data_url.mime_type().to_string();

    ImgBytes::new(bytes, mime).into_ok()
}
