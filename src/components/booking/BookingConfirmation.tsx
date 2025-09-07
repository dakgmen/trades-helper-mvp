import React from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { CalendarIcon, UserCircleIcon } from '@heroicons/react/24/outline'

interface BookingDetails {
  id: string
  tradieName: string
  tradieId: string
  service: string
  dateTime: string
  location: string
  estimatedCost: string
  tradiePhone?: string
  tradieEmail?: string
  tradieRating?: number
  tradieReviews?: number
  tradieExperience?: string
  tradieAvatar?: string
}

interface BookingConfirmationProps {
  booking: BookingDetails
  onAddToCalendar?: () => void
  onManageBookings?: () => void
  onViewProfile?: (tradieId: string) => void
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onAddToCalendar,
  onManageBookings,
  onViewProfile
}) => {
  const handleAddToCalendar = () => {
    onAddToCalendar?.()
  }

  const handleManageBookings = () => {
    onManageBookings?.()
  }

  const handleViewProfile = () => {
    onViewProfile?.(booking.tradieId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 text-blue-600">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_6_535)">
                    <path 
                      clipRule="evenodd" 
                      d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" 
                      fill="currentColor" 
                      fillRule="evenodd"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_6_535">
                      <rect fill="white" height="48" width="48" />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">TradieHelper</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {/* Success Message */}
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600" />
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Booking Confirmed!
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Your booking with {booking.tradieName} is confirmed. You'll receive a reminder 24 hours before the scheduled time.
              </p>
            </div>

            {/* Booking Details */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">Booking Details</h3>
                <div className="mt-5 border-t border-gray-200">
                  <dl className="divide-y divide-gray-200">
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt className="text-sm font-medium text-gray-500">Tradie</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{booking.tradieName}</dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt className="text-sm font-medium text-gray-500">Service</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{booking.service}</dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{booking.dateTime}</dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{booking.location}</dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt className="text-sm font-medium text-gray-500">Estimated Cost</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 sm:col-span-2 sm:mt-0">{booking.estimatedCost}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Tradie Profile */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">Tradie Profile</h3>
                <div className="mt-5 flex items-center gap-6">
                  <div className="h-24 w-24 flex-shrink-0">
                    {booking.tradieAvatar ? (
                      <img 
                        alt={booking.tradieName} 
                        className="h-full w-full rounded-full object-cover" 
                        src={booking.tradieAvatar}
                      />
                    ) : (
                      <UserCircleIcon className="h-full w-full text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{booking.tradieName}</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {booking.service.split(' ')[0]} | {booking.tradieExperience || '5 years experience'}
                    </p>
                    {booking.tradieRating && (
                      <div className="mt-2 flex items-center gap-1">
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700">{booking.tradieRating}</span>
                        {booking.tradieReviews && (
                          <span className="text-sm text-gray-500">({booking.tradieReviews} reviews)</span>
                        )}
                      </div>
                    )}
                    <button 
                      onClick={handleViewProfile}
                      className="mt-4 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(booking.tradiePhone || booking.tradieEmail) && (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">Contact Information</h3>
                  <div className="mt-5 border-t border-gray-200">
                    <dl className="divide-y divide-gray-200">
                      {booking.tradiePhone && (
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                          <dt className="text-sm font-medium text-gray-500">Tradie's Phone</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{booking.tradiePhone}</dd>
                        </div>
                      )}
                      {booking.tradieEmail && (
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                          <dt className="text-sm font-medium text-gray-500">Tradie's Email</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{booking.tradieEmail}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button 
                onClick={handleAddToCalendar}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 sm:w-auto"
              >
                <CalendarIcon className="h-5 w-5" />
                Add to Calendar
              </button>
              <button 
                onClick={handleManageBookings}
                className="w-full rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
              >
                Manage My Bookings
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default BookingConfirmation