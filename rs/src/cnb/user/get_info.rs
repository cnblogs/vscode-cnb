use crate::cnb::oauth::Token;
use crate::cnb::user::UserReq;
use crate::infra::http::setup_auth;
use crate::infra::result::{IntoResult, ResultExt};
use crate::{openapi, panic_hook};
use alloc::format;
use alloc::string::String;
use anyhow::{bail, Result};
use core::ops::Not;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = UserInfo, getter_with_clone)]
#[derive(Serialize, Deserialize, Debug, Default)]
pub struct UserInfo {
    #[serde(rename = "UserId")]
    pub user_id: String,
    #[serde(rename = "SpaceUserID")]
    pub space_user_id: usize,
    #[serde(rename = "BlogId")]
    pub blog_id: usize,
    #[serde(rename = "DisplayName")]
    pub display_name: String,
    #[serde(rename = "Face")]
    pub face: String,
    #[serde(rename = "Avatar")]
    pub avatar: String,
    #[serde(rename = "Seniority")]
    pub seniority: String,
    #[serde(rename = "BlogApp")]
    pub blog_app: String,
    #[serde(rename = "FollowingCount")]
    pub following_count: usize,
    #[serde(rename = "FollowerCount")]
    pub followers_count: usize,
    #[serde(rename = "IsVip")]
    pub is_vip: bool,
    #[serde(rename = "Joined")]
    pub joined: String,
}

#[wasm_bindgen(js_class = UserReq)]
impl UserReq {
    #[wasm_bindgen(js_name = getInfo)]
    pub async fn export_get_info(&self) -> Result<UserInfo, String> {
        panic_hook!();
        let info = get_info(&self.token).await;
        info.err_to_string()
    }
}

async fn get_info(token: &Token) -> Result<UserInfo> {
    let url = openapi!("/users");

    let client = reqwest::Client::new();

    let req = {
        let req = client.get(url);
        setup_auth(req, &token.token, token.is_pat)
    };

    let resp = req.send().await?;
    let code = resp.status();
    let body = resp.text().await?;

    if code.is_success().not() {
        bail!("{}: {}", code, body);
    }

    let val: Value = serde_json::from_str(&body)?;
    let user_info = serde_json::from_value::<UserInfo>(val)?;
    user_info.into_ok()
}
