import React from 'react'
import { Card, CardContent } from './Card'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'gray'
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  color = 'blue', 
  trend 
}: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {value}
            </p>
            {description && (
              <p className="mt-2 text-sm text-gray-600">
                {description}
              </p>
            )}
            {trend && (
              <div className="mt-2 flex items-center text-sm">
                <span className={`flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? (
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l10-10M7 7h10v10" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7L7 17M7 7v10h10" />
                    </svg>
                  )}
                  {Math.abs(trend.value)}%
                </span>
                <span className="ml-2 text-gray-500">vs last month</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={`flex-shrink-0 ${colorClasses[color]}`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}