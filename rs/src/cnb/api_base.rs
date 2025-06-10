pub const BLOG_BACKEND: &str = "https://write.cnblogs.com/api";

#[macro_export]
macro_rules! blog_backend {
    ($($arg:tt)*) => {{
        use $crate::cnb::api_base::BLOG_BACKEND;
        use alloc::format;
        format!("{}{}", BLOG_BACKEND, format_args!($($arg)*))
    }};
}

pub const OPENAPI: &str = "https://api.cnblogs.com/api";
#[macro_export]
macro_rules! openapi {
    ($($arg:tt)*) => {{
        use $crate::cnb::api_base::OPENAPI;
        use alloc::format;
        format!("{}{}", OPENAPI, format_args!($($arg)*))
    }};
}

pub const OAUTH: &str = "https://oauth.cnblogs.com";
#[macro_export]
macro_rules! oauth {
    ($($arg:tt)*) => {{
        use $crate::cnb::api_base::OAUTH;
        use alloc::format;
        format!("{}{}", OAUTH, format_args!($($arg)*))
    }};
}

pub const BACKUP: &str = "https://export.cnblogs.com";
#[macro_export]
macro_rules! backup {
    ($($arg:tt)*) => {{
        use $crate::cnb::api_base::BACKUP;
        use alloc::format;
        format!("{}{}", OAUTH, format_args!($($arg)*))
    }};
}
