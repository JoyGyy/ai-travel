import './style.css'

export function CommunityPostCardSkeleton() {
  return (
    <article className="community-post-card community-post-card--skeleton travel-surface-card" aria-hidden="true">
      <header className="community-post-card__header">
        <div className="skeleton-avatar" />
        <div className="community-post-card__author">
          <div className="skeleton-line skeleton-line--short" />
          <div className="skeleton-line skeleton-line--tiny" />
        </div>
        <div className="skeleton-tag" />
      </header>

      <div className="community-post-card__body">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-line skeleton-line--long" />
        <div className="skeleton-line skeleton-line--medium" />
      </div>

      <div className="skeleton-images">
        <div className="skeleton-image" />
        <div className="skeleton-image" />
        <div className="skeleton-image" />
      </div>

      <footer className="community-post-card__actions">
        <div className="skeleton-button" />
        <div className="skeleton-button" />
        <div className="skeleton-button" />
      </footer>
    </article>
  )
}
