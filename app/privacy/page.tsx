"use client";

import { useRouter } from "next/navigation";
import { Box, Paper, Typography, Button } from "@mui/material";
import { useT } from "@/i18n/I18nProvider";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect personal information you provide during registration and consultation booking, including your name, email, mobile number, date of birth, time of birth, birth place, city, state, country, selfie photo, and problem description. We also collect payment transaction details processed through PhonePe.",
  },
  {
    title: "2. How We Use Your Information",
    body: "Your information is used solely for: providing astrological and spiritual consultation services, scheduling appointments, communicating regarding your consultations, processing payments, and assigning sadhna documents. We do not use your data for marketing or advertising purposes.",
  },
  {
    title: "3. Data Storage & Security",
    body: "Your data is stored securely on our servers with encrypted passwords (bcrypt hashing). We use HTTPS for all data transmission, JWT-based authentication, and rate-limited APIs. Uploaded files (selfies, analysis documents) are stored on our server and accessible only to you and the admin.",
  },
  {
    title: "4. Data Sharing",
    body: "We do not sell, trade, or share your personal information with any third parties. Your consultation details, birth information, and personal records are strictly confidential between you and Shri Mayuresh Guruji Vispute.",
  },
  {
    title: "5. Payment Information",
    body: "Payment processing is handled by PhonePe. We do not store your credit/debit card numbers or UPI details on our servers. Only transaction reference IDs are stored for verification purposes.",
  },
  {
    title: "6. Cookies & Local Storage",
    body: "We use browser local storage to maintain your login session and language preference. We use a cookie for authentication token. No third-party tracking cookies are used.",
  },
  {
    title: "7. Your Rights",
    body: "You have the right to: view and edit your profile information at any time, request deletion of your account and associated data by contacting the admin, and access all your consultation records, documents, and recordings shared with you.",
  },
  {
    title: "8. Data Retention",
    body: "Your data is retained for as long as your account is active. Consultation records and assigned documents are kept indefinitely for your reference. If you request account deletion, all personal data will be removed within 30 days.",
  },
  {
    title: "9. Children's Privacy",
    body: "Our services are not intended for individuals under 18 years of age. If a consultation is being booked for a minor, it must be done by their parent or legal guardian.",
  },
  {
    title: "10. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. Any changes will be reflected on this page with the updated date. Continued use of our services after changes constitutes acceptance of the revised policy.",
  },
  {
    title: "11. Contact",
    body: "For any privacy-related questions or data requests, please reach out via the Queries section in your dashboard or contact the admin directly.",
  },
];

export default function Privacy() {
  const router = useRouter();
  const { t } = useT();
  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-6 md:py-12 px-2 sm:px-4">
      <Paper
        elevation={0}
        className="!max-w-[820px] !mx-auto !w-full !p-5 sm:!p-8 md:!p-12 !rounded-2xl md:!rounded-[2.5rem] !bg-brand-ivory !border !border-brand-sand !shadow-[0_12px_40px_rgba(123,30,30,0.08)]"
      >
        <Typography className="!text-brand-gold !font-semibold !uppercase !tracking-[0.15em] !text-[0.8rem] !mb-8">
          {t("privacy.subtitle")}
        </Typography>
        <Typography
          variant="h3"
          className="!text-brand-maroon !font-bold !mb-2"
        >
          {t("privacy.title")}
        </Typography>
        <Typography color="text.secondary" className="!mb-6">
          {t("privacy.lastUpdated")}: April 2026
        </Typography>

        {SECTIONS.map((sec) => (
          <Box key={sec.title}>
            <Typography
              variant="h6"
              className="!text-brand-maroon !font-semibold !mb-2 !mt-6"
            >
              {sec.title}
            </Typography>
            <Typography className="!text-brand-text-medium !leading-[1.8]">
              {sec.body}
            </Typography>
          </Box>
        ))}

        <Box className="mt-10 flex gap-4 flex-wrap">
          <Button variant="outlined" size="large" onClick={() => router.back()}>
            {t("common.back")}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
