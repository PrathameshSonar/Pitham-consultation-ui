"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Paper, Typography, Button } from "@mui/material";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By registering or booking a consultation on the SPBSP, Ahilyanagar platform, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.",
  },
  {
    title: "2. About Our Services",
    body: "Shri Pitambara Baglamukhi Shakti Pitham, Ahilyanagar (SPBSP) provides astrology and spiritual consultation services by Shri Mayuresh Guruji Vispute. Services include Kundali reading, Vastu consultation, astrology guidance, meditation & sadhna guidance, puja & rituals advice, and spiritual counseling. All sessions are conducted via Zoom video call.",
  },
  {
    title: "3. Registration & Account",
    body: "You must provide accurate personal information during registration, including your name, mobile number, date of birth, time of birth, and birth place. This information is essential for astrological analysis. You are responsible for maintaining the confidentiality of your account credentials. You may register using email/mobile or Google Sign-In.",
  },
  {
    title: "4. Appointment Booking",
    body: "Consultations are booked on a first-come, first-serve basis. The admin may set a limit on the number of active bookings or a deadline for new bookings. Appointment scheduling is subject to Guruji's availability and will be confirmed after payment verification.",
  },
  {
    title: "5. Payment Policy",
    body: "Full payment of the consultation fee is required before appointment scheduling. Payments are processed securely through PhonePe payment gateway. The consultation fee is set by the admin and displayed at the time of booking. Payments are non-refundable once the session has been confirmed and scheduled. In the event of rescheduling initiated by us, the session will be rescheduled at no additional cost.",
  },
  {
    title: "6. Rescheduling & Cancellation",
    body: "The admin may reschedule your consultation if needed. You will be notified via email of any changes. If you need to reschedule, please raise a query through your dashboard. Cancellations after payment are handled on a case-by-case basis.",
  },
  {
    title: "7. Consultation Analysis & Documents",
    body: "After your consultation, Guruji may upload an analysis document and assign sadhna documents to your account. These are personal to you and should not be shared publicly. Zoom session recordings may also be shared with you for reference.",
  },
  {
    title: "8. Privacy & Data Protection",
    body: "Your personal information, birth details, and consultation records are kept strictly confidential. Please refer to our Privacy Policy for full details on how we collect, use, and protect your data.",
  },
  {
    title: "9. User Conduct",
    body: "Users are expected to be respectful during consultations and in all communications. SPBSP, Ahilyanagar reserves the right to cancel a session or ban an account without refund in the event of abusive, threatening, or inappropriate behaviour.",
  },
  {
    title: "10. Intellectual Property",
    body: "All content on the SPBSP, Ahilyanagar platform, including sadhna documents, analysis reports, and consultation recordings, is the intellectual property of Shri Pitambara Baglamukhi Shakti Pitham, Ahilyanagar and Shri Mayuresh Guruji Vispute. Reproduction, distribution, or public sharing without written permission is prohibited.",
  },
  {
    title: "11. Disclaimer",
    body: "Astrological and spiritual guidance is provided for informational, educational, and spiritual purposes only. It does not constitute medical, legal, financial, or psychological advice. Always consult qualified professionals for such matters. SPBSP, Ahilyanagar and Guruji shall not be held liable for any decisions made based on consultation advice.",
  },
  {
    title: "12. Limitation of Liability",
    body: "SPBSP, Ahilyanagar's total liability for any claim arising from use of our services is limited to the consultation fee paid. We are not liable for any indirect, incidental, or consequential damages.",
  },
  {
    title: "13. Modifications",
    body: "SPBSP, Ahilyanagar reserves the right to modify these Terms & Conditions at any time. Changes will be effective upon posting on this page. Continued use of services after modifications constitutes acceptance.",
  },
  {
    title: "14. Governing Law",
    body: "These terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in the relevant jurisdiction.",
  },
];

export default function Terms() {
  const router = useRouter();
  const { t } = useT();
  return (
    <Box sx={s.wrapper}>
      <Paper elevation={0} sx={s.card}>
        <Typography sx={s.subtitle}>{t("terms.subtitle")}</Typography>
        <Typography variant="h3" sx={s.title}>
          {t("terms.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("privacy.lastUpdated")}: April 2026
        </Typography>

        {SECTIONS.map((sec) => (
          <Box key={sec.title}>
            <Typography variant="h6" sx={s.sectionHeading}>
              {sec.title}
            </Typography>
            <Typography sx={s.sectionText}>{sec.body}</Typography>
          </Box>
        ))}

        <Typography sx={{ ...s.sectionText, mt: 3 }}>
          {t("terms.seePrivacy")}{" "}
          <Box
            component={Link}
            href="/privacy"
            sx={{ color: "primary.main", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
          >
            {t("privacy.title")}
          </Box>
        </Typography>

        <Box sx={s.actionsRow}>
          <Button variant="contained" size="large" onClick={() => router.push("/register")}>
            {t("terms.accept")}
          </Button>
          <Button variant="outlined" size="large" onClick={() => router.back()}>
            {t("terms.back")}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
