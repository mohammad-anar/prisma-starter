/**
 * Professional, mobile-friendly email templates with ফুলপুর ব্লাড ডোনার নেটওয়ার্ক branding.
 */

const baseStyles = `
  body {
    margin: 0;
    padding: 0;
    background-color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 600px;
    margin: 20px auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid #e2e8f0;
  }
  .header {
    background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
    color: #ffffff;
    padding: 32px 24px;
    text-align: center;
  }
  .brand-title {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin: 0 0 6px 0;
  }
  .brand-subtitle {
    font-size: 13px;
    opacity: 0.9;
    margin: 0;
    letter-spacing: 0.5px;
  }
  .content {
    padding: 32px 28px;
    line-height: 1.6;
    font-size: 15px;
    color: #334155;
  }
  .greeting {
    font-size: 17px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 16px;
  }
  .action-box {
    text-align: center;
    margin: 28px 0;
  }
  .btn-primary {
    display: inline-block;
    background-color: #dc2626;
    color: #ffffff !important;
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
    padding: 13px 32px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
  }
  .token-code {
    display: inline-block;
    background-color: #f1f5f9;
    border: 1px dashed #cbd5e1;
    color: #0f172a;
    font-family: 'Courier New', Courier, monospace;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 2px;
    padding: 10px 24px;
    border-radius: 6px;
    margin: 12px 0;
  }
  .security-notice {
    margin-top: 24px;
    padding: 16px;
    background-color: #fff1f2;
    border-left: 4px solid #f43f5e;
    border-radius: 4px;
    font-size: 13px;
    color: #881337;
  }
  .footer {
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
  }
`;

export interface VerificationEmailProps {
  name: string;
  verificationUrl: string;
  token: string;
}

export const renderVerificationEmail = ({
  name,
  verificationUrl,
  token,
}: VerificationEmailProps): { subject: string; html: string; text: string } => {
  const subject = "ফুলপুর ব্লাড ডোনার নেটওয়ার্ক - ইমেইল ভেরিফিকেশন";
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">ফুলপুর ব্লাড ডোনার নেটওয়ার্ক</h1>
      <p class="brand-subtitle">মানবতার কল্যাণে এক ফোটা রক্ত, একটি জীবন</p>
    </div>
    <div class="content">
      <div class="greeting">আসসালামু আলাইকুম, ${name || "সম্মানিত ব্যবহারকারী"}!</div>
      <p>
        ফুলপুর ব্লাড ডোনার নেটওয়ার্কে আপনার ইমেইল ঠিকানা সফলভাবে যুক্ত বা পরিবর্তন করার জন্য ধন্যবাদ।
        আপনার ইমেইল ঠিকানাটি নিশ্চিত করতে নিচের বোতামটিতে ক্লিক করুন:
      </p>

      <div class="action-box">
        <a href="${verificationUrl}" class="btn-primary" target="_blank" rel="noopener noreferrer">
          ইমেইল নিশ্চিত করুন (Verify Email)
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center;">
        অথবা যদি বোতামটি কাজ না করে, নিচের টোকেন কোডটি ব্যবহার করুন:
      </p>
      <div class="action-box">
        <span class="token-code">${token}</span>
      </div>

      <div class="security-notice">
        <strong>সতর্কতা:</strong> এই ভেরিফিকেশন লিঙ্ক ও কোডটি আগামী ২৪ ঘণ্টার জন্য কার্যকর থাকবে। আপনি যদি এই অনুরোধ না করে থাকেন, তবে নির্দ্বিধায় এই ইমেইলটি উপেক্ষা করুন।
      </div>
    </div>
    <div class="footer">
      <p><strong>ফুলপুর ব্লাড ডোনার নেটওয়ার্ক</strong></p>
      <p>ফুলপুর, ময়মনসিংহ, বাংলাদেশ</p>
      <p>জীবন বাঁচাতে রক্তদানে এগিয়ে আসুন।</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
আসসালামু আলাইকুম, ${name || "সম্মানিত ব্যবহারকারী"}!

ফুলপুর ব্লাড ডোনার নেটওয়ার্কে আপনার ইমেইল নিশ্চিত করার জন্য নিচের লিঙ্কে প্রবেশ করুন:
${verificationUrl}

অথবা ভেরিফিকেশন কোড: ${token}

লিঙ্কটি ২৪ ঘণ্টা কার্যকর থাকবে।
ফুলপুর ব্লাড ডোনার নেটওয়ার্ক
  `.trim();

  return { subject, html, text };
};

export interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  token: string;
}

export const renderPasswordResetEmail = ({
  name,
  resetUrl,
  token,
}: PasswordResetEmailProps): { subject: string; html: string; text: string } => {
  const subject = "ফুলপুর ব্লাড ডোনার নেটওয়ার্ক - পাসওয়ার্ড রিসেট নির্দেশিকা";
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">ফুলপুর ব্লাড ডোনার নেটওয়ার্ক</h1>
      <p class="brand-subtitle">পাসওয়ার্ড পুনরুদ্ধার অনুরোধ</p>
    </div>
    <div class="content">
      <div class="greeting">আসসালামু আলাইকুম, ${name || "সম্মানিত সদস্য"}!</div>
      <p>
        আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার একটি অনুরোধ পাওয়া গেছে।
        নতুন পাসওয়ার্ড সেট করতে নিচের বোতামটিতে ক্লিক করুন:
      </p>

      <div class="action-box">
        <a href="${resetUrl}" class="btn-primary" target="_blank" rel="noopener noreferrer">
          পাসওয়ার্ড রিসেট করুন (Reset Password)
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center;">
        অথবা রিসেট কোডটি ব্যবহার করুন:
      </p>
      <div class="action-box">
        <span class="token-code">${token}</span>
      </div>

      <div class="security-notice">
        <strong>নিরাপত্তা সতর্কতা:</strong> এই একক-ব্যবহারের লিঙ্ক ও কোডটি মাত্র ১৫ মিনিটের জন্য সক্রিয় থাকবে।
        আপনি যদি এই পাসওয়ার্ড পরিবর্তনের অনুরোধ না করে থাকেন, তবে অবিলম্বে আমাদের সাথে যোগাযোগ করুন। আপনার অ্যাকাউন্ট এখনও সুরক্ষিত রয়েছে।
      </div>
    </div>
    <div class="footer">
      <p><strong>ফুলপুর ব্লাড ডোনার নেটওয়ার্ক</strong></p>
      <p>ফুলপুর, ময়মনসিংহ, বাংলাদেশ</p>
      <p>আপনার নিরাপত্তা আমাদের সর্বোচ্চ অগ্রাধিকার।</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
আসসালামু আলাইকুম, ${name || "সম্মানিত সদস্য"}!

আপনার পাসওয়ার্ড রিসেট করার জন্য নিচের লিঙ্কে প্রবেশ করুন:
${resetUrl}

অথবা রিসেট কোড: ${token}

এই কোডটি ১৫ মিনিটের জন্য সক্রিয় থাকবে।
ফুলপুর ব্লাড ডোনার নেটওয়ার্ক
  `.trim();

  return { subject, html, text };
};

