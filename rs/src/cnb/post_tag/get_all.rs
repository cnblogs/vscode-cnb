use crate::cnb::oauth::Token;
use crate::cnb::post_tag::PostTagReq;
use crate::http::body_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::IntoResult;
use crate::{blog_backend, panic_hook};
use alloc::string::{String, ToString};
use alloc::vec::Vec;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = PostTag, getter_with_clone)]
#[derive(Serialize, Deserialize, Debug, Default)]
pub struct PostTag {
    pub id: usize,
    pub name: String,
}

#[wasm_bindgen(js_class = PostTagReq)]
impl PostTagReq {
    #[wasm_bindgen(js_name = getAll)]
    pub async fn export_get_all(&self) -> Result<JsValue, String> {
        panic_hook!();
        let tag_list = get_all(&self.token).await;

        match tag_list {
            Ok(tag_list) => serde_wasm_bindgen::to_value(&tag_list).unwrap().into_ok(),
            Err(e) => e.to_string().into_err(),
        }
    }
}

async fn get_all(token: &Token) -> Result<Vec<PostTag>> {
    let url = blog_backend!("/tags/list");

    let client = reqwest::Client::new();

    let req = {
        let req = client.get(url);
        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;

    let tag_list = {
        let json = body_or_err(resp).await?;
        let val: Value = serde_json::from_str(&json)?;

        #[derive(Serialize, Deserialize, Debug, Default)]
        struct Item {
            pub id: usize,
            pub name: String,

            #[serde(rename = "createTime")]
            //'2023-08-03T12:36:08.643'
            pub create_time: String,

            #[serde(rename = "isPreset")]
            pub is_preset: bool,

            /* pub order: null */
            #[serde(rename = "privateUseCount")]
            pri_use_count: usize,
            #[serde(rename = "useCount")]
            use_count: usize,
        }

        serde_json::from_value::<Vec<Item>>(val)?
            .into_iter()
            .map(|it| PostTag {
                id: it.id,
                name: it.name,
            })
            .collect::<Vec<PostTag>>()
    };

    tag_list.into_ok()
}
