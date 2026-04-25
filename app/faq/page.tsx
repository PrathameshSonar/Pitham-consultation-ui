"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/Help";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";

const FAQ_KEYS = [
  "booking",
  "fee",
  "refund",
  "language",
  "duration",
  "reschedule",
  "delivery",
  "recording",
  "documents",
  "privacy",
  "support",
] as const;

export default function FAQPage() {
  const { t } = useT();
  const [open, setOpen] = useState<string | false>(FAQ_KEYS[0]);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: "background.default",
        py: { xs: 4, md: 8 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 880, mx: "auto" }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <HelpOutlineIcon sx={{ fontSize: 48, color: brandColors.saffron, mb: 1 }} />
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, color: brandColors.maroon, mb: 1 }}
          >
            {t("faq.title")}
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>{t("faq.subtitle")}</Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, md: 3 },
            borderRadius: 4,
            border: `1px solid ${brandColors.sand}`,
          }}
        >
          {FAQ_KEYS.map((key) => (
            <Accordion
              key={key}
              disableGutters
              elevation={0}
              expanded={open === key}
              onChange={(_, isOpen) => setOpen(isOpen ? key : false)}
              sx={{
                bgcolor: "transparent",
                borderBottom: `1px solid ${brandColors.sand}`,
                "&:last-of-type": { borderBottom: 0 },
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: brandColors.saffron }} />}
                sx={{ py: 1 }}
              >
                <Typography
                  sx={{ fontWeight: 600, color: brandColors.maroon, fontSize: "1rem" }}
                >
                  {t(`faq.q.${key}`)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", whiteSpace: "pre-line", lineHeight: 1.7 }}
                >
                  {t(`faq.a.${key}`)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>

        <Typography
          sx={{ textAlign: "center", mt: 4, color: "text.secondary", fontSize: "0.9rem" }}
        >
          {t("faq.contactPrompt")}{" "}
          <Box
            component="a"
            href="/contact"
            sx={{ color: brandColors.saffron, fontWeight: 600 }}
          >
            {t("nav.contact")}
          </Box>
        </Typography>
      </Box>
    </Box>
  );
}
