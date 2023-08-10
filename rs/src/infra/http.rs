use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec::Vec;
use reqwest::header::AUTHORIZATION;
use reqwest::RequestBuilder;

pub const APPLICATION_JSON: &str = "application/json";
pub const APPLICATION_X3WFU: &str = "application/x-www-form-urlencoded";
pub const AUTHORIZATION_TYPE: &str = "Authorization-Type";
pub const PAT: &str = "pat";

#[macro_export]
macro_rules! bearer {
    ($token:expr) => {{
        use alloc::format;
        format!("Bearer {}", $token)
    }};
}

#[macro_export]
macro_rules! basic {
    ($token:expr) => {{
        use alloc::format;
        format!("Basic {}", $token)
    }};
}

pub fn setup_auth(builder: RequestBuilder, token: &str, is_pat_token: bool) -> RequestBuilder {
    let builder = builder.header(AUTHORIZATION, bearer!(token));

    if is_pat_token {
        builder.header(AUTHORIZATION_TYPE, PAT)
    } else {
        builder
    }
}

pub fn cons_query_string(queries: Vec<(&str, &str)>) -> String {
    queries
        .into_iter()
        .map(|(k, v)| format!("{k}={v}"))
        .fold("".to_string(), |acc, q| format!("{acc}&{q}"))
}
