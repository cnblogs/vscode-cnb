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
