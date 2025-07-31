import React from "react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Terms of Service
          </h1>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p className="text-sm text-gray-600 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using Memic (accessible from memic.app), you are
              agreeing to be bound by these Terms of Service and agree that you
              are responsible for compliance with any applicable local laws. If
              you disagree with any of these terms, you are prohibited from
              using this platform. The materials, services, and AI-generated
              content contained in this platform are protected by copyright and
              intellectual property law.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              2. Platform Services
            </h2>
            <p>
              Memic provides an AI-powered resume building platform that
              includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Resume creation and editing tools</li>
              <li>AI-powered content suggestions and optimization</li>
              <li>Professional resume templates</li>
              <li>Export functionality (PDF, etc.)</li>
              <li>Account management and data storage</li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any part
              of our services at any time with reasonable notice to users.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              3. User License and Restrictions
            </h2>
            <p>
              Subject to your compliance with these Terms, Memic grants you a
              limited, non-exclusive, non-transferable license to access and use
              our platform for creating and managing your professional resumes.
              Under this license, you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Modify, copy, or reverse engineer any part of the platform
              </li>
              <li>
                Use the platform for any illegal, unauthorized, or commercial
                purposes beyond personal resume creation
              </li>
              <li>
                Attempt to gain unauthorized access to our systems or other
                users' accounts
              </li>
              <li>
                Remove any copyright, trademark, or proprietary notices from the
                platform
              </li>
              <li>
                Redistribute, resell, or transfer your access to another person
              </li>
              <li>
                Use the platform to create content that violates our content
                policies
              </li>
            </ul>
            <p>
              Violation of these restrictions may result in immediate
              termination of your account and access to the platform.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              4. User Content and Data
            </h2>
            <p>
              You retain ownership of all content you create and upload to
              Memic, including your resume content, personal information, and
              professional details. By using our platform, you grant Memic a
              limited license to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Store and process your content to provide our services</li>
              <li>
                Use your content to train and improve our AI algorithms
                (anonymized and aggregated)
              </li>
              <li>
                Generate suggestions and recommendations based on your content
              </li>
            </ul>
            <p>
              You are responsible for ensuring that all content you provide is
              accurate, truthful, and does not violate any third-party rights or
              applicable laws.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              5. Subscription and Payment Terms
            </h2>
            <p>
              Memic offers both free and premium subscription plans. Premium
              features require payment and are subject to the following terms:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions are billed in advance on a recurring basis</li>
              <li>
                You may cancel your subscription at any time through your
                account settings
              </li>
              <li>No refunds are provided for partial billing periods</li>
              <li>
                Subscription prices may change with reasonable advance notice
              </li>
              <li>
                Failure to pay may result in suspension or termination of
                premium features
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              6. AI-Generated Content
            </h2>
            <p>
              Our platform uses artificial intelligence to provide content
              suggestions and resume optimization. You understand and agree
              that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                AI-generated suggestions are provided as recommendations only
              </li>
              <li>
                You are responsible for reviewing and verifying all content
                before use
              </li>
              <li>
                Memic does not guarantee the accuracy or appropriateness of
                AI-generated content
              </li>
              <li>
                You should not rely solely on AI suggestions for critical career
                decisions
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              7. Disclaimer of Warranties
            </h2>
            <p>
              All services on Memic's platform are provided "as is" and "as
              available." Memic makes no warranties, whether express or implied,
              including but not limited to warranties of merchantability,
              fitness for a particular purpose, or non-infringement. We do not
              guarantee that our platform will be uninterrupted, error-free, or
              completely secure.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              8. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Memic and its suppliers
              will not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including but not limited to
              loss of profits, data, or other intangible losses resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use or inability to use the platform</li>
              <li>Any unauthorized access to or alteration of your data</li>
              <li>Any interruption or cessation of services</li>
              <li>Any bugs, viruses, or other harmful components</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              9. Account Termination
            </h2>
            <p>
              You may terminate your account at any time through your account
              settings. Memic may terminate or suspend your account if you
              violate these Terms of Service. Upon termination:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your access to premium features will cease immediately</li>
              <li>You may download your resume content for a limited period</li>
              <li>
                We may delete your data in accordance with our Privacy Policy
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              10. Updates and Modifications
            </h2>
            <p>
              The content and features on Memic's platform may include
              technical, typographical, or other errors. We reserve the right to
              change, update, or discontinue any aspect of our platform at any
              time without notice. We may revise these Terms of Service
              periodically, and your continued use constitutes acceptance of the
              revised terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              11. Third-Party Integrations
            </h2>
            <p>
              Our platform may integrate with or link to third-party services,
              including AI providers, payment processors, and other tools. Memic
              is not responsible for the content, policies, or practices of
              these third-party services. Your use of such services is at your
              own risk and subject to their respective terms of service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              12. Privacy Policy
            </h2>
            <p>
              Your privacy is important to us. Please review our{" "}
              <a
                href="/privacy-policy"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Privacy Policy
              </a>
              , which explains how we collect, use, and protect your information
              when you use our platform.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              13. Governing Law and Disputes
            </h2>
            <p>
              These Terms of Service and any disputes arising from your use of
              Memic shall be governed by and construed in accordance with the
              laws of the jurisdiction where Memic operates, without regard to
              conflict of law provisions. Any legal disputes will be resolved
              through binding arbitration where permitted by law.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              14. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Email:{" "}
                <a
                  href="mailto:hello@memic.app"
                  className="text-blue-600 hover:text-blue-800"
                >
                  hello@memic.app
                </a>
              </li>
              <li>Website: memic.app</li>
              <li>
                LinkedIn:{" "}
                <a
                  href="https://www.linkedin.com/company/memic-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  linkedin.com/company/memic-app
                </a>
              </li>
            </ul>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                By using Memic, you acknowledge that you have read, understood,
                and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
