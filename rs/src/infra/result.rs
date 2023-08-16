use alloc::string::{String, ToString};
use anyhow::Result;

pub trait IntoResult
where
    Self: Sized,
{
    #[inline]
    fn into_ok<E>(self) -> Result<Self, E> {
        Ok(self)
    }
    #[inline]
    fn into_err<O>(self) -> Result<O, Self> {
        Err(self)
    }
}

impl<T> IntoResult for T {}

pub type HomoResult<T> = Result<T, T>;

pub trait ResultExt<O, E> {
    fn err_to_string(self) -> Result<O, String>
    where
        E: ToString;

    fn homo_string(self) -> HomoResult<String>
    where
        O: ToString,
        E: ToString;
}

impl<O, E> ResultExt<O, E> for Result<O, E> {
    #[inline]
    fn err_to_string(self) -> Result<O, String>
    where
        E: ToString,
    {
        self.map_err(|e| e.to_string())
    }

    #[inline]
    fn homo_string(self) -> HomoResult<String>
    where
        O: ToString,
        E: ToString,
    {
        match self {
            Ok(o) => Ok(o.to_string()),
            Err(e) => Err(e.to_string()),
        }
    }
}
