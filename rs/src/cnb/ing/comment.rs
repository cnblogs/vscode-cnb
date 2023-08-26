use crate::cnb::ing::IngReq;
use crate::http::unit_or_err;
use crate::infra::http::setup_auth;
use crate::infra::result::ResultExt;
use crate::{openapi, panic_hook};
use alloc::format;
use alloc::string::{String, ToString};
use anyhow::Result;
use mime::APPLICATION_JSON;
use reqwest::header::CONTENT_TYPE;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[serde_with::skip_serializing_none]
#[derive(Serialize, Deserialize, Debug, Default)]
struct Body {
    #[serde(rename(serialize = "replyTo"))]
    reply_to: Option<usize>,
    #[serde(rename(serialize = "parentCommentId"))]
    parent_comment_id: Option<usize>,
    content: String,
}

#[wasm_bindgen(js_class = IngReq)]
impl IngReq {
    #[wasm_bindgen(js_name = comment)]
    pub async fn export_comment(
        &self,
        ing_id: usize,
        content: String,
        reply_to: Option<usize>,
        parent_comment_id: Option<usize>,
    ) -> Result<(), String> {
        panic_hook!();
        let url = openapi!("/statuses/{}/comments", ing_id);

        let client = reqwest::Client::new().post(url);

        let body = Body {
            reply_to,
            parent_comment_id,
            content,
        };
        let req = setup_auth(client, &self.token, self.is_pat_token)
            .header(CONTENT_TYPE, APPLICATION_JSON.to_string());

        let result: Result<()> = try {
            let body = serde_json::to_string_pretty(&body)?;
            let req = req.body(body);
            let resp = req.send().await?;
            unit_or_err(resp).await?
        };

        result.err_to_string()
    }
}
