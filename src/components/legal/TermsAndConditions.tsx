import React, { useState } from 'react'

interface TermsAndConditionsProps {
  onAccept: () => void
  onDecline: () => void
  isRequired?: boolean
}

export function TermsAndConditions({ onAccept, onDecline, isRequired = true }: TermsAndConditionsProps) {
  const [isAccepted, setIsAccepted] = useState(false)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setIsScrolledToBottom(true)
    }
  }

  const handleAccept = () => {
    if (isAccepted) {
      onAccept()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Terms and Conditions</h2>
      
      <div 
        className="h-96 overflow-y-auto border border-gray-300 p-4 mb-4 bg-gray-50"
        onScroll={handleScroll}
      >
        <div className="space-y-4 text-sm text-gray-700">
          <h3 className="text-lg font-semibold text-gray-900">1. Service Agreement</h3>
          <p>
            By using TradieHelper, you agree to connect tradies with reliable helpers for various construction, 
            maintenance, and trade-related tasks. This platform facilitates job matching and payment processing 
            between registered users.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">2. User Responsibilities</h3>
          <p>
            <strong>Tradies:</strong> Must provide accurate job descriptions, fair compensation, and safe working 
            conditions. You are responsible for ensuring all legal requirements are met for hiring helpers.
          </p>
          <p>
            <strong>Helpers:</strong> Must possess the skills advertised, arrive on time, and work safely. 
            You are responsible for your own insurance and tax obligations.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">3. Payment Terms</h3>
          <p>
            All payments are processed through our secure escrow system. Platform fees of 5% plus payment 
            processing fees apply. Payments are released upon job completion or after 7 days if no disputes 
            are raised.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">4. Safety and Insurance</h3>
          <p>
            Users are responsible for their own safety and insurance coverage. TradieHelper is not liable 
            for workplace injuries, accidents, or damages. We recommend all users maintain appropriate 
            insurance coverage.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">5. Dispute Resolution</h3>
          <p>
            Disputes must be reported within 48 hours of job completion. Our support team will mediate 
            disputes fairly. Users agree to work in good faith to resolve issues.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">6. Data Privacy</h3>
          <p>
            We collect and store user data as outlined in our Privacy Policy. Your personal information 
            is protected and only shared as necessary to facilitate job matching and payment processing.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">7. Prohibited Activities</h3>
          <p>
            Users may not: post fake jobs, provide false information, circumvent platform payments, 
            engage in unsafe practices, or violate any applicable laws or regulations.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">8. Account Termination</h3>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms. Users may 
            close their accounts at any time, but remain liable for any outstanding obligations.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">9. Limitation of Liability</h3>
          <p>
            TradieHelper's liability is limited to the platform fees paid. We are not responsible for 
            job quality, safety issues, or disputes between users. Use of the platform is at your own risk.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">10. Governing Law</h3>
          <p>
            These terms are governed by Australian law. Any disputes will be resolved in Australian courts. 
            These terms may be updated periodically, with notice provided to users.
          </p>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 font-semibold">
              By accepting these terms, you acknowledge that you have read, understood, and agree to be 
              bound by all provisions outlined above.
            </p>
          </div>
        </div>
      </div>

      {!isScrolledToBottom && (
        <p className="text-sm text-gray-500 mb-4 text-center">
          Please scroll to the bottom to read all terms and conditions
        </p>
      )}

      <div className="flex items-center justify-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isAccepted}
            onChange={(e) => setIsAccepted(e.target.checked)}
            disabled={!isScrolledToBottom}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
          />
          <span className={`text-sm ${!isScrolledToBottom ? 'text-gray-400' : 'text-gray-700'}`}>
            I have read and agree to the Terms and Conditions
          </span>
        </label>
      </div>

      <div className="flex justify-center space-x-4 mt-6">
        {!isRequired && (
          <button
            onClick={onDecline}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Decline
          </button>
        )}
        <button
          onClick={handleAccept}
          disabled={!isAccepted || !isScrolledToBottom}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRequired ? 'Accept and Continue' : 'Accept'}
        </button>
      </div>
    </div>
  )
}