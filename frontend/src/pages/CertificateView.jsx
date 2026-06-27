import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import Navbar from '../components/Navbar'
import useApi from '../hooks/useApi'
import { getCertificates } from '../api/user'
import { useAuth } from '../context/AuthContext'

export default function CertificateView() {
  const { uuid } = useParams()
  const { isAuthenticated } = useAuth()
  const [copied, setCopied] = useState(false)

  // Fetch certs to display details
  const { data: certs, loading: certsLoading } = useApi(getCertificates, [], { skip: !isAuthenticated })
  const cert = certs?.find(c => c.certificate_uuid === uuid)

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (certsLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Fallback data if user is not logged in or cert is not found yet (e.g. demo mode)
  const displayCert = cert || {
    username: 'Learner',
    learning_path_title: 'AI Tools & Automation',
    certificate_uuid: uuid,
    issued_at: new Date().toISOString()
  }

  const issueDate = new Date(displayCert.issued_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen text-on-background bg-[#f8f9fa] pt-24 pb-xxl print:pt-0 print:pb-0">
      {/* Hide navbar on print */}
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="max-w-4xl mx-auto px-gutter flex flex-col items-center">
        {/* Actions header bar - hidden on print */}
        <div className="w-full flex justify-between items-center mb-xl print:hidden flex-wrap gap-md">
          <Link to="/dashboard" className="text-secondary text-label-md font-bold flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Dashboard
          </Link>
          <div className="flex gap-sm">
            <button
              onClick={handleCopyLink}
              className="h-10 px-lg bg-surface border border-outline rounded-xl text-label-sm font-bold text-primary flex items-center gap-1.5 hover:bg-surface-container-high transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
              {copied ? 'Link Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={handlePrint}
              className="h-10 px-lg bg-primary text-on-primary rounded-xl text-label-sm font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print Certificate
            </button>
          </div>
        </div>

        {/* Certificate Doc Container */}
        <div className="w-full bg-white aspect-[1.414/1] rounded-3xl shadow-2xl p-[5%] flex flex-col items-center justify-between border-8 border-double border-amber-500/30 relative overflow-hidden select-none print:shadow-none print:border-amber-500 print:m-0 print:rounded-none">
          {/* Certificate Watermark Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-50/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Borders & Corners */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-600/60 print:border-amber-600" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-600/60 print:border-amber-600" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-600/60 print:border-amber-600" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-600/60 print:border-amber-600" />

          {/* Header */}
          <div className="text-center space-y-sm relative z-10">
            <span className="material-symbols-outlined text-amber-600 icon-filled text-6xl" style={{ fontSize: '72px' }}>
              workspace_premium
            </span>
            <p className="font-display text-[16px] uppercase tracking-[0.25em] font-bold text-amber-700/80 print:text-amber-700">
              Certificate of Completion
            </p>
          </div>

          {/* Presentational Body */}
          <div className="text-center space-y-md relative z-10 w-full px-lg">
            <p className="text-body-md text-on-surface-variant italic">
              This is proudly presented to
            </p>
            <h2 className="font-display text-display-md text-primary font-bold border-b border-outline-variant/30 pb-sm inline-block min-w-[50%] print:border-amber-700">
              {displayCert.username}
            </h2>
            <p className="text-body-md text-on-surface-variant italic max-w-xl mx-auto">
              for successfully completing all micro-learning modules, quizzes, and project assessments in the learning path:
            </p>
            <h3 className="font-display text-headline-md text-secondary font-bold tracking-tight">
              {displayCert.learning_path_title}
            </h3>
          </div>

          {/* Footer - Signatures, Verification & Date */}
          <div className="w-full flex justify-between items-end border-t border-outline-variant/20 pt-lg relative z-10 mt-lg text-label-sm print:border-outline">
            <div className="text-left">
              <p className="text-on-surface-variant font-medium">Verification ID:</p>
              <p className="text-primary font-mono text-[10px] tracking-wider mt-0.5 select-all uppercase">
                {displayCert.certificate_uuid}
              </p>
            </div>

            {/* Gold Seal Insignia */}
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-4 border-dashed border-amber-500 flex items-center justify-center relative shrink-0 -translate-y-2 animate-pulse print:border-amber-500 print:animate-none">
              <span className="material-symbols-outlined text-amber-600 text-3xl icon-filled">verified</span>
            </div>

            <div className="text-right">
              <p className="text-on-surface-variant font-medium">Issued On:</p>
              <p className="text-primary font-bold mt-0.5">{issueDate}</p>
            </div>
          </div>
        </div>

        {/* Verification Info Block - hidden on print */}
        <section className="w-full mt-xl bg-white border border-outline-variant/30 rounded-2xl p-lg text-center shadow-sm print:hidden">
          <p className="text-body-sm text-on-surface-variant">
            🎓 This certificate represents completion of academic requirements on the <strong>DagluHub Platform</strong>.
            You can add this to your LinkedIn profile, portfolio, or resume using the Verification ID.
          </p>
        </section>
      </div>
    </div>
  )
}
