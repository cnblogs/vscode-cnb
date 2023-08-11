use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(text: &str);
}

#[macro_export]
macro_rules! console_log {
    ($text:expr) => {
        use crate::infra::log::log;
        use alloc::format;
        let text = format!("{}", $text.to_string());
        log(&text);
    };
}
