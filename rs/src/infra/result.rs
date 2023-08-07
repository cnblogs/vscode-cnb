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

pub fn homo_result_string<E>(r: Result<impl Into<String>, E>) -> HomoResult<String>
where
    E: ToString,
{
    match r {
        Ok(o) => Ok(o.into()),
        Err(e) => Err(e.to_string()),
    }
}
