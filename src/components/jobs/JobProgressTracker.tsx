import React from 'react'
// TODO: import { useState, useEffect } from 'react' // Currently unused
// TODO: import { useAuth } from '../../context/AuthContext' // Currently unused
// TODO: import { supabase } from '../../utils/supabase' // Currently unused
// TODO: import { Button } from '../ui/Button' // Currently unused
import { useToast } from '../ui/Toast'
import type { ProgressStep } from '../../types'

// TODO: Interface for future props implementation
// interface JobProgressTrackerProps {
//   jobId?: string
// }

export function JobProgressTracker() {
  // TODO: jobId prop currently unused (using mock data)
  // TODO: const { user, profile } = useAuth() // Currently unused
  // TODO: const [loading, setLoading] = useState(false) // Currently unused
  const { showSuccess } = useToast()
  // TODO: showError currently unused

  // Mock data for demo
  const progressSteps: ProgressStep[] = [
    {
      title: 'Job Posted',
      date: '15th July 2024',
      completed: true,
      status: 'completed'
    },
    {
      title: 'Tradie Matched',
      date: '16th July 2024', 
      completed: true,
      status: 'completed'
    },
    {
      title: 'Work Commenced',
      date: '20th July 2024',
      completed: true,
      status: 'completed'
    },
    {
      title: 'Final Inspection',
      date: 'Due: 28th July 2024',
      completed: false,
      status: 'in_progress'
    },
    {
      title: 'Job Completed',
      date: 'Pending',
      completed: false,
      status: 'pending'
    },
    {
      title: 'Final Payment',
      date: 'Pending',
      completed: false,
      status: 'pending'
    }
  ]

  const getProgressPercentage = () => {
    const completedSteps = progressSteps.filter(step => step.completed).length
    return Math.round((completedSteps / progressSteps.length) * 100)
  }

  const getStepIcon = (step: ProgressStep) => {
    if (step.completed) {
      return (
        <div className="flex size-10 items-center justify-center rounded-full bg-green-500 text-white">
          <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
            <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>
          </svg>
        </div>
      )
    } else if (step.status === 'in_progress') {
      return (
        <div className="flex size-10 items-center justify-center rounded-full bg-orange-500 text-white">
          <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        </div>
      )
    } else {
      return (
        <div className="flex size-10 items-center justify-center rounded-full bg-slate-300 text-slate-500">
          <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
            <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-48a8,8,0,0,1-8-8V112a8,8,0,0,1,16,0v48A8,8,0,0,1,120,168Zm-4-72a12,12,0,1,1,12,12A12,12,0,0,1,116,96Z"></path>
          </svg>
        </div>
      )
    }
  }

  // TODO: Loading state removed since using mock data
  // if (loading) { ... }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-slate-50 group/design-root overflow-x-hidden" style={{ fontFamily: '"Work Sans", "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 bg-white px-10 py-3">
          <div className="flex items-center gap-4 text-slate-900">
            <div className="size-8 text-blue-600">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_535)">
                  <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                </g>
                <defs>
                  <clipPath id="clip0_6_535"><rect fill="white" height="48" width="48"></rect></clipPath>
                </defs>
              </svg>
            </div>
            <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-[-0.015em]">TradieHelper</h2>
          </div>
          <div className="flex flex-1 justify-end gap-4">
            <nav className="flex items-center gap-6">
              <a className="text-slate-600 text-sm font-medium leading-normal hover:text-blue-600" href="#">Find Work</a>
              <a className="text-slate-600 text-sm font-medium leading-normal hover:text-blue-600" href="#">Post a Job</a>
              <a className="text-blue-600 text-sm font-bold leading-normal" href="#">My Jobs</a>
              <a className="text-slate-600 text-sm font-medium leading-normal hover:text-blue-600" href="#">Messages</a>
            </nav>
            <div className="flex items-center gap-4">
              <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-slate-100 text-slate-500 hover:bg-slate-200">
                <div data-icon="Bell" data-size="20px" data-weight="regular">
                  <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
                  </svg>
                </div>
              </button>
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuABCxqyS3kSMKdbdJhKe0seAyMAqR372Tf8W6hC-v-BslVSqxMO0Vj2_zRS4442cSXOIkaFOWEZJMdJM6HjczHB43Q2OaBiGWYd8N8BxHvZuGv9AJRBWYeExWhWEnD6FGvwturN0yKFRVjvNtm9Jas2rXJhwNnrBythxjBeQOj-MHde-GXcbRaijafnvA2q1rsrwnZxYzr7rT_0u1Hiq-ixez8nOXL-cFaOPA8iFIFskvb2WCVcFipCCkdqT7b3oRT4I7jALfD-NCkM")' }}></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-10 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <h1 className="text-slate-900 text-3xl font-bold leading-tight tracking-[-0.015em]">Job Progress Tracker</h1>
              <p className="text-slate-500 text-base font-normal leading-normal">Tracking progress for 'Bathroom Renovation'</p>
            </div>
            <div className="space-y-12">
              {/* Overall Progress */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-6">
                  <p className="text-slate-800 text-lg font-medium leading-normal">Overall Progress</p>
                  <p className="text-blue-600 text-lg font-bold leading-normal">{getProgressPercentage()}%</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${getProgressPercentage()}%` }}></div>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="grid grid-cols-[auto_1fr] gap-x-6">
                {progressSteps.map((step, index) => (
                  <React.Fragment key={step.title}>
                    <div className="flex flex-col items-center">
                      {getStepIcon(step)}
                      {index < progressSteps.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200"></div>
                      )}
                    </div>
                    <div className={index < progressSteps.length - 1 ? "pb-10" : ""}>
                      <p className="text-slate-800 text-base font-medium leading-normal">{step.title}</p>
                      <p className={`text-sm font-normal leading-normal ${
                        step.status === 'in_progress' ? 'text-orange-500 font-semibold' : 'text-slate-500'
                      }`}>
                        {step.date}
                      </p>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-[-0.015em]">Details</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                      <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                        <path d="M152,120H136V56h8a32,32,0,0,1,32,32,8,8,0,0,0,16,0,48.05,48.05,0,0,0-48-48h-8V24a8,8,0,0,0-16,0V40h-8a48,48,0,0,0,0,96h8v64H104a32,32,0,0,1-32-32,8,8,0,0,0-16,0,48.05,48.05,0,0,0,48,48h16v16a8,8,0,0,0,16,0V216h16a48,48,0,0,0,0-96Zm-40,0a32,32,0,0,1,0-64h8v64Zm40,80H136V136h16a32,32,0,0,1,0,64Z"></path>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-slate-800 text-base font-medium leading-normal">Milestone 1 Payment</p>
                      <p className="text-slate-500 text-sm font-normal leading-normal">$2,500 AUD</p>
                      <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        <span className="size-1.5 rounded-full bg-green-500"></span>
                        Paid on 25th July 2024
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                        <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-slate-800 text-base font-medium leading-normal">Communication</p>
                      <p className="text-slate-500 text-sm font-normal leading-normal">Last message: 27th July 2024</p>
                      <a 
                        className="mt-2 text-sm font-semibold text-blue-600 hover:underline" 
                        href="#"
                        onClick={() => showSuccess('Messages feature coming soon!')}
                      >
                        View Messages
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}