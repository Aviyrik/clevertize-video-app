import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Printer,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Lock,
  Building2,
  Scale,
} from 'lucide-react';

export default function LegalDocumentModal({
  isOpen,
  onClose,
  initialTab = 'terms', // 'terms' | 'privacy'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === 'privacy' ? 'privacy' : 'terms');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 7, 15, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: '#0D0F18',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(99, 102, 241, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#E5E7EB',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            backgroundColor: 'rgba(18, 20, 32, 0.8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#818CF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <Scale size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                CleverCuts Legal & Policy
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                Commercial video creation platform policies
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handlePrint}
              title="Print document"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#D1D5DB',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#D1D5DB';
              }}
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#9CA3AF';
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: 'rgba(13, 15, 24, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: activeTab === 'terms' ? 700 : 500,
              backgroundColor: activeTab === 'terms' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'terms' ? '#818CF8' : '#9CA3AF',
              border: activeTab === 'terms' ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={15} />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: activeTab === 'privacy' ? 700 : 500,
              backgroundColor: activeTab === 'privacy' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'privacy' ? '#818CF8' : '#9CA3AF',
              border: activeTab === 'privacy' ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={15} />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 32px',
            fontSize: 13,
            lineHeight: 1.65,
            color: '#D1D5DB',
          }}
        >
          {activeTab === 'terms' ? (
            <div>
              {/* Document Header */}
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '3px 8px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#818CF8',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    Standard SaaS Terms
                  </span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Effective: October 2026 • Version 2.4</span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 8px', letterSpacing: '-0.02em' }}>
                  CleverCuts Terms of Service
                </h1>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                  Please read these Terms of Service carefully before accessing or using the CleverCuts commercial video creation studio.
                </p>
              </div>

              {/* Highlight Box */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <CheckCircle2 size={18} style={{ color: '#818CF8', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: '#E0E7FF', lineHeight: 1.55 }}>
                  <strong style={{ color: '#FFFFFF' }}>Commercial Ownership Guarantee:</strong> You retain 100% full commercial rights to the video ads, scripts, and promotional assets you produce with CleverCuts. You are free to run them on Instagram, YouTube, television, websites, or any paid advertising channel.
                </div>
              </div>

              {/* Section 1 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  1. Acceptance of Terms
                </h3>
                <p style={{ margin: 0 }}>
                  By registering an account, accessing, or using CleverCuts (&ldquo;the Service&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you are entering into this agreement on behalf of a business or legal entity, you represent that you have the authority to bind such entity.
                </p>
              </div>

              {/* Section 2 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  2. Service Description & AI Generation
                </h3>
                <p style={{ margin: 0 }}>
                  CleverCuts is an AI-powered creative dashboard and video production studio designed for businesses, agencies, and retail brands. The platform synthesizes marketing briefs, generates story concepts and scripts, and coordinates video synthesis through neural generative video models (including Magnific AI and large language models). While we provide high-fidelity generation tools, output depends upon the user&rsquo;s prompts, settings, and business context.
                </p>
              </div>

              {/* Section 3 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  3. User Accounts & Security
                </h3>
                <p style={{ margin: 0 }}>
                  To access features of the platform, you must register with a valid email address and secure password. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access or security breach.
                </p>
              </div>

              {/* Section 4 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  4. Intellectual Property & Commercial Usage Rights
                </h3>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Your Content & Outputs:</strong> As between you and CleverCuts, you own all rights, title, and interest in and to your input materials (logos, product photos, business information) and the resulting generated video ads and scripts produced for your account, subject to applicable third-party model terms.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Platform IP:</strong> CleverCuts, including its interface design, software code, creative direction engines, scoring algorithms, and brand trademarks, remain the exclusive intellectual property of CleverCuts and its licensors.
                </p>
              </div>

              {/* Section 5 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  5. Acceptable Use Policy
                </h3>
                <p style={{ margin: '0 0 8px' }}>You agree not to use the Service to create or disseminate:</p>
                <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
                  <li>False, deceptive, or misleading advertising that violates consumer protection regulations.</li>
                  <li>Defamatory, fraudulent, harassing, obscene, or hateful content.</li>
                  <li>Content that infringes upon the intellectual property, copyright, or publicity rights of any third party.</li>
                  <li>Automated scraping, reverse-engineering, denial-of-service attacks, or excessive API rate abuse.</li>
                </ul>
                <p style={{ margin: 0 }}>
                  We reserve the right to suspend or terminate accounts that violate our acceptable use guidelines.
                </p>
              </div>

              {/* Section 6 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  6. Third-Party Integrations & Generation Latency
                </h3>
                <p style={{ margin: 0 }}>
                  Video rendering and frame synthesis rely on state-of-the-art neural diffusion pipelines (including Magnific AI). Processing times may fluctuate based on global cloud infrastructure demand and render queue length. CleverCuts coordinates, polls, and delivers final high-definition MP4 renders once completed by the rendering cluster.
                </p>
              </div>

              {/* Section 7 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  7. Subscriptions, Credits & Billing
                </h3>
                <p style={{ margin: 0 }}>
                  Certain features, video render allocations, or export resolutions may be subject to subscription plans or usage credits. Any fees are disclosed prior to purchase and are non-refundable except where required by law. All billing transactions are securely handled through accredited payment gateways.
                </p>
              </div>

              {/* Section 8 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  8. Disclaimers & Limitation of Liability
                </h3>
                <p style={{ margin: 0 }}>
                  The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, either express or implied. To the maximum extent permitted by applicable law, CleverCuts shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from the use or inability to use the platform.
                </p>
              </div>

              {/* Section 9 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  9. Account Deletion & Termination
                </h3>
                <p style={{ margin: 0 }}>
                  You may close and permanently delete your CleverCuts account at any time via Account Settings. Deletion irreversibly purges your authentication credentials, business profiles, saved project scripts, and associated video records.
                </p>
              </div>

              {/* Section 10 */}
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  10. Contact Information
                </h3>
                <p style={{ margin: 0 }}>
                  If you have questions regarding these Terms of Service, please reach out to our legal department at{' '}
                  <span style={{ color: '#818CF8' }}>legal@clevercuts.ai</span> or through our support channels.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Document Header */}
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '3px 8px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#818CF8',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    Data Privacy & Security
                  </span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Effective: October 2026 • Version 2.4</span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 8px', letterSpacing: '-0.02em' }}>
                  CleverCuts Privacy Policy
                </h1>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                  Learn how CleverCuts collects, utilizes, and protects your business context, uploaded brand assets, and personal information.
                </p>
              </div>

              {/* Highlight Box */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <Lock size={18} style={{ color: '#818CF8', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: '#E0E7FF', lineHeight: 1.55 }}>
                  <strong style={{ color: '#FFFFFF' }}>Privacy First Commitment:</strong> We never sell your personal data or uploaded brand media to data brokers or advertising exchanges. Your brand details and product imagery are used exclusively to create your commercial video ads.
                </div>
              </div>

              {/* Section 1 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  1. Information We Collect
                </h3>
                <p style={{ margin: '0 0 8px' }}>We collect information necessary to deliver video creation workflows:</p>
                <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
                  <li><strong>Account Credentials:</strong> Full name, email address, encrypted password hash, and profile avatar.</li>
                  <li><strong>Brand & Business Context:</strong> Business name, industry category, location / town, brand tone, and target audience descriptors.</li>
                  <li><strong>Uploaded Creative Assets:</strong> Brand logos and product reference photos uploaded for video production.</li>
                  <li><strong>Generated Content:</strong> Commercial scripts, storyboard scenes, shot specifications, and generated video MP4 files.</li>
                  <li><strong>Technical Usage:</strong> Browser metadata, IP addresses, error logs, and session timestamps for platform security and debugging.</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  2. How We Use Your Information
                </h3>
                <p style={{ margin: '0 0 8px' }}>Your data is processed strictly for the following purposes:</p>
                <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
                  <li>To generate personalized ad concepts, hooks, and formatted broadcast scripts tailored to your brand.</li>
                  <li>To orchestrate neural video synthesis and deliver finished video files.</li>
                  <li>To maintain, authenticate, and secure your saved projects and multi-business profiles.</li>
                  <li>To diagnose system errors, prevent fraudulent activities, and maintain service reliability.</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  3. Third-Party AI Processors & Cloud Infrastructure
                </h3>
                <p style={{ margin: 0 }}>
                  To perform generative operations, text prompts and image references are transmitted over encrypted HTTPS to vetted infrastructure partners (including Anthropic for script synthesis, Magnific AI for neural video rendering, and Supabase / PostgreSQL for database hosting). These processors are bound by strict data processing confidentiality agreements and do not train public models on your proprietary business assets.
                </p>
              </div>

              {/* Section 4 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  4. Data Security & Storage Standards
                </h3>
                <p style={{ margin: 0 }}>
                  We implement enterprise-grade security protocols, including Row Level Security (RLS) on database tables, salted password hashing, JWT cryptographic session validation, and TLS 1.3 encryption for all data in transit. Access to production databases is restricted to authorized engineers on a principle of least privilege.
                </p>
              </div>

              {/* Section 5 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  5. Your Privacy Rights & Control
                </h3>
                <p style={{ margin: '0 0 8px' }}>
                  Under applicable global data protection regulations (including GDPR and CCPA/CPRA), you hold comprehensive rights over your personal data:
                </p>
                <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
                  <li><strong>Right to Access & Export:</strong> You can view and copy your scripts and videos anytime from the dashboard.</li>
                  <li><strong>Right to Rectification:</strong> You can edit and update business profiles and user details at will.</li>
                  <li><strong>Right to Permanent Erasure:</strong> Clicking &ldquo;Delete Account&rdquo; in Account Settings irrevocably wipes all your personal data, business profiles, and video records from our servers.</li>
                </ul>
              </div>

              {/* Section 6 */}
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  6. Local Storage & Session State
                </h3>
                <p style={{ margin: 0 }}>
                  CleverCuts uses browser <code>localStorage</code> strictly for functional purposes: remembering your authentication token, saving your login email (if &ldquo;Remember me&rdquo; is checked), and persisting your preferred studio mode (Simple Studio vs. Director Mode). We do not use intrusive third-party cross-site advertising cookies.
                </p>
              </div>

              {/* Section 7 */}
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                  7. Contact the Privacy Team
                </h3>
                <p style={{ margin: 0 }}>
                  If you have inquiries about this Privacy Policy or wish to submit a data subject request, please contact our Data Protection Officer at{' '}
                  <span style={{ color: '#818CF8' }}>privacy@clevercuts.ai</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(18, 20, 32, 0.95)',
          }}
        >
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            {activeTab === 'terms' ? 'Reading CleverCuts Terms of Service' : 'Reading CleverCuts Privacy Policy'}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              backgroundColor: 'var(--accent-primary, #6366F1)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
}
