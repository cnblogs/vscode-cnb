use crate::cnb::img::ImgReq;
use crate::infra::result::{IntoResult, ResultExt};
use crate::panic_hook;
use alloc::boxed::Box;
use alloc::string::{String, ToString};
use anyhow::Result;
use anyhow::{anyhow, bail};
use core::ops::Not;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, PartialEq)]
pub struct ImgDlResult {
    bytes: Box<[u8]>,
    mime: String,
}

#[wasm_bindgen]
impl ImgDlResult {
    #[wasm_bindgen(constructor)]
    pub fn new(bytes: Box<[u8]>, mime: String) -> ImgDlResult {
        ImgDlResult { bytes, mime }
    }
    #[wasm_bindgen(getter, js_name = bytes)]
    pub fn bytes(&self) -> Box<[u8]> {
        self.bytes.clone()
    }
    #[wasm_bindgen(getter, js_name = mime)]
    pub fn mime(&self) -> String {
        self.mime.clone()
    }
}

#[wasm_bindgen(js_class = ImgReq)]
impl ImgReq {
    #[wasm_bindgen(js_name = download)]
    pub async fn export_download(url: &str) -> Result<ImgDlResult, String> {
        panic_hook!();
        let result = download(url).await;
        result.err_to_string()
    }
}

async fn download(url: &str) -> Result<ImgDlResult> {
    let client = reqwest::Client::new();
    let req = client.get(url);

    let resp = req.send().await?;

    let code = resp.status();
    if code.is_success().not() {
        let body = resp.text().await?;
        bail!("{}: {}", code, body)
    }

    let mime = {
        let ct_header = resp
            .headers()
            .get("Content-Type")
            .ok_or(anyhow!("Can not get content type in header"));
        ct_header?
            .to_str()
            .map(|s| s.to_string())
            .map_err(|_| anyhow!("Can not convert HeaderValue to str"))?
    };

    let bytes: Box<[u8]> = resp.bytes().await?.to_vec().into_boxed_slice();

    ImgDlResult::new(bytes, mime).into_ok()
}
