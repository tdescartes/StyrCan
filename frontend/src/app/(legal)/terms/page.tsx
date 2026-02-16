import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to Home
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">
        Last Updated: February 16, 2026
      </p>

      <p className="lead">
        Welcome to Pulse. By accessing or using our service, you agree to be
        bound by these Terms of Service. Please read them carefully.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By creating an account, accessing, or using Pulse (&quot;Service&quot;), you
        acknowledge that you have read, understood, and agree to be bound by
        these Terms of Service (&quot;Terms&quot;) and our Privacy Policy. If you do not
        agree to these Terms, you may not use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Pulse is a business management platform that provides tools for
        employee management, financial tracking, payroll processing, and team
        communication. We offer various subscription tiers with different
        features and usage limits.
      </p>

      <h3>2.1 Service Tiers</h3>
      <ul>
        <li>
          <strong>Free:</strong> Limited access with basic features
        </li>
        <li>
          <strong>Employees:</strong> Full employee management features
        </li>
        <li>
          <strong>Finance:</strong> Complete financial tracking tools
        </li>
        <li>
          <strong>Payroll:</strong> Comprehensive payroll processing
        </li>
        <li>
          <strong>Communication:</strong> Team messaging and collaboration
        </li>
        <li>
          <strong>All Access:</strong> Complete access to all features
        </li>
      </ul>

      <h2>3. Account Registration</h2>

      <h3>3.1 Eligibility</h3>
      <p>
        You must be at least 18 years old and have the legal capacity to enter
        into contracts to use Pulse. By creating an account, you represent and
        warrant that you meet these requirements.
      </p>

      <h3>3.2 Account Security</h3>
      <p>
        You are responsible for maintaining the confidentiality of your account
        credentials and for all activities that occur under your account. You
        agree to:
      </p>
      <ul>
        <li>Provide accurate and complete registration information</li>
        <li>Maintain and update your information to keep it current</li>
        <li>Immediately notify us of any unauthorized use of your account</li>
        <li>Not share your account credentials with others</li>
      </ul>

      <h2>4. Payment and Billing</h2>

      <h3>4.1 Subscription Fees</h3>
      <p>
        Certain features of Pulse require payment of subscription fees. By
        subscribing to a paid plan, you agree to pay all applicable fees as
        described at the time of purchase.
      </p>

      <h3>4.2 Billing Cycle</h3>
      <p>
        Subscription fees are billed on a recurring basis (monthly or annually)
        at the start of each billing period. Your subscription will
        automatically renew unless you cancel before the renewal date.
      </p>

      <h3>4.3 Payment Methods</h3>
      <p>
        We use Stripe for payment processing. By providing payment information,
        you authorize us to charge your payment method for all fees incurred.
        You must keep your payment information current.
      </p>

      <h3>4.4 Refunds</h3>
      <p>
        Subscription fees are generally non-refundable except as required by
        law or as expressly stated in these Terms. We may provide refunds on a
        case-by-case basis at our sole discretion.
      </p>

      <h3>4.5 Failed Payments</h3>
      <p>
        If your payment fails, we will attempt to charge your payment method
        again. If payment remains unsuccessful, we may suspend or terminate
        your access to paid features.
      </p>

      <h2>5. Acceptable Use</h2>

      <h3>5.1 Prohibited Activities</h3>
      <p>You agree not to:</p>
      <ul>
        <li>
          Violate any laws, regulations, or third-party rights
        </li>
        <li>
          Upload or transmit viruses, malware, or malicious code
        </li>
        <li>
          Attempt to gain unauthorized access to our systems
        </li>
        <li>
          Interfere with or disrupt the Service or servers
        </li>
        <li>
          Use the Service for any unlawful or fraudulent purpose
        </li>
        <li>
          Impersonate any person or entity
        </li>
        <li>
          Scrape, spider, or harvest data without permission
        </li>
        <li>
          Reverse engineer or attempt to extract source code
        </li>
      </ul>

      <h3>5.2 Content Guidelines</h3>
      <p>
        You are solely responsible for all content you upload, transmit, or
        store using the Service. You must not upload content that is:
      </p>
      <ul>
        <li>Illegal, harmful, or offensive</li>
        <li>Infringing on intellectual property rights</li>
        <li>Confidential without authorization to share</li>
        <li>Containing personal data without lawful basis</li>
      </ul>

      <h2>6. Data and Privacy</h2>
      <p>
        Your use of the Service is also governed by our{" "}
        <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
          Privacy Policy
        </Link>
        , which describes how we collect, use, and protect your information.
      </p>

      <h3>6.1 Data Ownership</h3>
      <p>
        You retain all rights to your data. We do not claim ownership of any
        content you submit to the Service.
      </p>

      <h3>6.2 Data Security</h3>
      <p>
        We implement industry-standard security measures to protect your data.
        However, no system is completely secure, and we cannot guarantee
        absolute security.
      </p>

      <h2>7. Intellectual Property</h2>

      <h3>7.1 Our Rights</h3>
      <p>
        The Service, including all software, designs, text, graphics, and other
        content, is owned by us and protected by copyright, trademark, and
        other intellectual property laws.
      </p>

      <h3>7.2 License to Use</h3>
      <p>
        We grant you a limited, non-exclusive, non-transferable license to
        access and use the Service for your business purposes, subject to these
        Terms.
      </p>

      <h3>7.3 Restrictions</h3>
      <p>
        You may not copy, modify, distribute, sell, or lease any part of the
        Service or reverse engineer our software.
      </p>

      <h2>8. Service Availability</h2>

      <h3>8.1 Uptime</h3>
      <p>
        We strive to maintain high availability but do not guarantee
        uninterrupted access. The Service may be temporarily unavailable for
        maintenance, updates, or due to circumstances beyond our control.
      </p>

      <h3>8.2 Changes to Service</h3>
      <p>
        We reserve the right to modify, suspend, or discontinue any feature of
        the Service at any time with or without notice.
      </p>

      <h2>9. Termination</h2>

      <h3>9.1 Termination by You</h3>
      <p>
        You may cancel your subscription at any time through your account
        settings or by contacting support. Cancellation will take effect at the
        end of your current billing period.
      </p>

      <h3>9.2 Termination by Us</h3>
      <p>
        We may suspend or terminate your account if you violate these Terms,
        fail to pay fees, or for any other reason at our discretion. We will
        provide notice when reasonably possible.
      </p>

      <h3>9.3 Effect of Termination</h3>
      <p>
        Upon termination, your right to use the Service will immediately cease.
        We may delete your data after a reasonable period unless required by
        law to retain it.
      </p>

      <h2>10. Disclaimers</h2>

      <h3>10.1 &quot;As Is&quot; Basis</h3>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
        OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
        WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
        NON-INFRINGEMENT.
      </p>

      <h3>10.2 Professional Advice</h3>
      <p>
        Pulse is a tool to assist with business management. It does not
        constitute legal, financial, accounting, or tax advice. You should
        consult with qualified professionals for such matters.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY
        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
        ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
        INDIRECTLY, OR ANY LOSS OF DATA, USE, OR GOODWILL.
      </p>
      <p>
        OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO
        THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE
        MONTHS PRECEDING THE CLAIM.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless Pulse and its
        officers, directors, employees, and agents from any claims, damages,
        losses, liabilities, and expenses (including legal fees) arising from:
      </p>
      <ul>
        <li>Your use of the Service</li>
        <li>Your violation of these Terms</li>
        <li>Your violation of any third-party rights</li>
        <li>Your content or data</li>
      </ul>

      <h2>13. Dispute Resolution</h2>

      <h3>13.1 Governing Law</h3>
      <p>
        These Terms shall be governed by and construed in accordance with the
        laws of [Your Jurisdiction], without regard to conflict of law
        principles.
      </p>

      <h3>13.2 Arbitration</h3>
      <p>
        Any dispute arising from these Terms shall be resolved through binding
        arbitration in accordance with [Arbitration Rules], except where
        prohibited by law.
      </p>

      <h2>14. General Provisions</h2>

      <h3>14.1 Entire Agreement</h3>
      <p>
        These Terms, together with our Privacy Policy, constitute the entire
        agreement between you and Pulse regarding the Service.
      </p>

      <h3>14.2 Amendments</h3>
      <p>
        We may modify these Terms at any time by posting the updated Terms on
        our website. Your continued use of the Service after changes constitutes
        acceptance of the new Terms.
      </p>

      <h3>14.3 Severability</h3>
      <p>
        If any provision of these Terms is found to be unenforceable, the
        remaining provisions will remain in full force and effect.
      </p>

      <h3>14.4 Waiver</h3>
      <p>
        Our failure to enforce any right or provision of these Terms does not
        constitute a waiver of that right or provision.
      </p>

      <h3>14.5 Assignment</h3>
      <p>
        You may not assign or transfer these Terms without our prior written
        consent. We may assign our rights and obligations without restriction.
      </p>

      <h2>15. Contact Information</h2>
      <p>
        If you have questions about these Terms, please contact us at:
      </p>
      <ul className="list-none">
        <li>
          <strong>Email:</strong> legal@pulse.com
        </li>
        <li>
          <strong>Address:</strong> [Your Company Address]
        </li>
      </ul>

      <div className="mt-12 p-6 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> These Terms of Service are provided as a
          template and should be reviewed and customized by a qualified attorney
          before use in production. They may not be suitable for all
          jurisdictions or business models.
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
