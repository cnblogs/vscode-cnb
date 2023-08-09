use reqwest::header::AUTHORIZATION;
use reqwest::RequestBuilder;

pub const APPLICATION_JSON: &str = "application/json";
pub const AUTHORIZATION_TYPE: &str = "Authorization-Type";
pub const PAT: &str = "pat";

#[macro_export]
macro_rules! bearer {
    ($token:expr) => {{
        use alloc::format;
        format!("Bearer {}", $token)
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