export interface PasswordChangedEmailProps {
  name: string;
}

export const renderPasswordChangedEmail = ({
  name,
}: PasswordChangedEmailProps): { subject: string; html: string; text: string } => {
  const subject = "ফুলপুর ব্লাড ডোনার নেটওয়ার্ক - পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে";
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">ফুলপুর ব্লাড ডোনার নেটওয়ার্ক</h1>
      <p class="brand-subtitle">অ্যাকাউন্ট নিরাপত্তা বিজ্ঞপ্তি</p>
    </div>
    <div class="content">
      <div class="greeting">আসসালামু আলাইকুম, ${name || "সম্মানিত সদস্য"}!</div>
      <p>
        আপনার ফুলপুর ব্লাড ডোনার নেটওয়ার্ক অ্যাকাউন্টের পাসওয়ার্ড এইমাত্র সফলভাবে পরিবর্তন করা হয়েছে।
      </p>
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 14px 18px; border-radius: 4px; margin: 20px 0; color: #14532d; font-size: 14px;">
        ✓ পাসওয়ার্ড পরিবর্তন সম্পন্ন হয়েছে।
      </div>
      <div class="security-notice">
        <strong>সতর্কতা:</strong> আপনি যদি এই পরিবর্তন না করে থাকেন, তবে অনতিবিলম্বে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করে আপনার অ্যাকাউন্ট পুনরুদ্ধার করুন।
      </div>
    </div>
    <div class="footer">
      <p><strong>ফুলপুর ব্লাড ডোনার নেটওয়ার্ক</strong></p>
      <p>ফুলপুর, ময়মনসিংহ, বাংলাদেশ</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
আসসালামু আলাইকুম, ${name || "সম্মানিত সদস্য"}!

আপনার অ্যাকাউন্টের পাসওয়ার্ড এইমাত্র সফলভাবে পরিবর্তন করা হয়েছে।
আপনি যদি এই পরিবর্তন না করে থাকেন, তবে অনতিবিলম্বে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।

ফুলপুর ব্লাড ডোনার নেটওয়ার্ক
  `.trim();

  return { subject, html, text };
};
