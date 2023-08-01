#[macro_export]
macro_rules! panic_hook {
    () => {
        console_error_panic_hook::set_once();
    };
}
