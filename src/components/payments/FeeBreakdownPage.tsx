import React, { useState, useEffect } from 'react'
import { EnhancedNavigation } from '../layout/EnhancedNavigation'
import MobileNavigation from '../layout/MobileNavigation'
import { CreditCardIcon, InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface FeeStructure {
  service_fee_percentage: number
  payment_processing_fee: number
  insurance_fee: number
  platform_fee: number
  emergency_fund_fee: number
}

interface JobCostBreakdown {
  job_value: number
  service_fee: number
  payment_processing: number
  insurance_fee: number
  platform_fee: number
  emergency_fund: number
  total_fees: number
  helper_receives: number
  tradie_pays: number
}

export const FeeBreakdownPage: React.FC = () => {
  const [feeStructure] = useState<FeeStructure>({
    service_fee_percentage: 8.5,
    payment_processing_fee: 2.9,
    insurance_fee: 1.5,
    platform_fee: 2.0,
    emergency_fund_fee: 0.5
  })
  const [jobValue, setJobValue] = useState<number>(200)
  const [breakdown, setBreakdown] = useState<JobCostBreakdown | null>(null)

  const calculateBreakdown = (value: number): JobCostBreakdown => {
    const service_fee = (value * feeStructure.service_fee_percentage) / 100
    const payment_processing = (value * feeStructure.payment_processing_fee) / 100
    const insurance_fee = (value * feeStructure.insurance_fee) / 100
    const platform_fee = (value * feeStructure.platform_fee) / 100
    const emergency_fund = (value * feeStructure.emergency_fund_fee) / 100
    
    const total_fees = service_fee + payment_processing + insurance_fee + platform_fee + emergency_fund
    const helper_receives = value - total_fees
    const tradie_pays = value

    return {
      job_value: value,
      service_fee,
      payment_processing,
      insurance_fee,
      platform_fee,
      emergency_fund,
      total_fees,
      helper_receives,
      tradie_pays
    }
  }

  useEffect(() => {
    if (jobValue > 0) {
      const result = calculateBreakdown(jobValue)
      setBreakdown(result)
    }
  }, [jobValue, feeStructure])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount)
  }

  const feeDetails = [
    {
      name: 'Service Fee',
      percentage: feeStructure.service_fee_percentage,
      amount: breakdown?.service_fee || 0,
      description: 'Platform maintenance, customer support, and quality assurance',
      icon: CreditCardIcon,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      name: 'Payment Processing',
      percentage: feeStructure.payment_processing_fee,
      amount: breakdown?.payment_processing || 0,
      description: 'Secure payment processing and escrow management',
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-50'
    },
    {
      name: 'Insurance Coverage',
      percentage: feeStructure.insurance_fee,
      amount: breakdown?.insurance_fee || 0,
      description: 'Job insurance and liability protection for all parties',
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600 bg-yellow-50'
    },
    {
      name: 'Platform Fee',
      percentage: feeStructure.platform_fee,
      amount: breakdown?.platform_fee || 0,
      description: 'App development, hosting, and security infrastructure',
      icon: InformationCircleIcon,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      name: 'Emergency Fund',
      percentage: feeStructure.emergency_fund_fee,
      amount: breakdown?.emergency_fund || 0,
      description: 'Safety net for disputed jobs and emergency assistance',
      icon: ExclamationTriangleIcon,
      color: 'text-red-600 bg-red-50'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Transparent Fee Breakdown
          </h1>
          <p className="text-gray-600">
            Understand exactly where your money goes with complete fee transparency
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Fee Calculator */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Fee Calculator
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Value (AUD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="10"
                    value={jobValue}
                    onChange={(e) => setJobValue(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="200"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Enter a job value between $10 - $10,000 AUD
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[100, 200, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setJobValue(amount)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      jobValue === amount
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    } border transition-colors`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Summary Card */}
              {breakdown && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Helper Receives</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(breakdown.helper_receives)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Fees</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(breakdown.total_fees)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-blue-600">
                      <span className="font-medium">Fee Rate:</span> {((breakdown.total_fees / breakdown.job_value) * 100).toFixed(1)}% of job value
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What You Get for These Fees
              </h3>
              <div className="space-y-3">
                {[
                  'Secure escrow payment system',
                  '24/7 customer support',
                  'Job insurance and liability coverage',
                  'Dispute resolution services',
                  'Background-checked helpers',
                  'Quality assurance and reviews',
                  'Mobile app and platform maintenance'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Detailed Fee Breakdown
              </h2>
              
              <div className="space-y-4">
                {feeDetails.map((fee, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${fee.color}`}>
                          <fee.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{fee.name}</h4>
                          <p className="text-sm text-gray-600">{fee.percentage}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(fee.amount)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {fee.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total */}
              {breakdown && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total Fees</span>
                    <span className="text-gray-900">
                      {formatCurrency(breakdown.total_fees)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Comparison */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                How We Compare
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">TradieHelper</p>
                    <p className="text-sm text-blue-600">All-inclusive fee</p>
                  </div>
                  <p className="text-lg font-bold text-blue-900">15.4%</p>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-700">Traditional Platforms</p>
                    <p className="text-sm text-gray-500">Base fee only</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-700">18-25%</p>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-700">Agency Hiring</p>
                    <p className="text-sm text-gray-500">Plus hourly markup</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-700">25-40%</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Save up to 25%</strong> compared to traditional hiring methods
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                question: 'When are fees charged?',
                answer: 'Fees are automatically deducted when payment is released from escrow after job completion and approval.'
              },
              {
                question: 'Are there any hidden fees?',
                answer: 'No hidden fees. This breakdown shows all costs. What you see is what you pay.'
              },
              {
                question: 'Can fees be negotiated?',
                answer: 'Our fee structure is standardized to ensure fairness and maintain platform quality for all users.'
              },
              {
                question: 'What if a job is cancelled?',
                answer: 'If cancelled before work begins, no fees apply. Partial fees may apply for work completed.'
              },
              {
                question: 'How does insurance coverage work?',
                answer: 'Insurance covers up to $10,000 for property damage and $5,000 for injury claims per job.'
              },
              {
                question: 'What payment methods are accepted?',
                answer: 'We accept all major credit/debit cards, PayPal, and bank transfers with secure encryption.'
              }
            ].map((faq, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileNavigation />
    </div>
  )
}