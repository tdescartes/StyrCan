import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to Home
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last Updated: February 16, 2026
      </p>

      <p className="lead">
        At Pulse, we take your privacy seriously. This Privacy Policy explains
        how we collect, use, disclose, and safeguard your information when you
        use our service.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Information You Provide</h3>
      <p>We collect information that you voluntarily provide to us:</p>
      <ul>
        <li>
          <strong>Account Information:</strong> Name, email address, password,
          company name, phone number, and billing address
        </li>
        <li>
          <strong>Employee Data:</strong> Employee names, contact information,
          job titles, salaries, tax information, and performance records
        </li>
        <li>
          <strong>Financial Data:</strong> Transaction records, expense
          categories, invoice details, and payroll information
        </li>
        <li>
          <strong>Communication Data:</strong> Messages, files, and other
          content you share through the Service
        </li>
        <li>
          <strong>Payment Information:</strong> Credit card details and billing
          history (processed securely through Stripe)
        </li>
      </ul>

      <h3>1.2 Automatically Collected Information</h3>
      <p>We automatically collect certain information when you use the Service:</p>
      <ul>
        <li>
          <strong>Usage Data:</strong> Pages visited, features used, time spent,
          and interaction patterns
        </li>
        <li>
          <strong>Device Information:</strong> IP address, browser type, operating
          system, and device identifiers
        </li>
        <li>
          <strong>Log Data:</strong> Access times, error logs, and system activity
        </li>
        <li>
          <strong>Cookies:</strong> Session cookies, preference cookies, and
          analytics cookies
        </li>
      </ul>

      <h3>1.3 Information from Third Parties</h3>
      <p>We may receive information from:</p>
      <ul>
        <li>
          <strong>Payment Processors:</strong> Transaction confirmations from
          Stripe
        </li>
        <li>
          <strong>Analytics Services:</strong> Usage statistics and performance
          data
        </li>
        <li>
          <strong>Authentication Providers:</strong> If you sign in through
          third-party services
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>

      <h3>2.1 Service Provision</h3>
      <p>We use your information to:</p>
      <ul>
        <li>Provide, maintain, and improve the Service</li>
        <li>Process transactions and send billing information</li>
        <li>Manage your account and subscriptions</li>
        <li>Enable communication features</li>
        <li>Generate reports and analytics</li>
      </ul>

      <h3>2.2 Communication</h3>
      <p>We may use your information to:</p>
      <ul>
        <li>Send transactional emails (receipts, password resets)</li>
        <li>Provide customer support</li>
        <li>Send service announcements</li>
        <li>Request feedback (you can opt out)</li>
      </ul>

      <h3>2.3 Security and Compliance</h3>
      <p>We use your information to:</p>
      <ul>
        <li>Detect and prevent fraud and abuse</li>
        <li>Monitor and analyze security incidents</li>
        <li>Comply with legal obligations</li>
        <li>Enforce our Terms of Service</li>
      </ul>

      <h3>2.4 Product Development</h3>
      <p>We may use aggregated, anonymized data to:</p>
      <ul>
        <li>Understand usage patterns</li>
        <li>Develop new features</li>
        <li>Improve user experience</li>
        <li>Conduct research and analytics</li>
      </ul>

      <h2>3. Legal Basis for Processing (GDPR)</h2>
      <p>
        If you are in the European Economic Area (EEA), we process your
        information based on the following legal grounds:
      </p>
      <ul>
        <li>
          <strong>Contract Performance:</strong> To provide the Service and
          fulfill our contractual obligations
        </li>
        <li>
          <strong>Legitimate Interests:</strong> To improve our Service, prevent
          fraud, and ensure security
        </li>
        <li>
          <strong>Consent:</strong> For marketing communications and optional
          features (you can withdraw consent)
        </li>
        <li>
          <strong>Legal Obligations:</strong> To comply with laws and regulations
        </li>
      </ul>

      <h2>4. How We Share Your Information</h2>

      <h3>4.1 Service Providers</h3>
      <p>We share information with trusted third-party service providers:</p>
      <ul>
        <li>
          <strong>Stripe:</strong> Payment processing
        </li>
        <li>
          <strong>SendGrid:</strong> Transactional email delivery
        </li>
        <li>
          <strong>AWS:</strong> Cloud hosting and file storage
        </li>
        <li>
          <strong>Sentry:</strong> Error monitoring and diagnostics
        </li>
      </ul>
      <p>
        These providers are contractually obligated to protect your information
        and use it only for the services they provide to us.
      </p>

      <h3>4.2 Business Transfers</h3>
      <p>
        If Pulse is involved in a merger, acquisition, or sale of assets, your
        information may be transferred. We will notify you before your
        information becomes subject to a different privacy policy.
      </p>

      <h3>4.3 Legal Requirements</h3>
      <p>We may disclose your information if required to:</p>
      <ul>
        <li>Comply with legal processes or government requests</li>
        <li>Enforce our Terms of Service</li>
        <li>Protect the rights, property, or safety of Pulse, our users, or
          others
        </li>
        <li>Investigate fraud or security issues</li>
      </ul>

      <h3>4.4 With Your Consent</h3>
      <p>
        We may share your information for other purposes with your explicit
        consent.
      </p>

      <h2>5. Data Security</h2>

      <h3>5.1 Security Measures</h3>
      <p>We implement industry-standard security measures:</p>
      <ul>
        <li>
          <strong>Encryption:</strong> Data encrypted in transit (TLS/SSL) and at
          rest (AES-256)
        </li>
        <li>
          <strong>Authentication:</strong> Password hashing with bcrypt, optional
          two-factor authentication
        </li>
        <li>
          <strong>Access Controls:</strong> Role-based access and multi-tenancy
          isolation
        </li>
        <li>
          <strong>Monitoring:</strong> Automated security monitoring and audit
          logs
        </li>
        <li>
          <strong>Regular Audits:</strong> Periodic security assessments and
          penetration testing
        </li>
      </ul>

      <h3>5.2 Limitations</h3>
      <p>
        While we strive to protect your information, no method of transmission
        or storage is 100% secure. We cannot guarantee absolute security.
      </p>

      <h2>6. Data Retention</h2>

      <h3>6.1 Active Accounts</h3>
      <p>
        We retain your information for as long as your account is active and as
        necessary to provide the Service.
      </p>

      <h3>6.2 Deleted Accounts</h3>
      <p>
        After account deletion, we retain certain information for:
      </p>
      <ul>
        <li>Legal compliance (e.g., tax records, transaction history)</li>
        <li>Fraud prevention and security</li>
        <li>Backup systems (typically 30-90 days)</li>
      </ul>

      <h3>6.3 Anonymized Data</h3>
      <p>
        We may retain anonymized, aggregated data indefinitely for analytics and
        research purposes.
      </p>

      <h2>7. Your Rights</h2>

      <h3>7.1 Access and Portability</h3>
      <p>
        You have the right to access your personal data and request a copy in a
        structured, machine-readable format.
      </p>

      <h3>7.2 Correction</h3>
      <p>
        You can update your information through your account settings. Contact us
        if you need assistance.
      </p>

      <h3>7.3 Deletion</h3>
      <p>
        You can request deletion of your account and personal data. Some
        information may be retained as described in Section 6.
      </p>

      <h3>7.4 Objection and Restriction</h3>
      <p>
        You can object to certain data processing activities or request
        restriction of processing.
      </p>

      <h3>7.5 Withdraw Consent</h3>
      <p>
        Where we rely on consent, you can withdraw it at any time without
        affecting prior processing.
      </p>

      <h3>7.6 Opt-Out</h3>
      <p>
        You can opt out of marketing communications through unsubscribe links or
        account settings.
      </p>

      <h3>7.7 Complaints</h3>
      <p>
        If you are in the EEA, you have the right to lodge a complaint with your
        local data protection authority.
      </p>

      <h2>8. International Data Transfers</h2>
      <p>
        Your information may be transferred to and processed in countries other
        than your own. We ensure adequate safeguards are in place:
      </p>
      <ul>
        <li>Standard Contractual Clauses approved by the European Commission</li>
        <li>Privacy Shield certification (where applicable)</li>
        <li>Other mechanisms recognized under data protection laws</li>
      </ul>

      <h2>9. Children&apos;s Privacy</h2>
      <p>
        Pulse is not intended for children under 18. We do not knowingly collect
        personal information from children. If we learn we have collected
        information from a child under 18, we will delete it promptly.
      </p>

      <h2>10. Cookies and Tracking</h2>

      <h3>10.1 Types of Cookies</h3>
      <p>We use the following types of cookies:</p>
      <ul>
        <li>
          <strong>Essential Cookies:</strong> Required for the Service to function
          (authentication, session management)
        </li>
        <li>
          <strong>Functional Cookies:</strong> Remember your preferences and
          settings
        </li>
        <li>
          <strong>Analytics Cookies:</strong> Help us understand how you use the
          Service
        </li>
      </ul>

      <h3>10.2 Cookie Management</h3>
      <p>
        You can control cookies through your browser settings. Note that
        disabling essential cookies may affect Service functionality.
      </p>

      <h2>11. California Privacy Rights (CCPA)</h2>
      <p>
        If you are a California resident, you have additional rights:
      </p>
      <ul>
        <li>
          <strong>Right to Know:</strong> Request disclosure of personal
          information collected
        </li>
        <li>
          <strong>Right to Delete:</strong> Request deletion of personal
          information
        </li>
        <li>
          <strong>Right to Opt-Out:</strong> Opt out of sale of personal
          information (we do not sell personal information)
        </li>
        <li>
          <strong>Non-Discrimination:</strong> We will not discriminate against
          you for exercising your rights
        </li>
      </ul>

      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you
        of material changes by:
      </p>
      <ul>
        <li>Posting the updated policy on our website</li>
        <li>Updating the &quot;Last Updated&quot; date</li>
        <li>Sending an email notification (for significant changes)</li>
      </ul>
      <p>
        Your continued use of the Service after changes constitutes acceptance of
        the updated policy.
      </p>

      <h2>13. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or wish to exercise your
        rights, please contact us:
      </p>
      <ul className="list-none">
        <li>
          <strong>Email:</strong> privacy@pulse.com
        </li>
        <li>
          <strong>Data Protection Officer:</strong> dpo@pulse.com
        </li>
        <li>
          <strong>Address:</strong> [Your Company Address]
        </li>
      </ul>

      <h2>14. Additional Information for EEA Users</h2>

      <h3>14.1 Data Controller</h3>
      <p>
        Pulse is the data controller responsible for your personal information.
      </p>

      <h3>14.2 Data Protection Officer</h3>
      <p>
        Our Data Protection Officer can be reached at dpo@pulse.com.
      </p>

      <h3>14.3 Legal Basis Summary</h3>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Purpose</th>
            <th className="border border-gray-300 p-2">Legal Basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2">Service provision</td>
            <td className="border border-gray-300 p-2">Contract performance</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2">Security and fraud prevention</td>
            <td className="border border-gray-300 p-2">Legitimate interests</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2">Marketing communications</td>
            <td className="border border-gray-300 p-2">Consent</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2">Legal compliance</td>
            <td className="border border-gray-300 p-2">Legal obligation</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-12 p-6 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> This Privacy Policy is provided as a template
          and should be reviewed and customized by a qualified attorney before use
          in production. It may not address all legal requirements for all
          jurisdictions.
        </p>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
