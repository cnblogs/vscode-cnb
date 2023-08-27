use crate::cnb::img::ImgReq;
use crate::cnb::oauth::Token;
use crate::http::{body_or_err, RsHttp};
use crate::infra::http::setup_auth;
use crate::infra::result::{HomoResult, ResultExt};
use crate::{blog_backend, panic_hook};
use alloc::format;
use alloc::string::String;
use alloc::vec::Vec;
use anyhow::{anyhow, Result};
use reqwest::multipart::{Form, Part};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_class = ImgReq)]
impl ImgReq {
    #[wasm_bindgen(js_name = upload)]
    pub async fn export_upload(&self, bytes: Vec<u8>, mime: &str) -> HomoResult<String> {
        panic_hook!();
        let url = upload(&self.token, bytes, mime).await;
        url.err_to_string()
    }
}

async fn upload(token: &Token, bytes: Vec<u8>, mime: &str) -> Result<String> {
    let client = reqwest::Client::new();

    let url = blog_backend!("/posts/body/images");

    let req = {
        let req = client.post(url);
        let req = setup_auth(req, &token.token, token.is_pat);

        let form = {
            let img_ext = RsHttp::export_mime_to_img_ext(mime)
                .ok_or(anyhow!("MIME must be like image/..."))?;
            let file_name = format!("image.{}", img_ext);

            let part = Part::bytes(bytes).file_name(file_name).mime_str(mime)?;
            Form::new().part("image", part)
        };

        req.multipart(form)
    };

    let resp = req.send().await?;

    body_or_err(resp).await
}
