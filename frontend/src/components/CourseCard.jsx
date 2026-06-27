/**
 * CourseCard — reusable card for the Discovery Home course grid.
 *
 * Props:
 *   image      {string}  - thumbnail URL
 *   duration   {string}  - e.g. "45 mins"
 *   tag        {string}  - e.g. "AI & TECH"
 *   title      {string}
 *   description{string}
 *   enrolled   {string}  - e.g. "2.4k Enrolled"
 */
import { Link } from 'react-router-dom'

export default function CourseCard({ pathId, image, duration, tag, title, description, enrolled }) {
  const cardContent = (
    <article className="bg-surface rounded-xl overflow-hidden card-shadow transition-all duration-300 flex flex-col h-full group">
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Duration chip */}
        <div className="absolute top-sm left-sm px-sm py-1 bg-surface-container-lowest/90 backdrop-blur rounded-full flex items-center gap-1 border border-outline-variant">
          <span className="material-symbols-outlined text-xs">schedule</span>
          <span className="text-label-sm">{duration}</span>
        </div>
        {/* Category badge */}
        <div className="absolute top-sm right-sm px-sm py-1 bg-secondary text-on-secondary rounded-full text-label-sm font-semibold uppercase">
          {tag}
        </div>
      </div>

      {/* Body */}
      <div className="p-lg flex flex-col flex-grow">
        <h3 className="font-display text-headline-sm text-primary mb-sm group-hover:text-secondary transition-colors">{title}</h3>
        <p className="text-body-sm text-on-surface-variant mb-lg line-clamp-2">{description}</p>

        {/* Footer */}
        <div className="mt-auto pt-lg border-t border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-on-surface-variant">group</span>
            <span className="text-label-sm text-on-surface-variant">{enrolled}</span>
          </div>
          <span className="px-md py-2 bg-secondary text-on-secondary rounded-lg text-label-md font-semibold hover:opacity-90 transition-opacity">
            Enroll Free
          </span>
        </div>
      </div>
    </article>
  )

  if (pathId) {
    return (
      <Link to={`/learning-path/${pathId}`} className="block h-full">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

