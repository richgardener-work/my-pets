export default function RouteSpinner() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-light-pink dark:border-dark-purple border-t-transparent animate-spin" />
    </div>
  )
}
