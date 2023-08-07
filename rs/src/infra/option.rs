pub trait IntoOption
where
    Self: Sized,
{
    #[inline]
    fn into_some<E>(self) -> Option<Self> {
        Some(self)
    }
}

impl<T> IntoOption for T {}
