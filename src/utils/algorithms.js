export const pagingSkip = (page, limit) => {
  if (!page || !limit) return 0
  if (page <= 0 || limit <= 0) return 0

  return (page - 1) * limit
}
