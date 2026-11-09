import { IMAGE_SIZE } from '@core/image'

export default function EmptyState(): React.JSX.Element {
  return (
    <div className="empty">
      <p>Load a photo to compare DCT and DWT compression at the same keep share.</p>
      <p className="empty-hint">
        The image is resized to {IMAGE_SIZE}×{IMAGE_SIZE} and converted to grayscale first.
        You can also drag and drop a photo anywhere on this window.
      </p>
    </div>
  )
}
