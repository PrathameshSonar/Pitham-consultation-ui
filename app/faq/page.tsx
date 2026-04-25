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
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-16 px-4 md:px-8">
      <Box className="max-w-[880px] mx-auto">
        <Box className="text-center mb-8">
          <HelpOutlineIcon className="!text-[48px] !text-brand-saffron !mb-2" />
          <Typography
            variant="h3"
            className="!font-bold !text-brand-maroon !mb-2"
          >
            {t("faq.title")}
          </Typography>
          <Typography className="!text-brand-text-medium">{t("faq.subtitle")}</Typography>
        </Box>

        <Paper
          elevation={0}
          className="!p-3 md:!p-6 !rounded-3xl !border !border-brand-sand"
        >
          {FAQ_KEYS.map((key) => (
            <Accordion
              key={key}
              disableGutters
              elevation={0}
              expanded={open === key}
              onChange={(_, isOpen) => setOpen(isOpen ? key : false)}
              className="!bg-transparent !border-b !border-brand-sand last-of-type:!border-b-0 [&::before]:!hidden"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon className="!text-brand-saffron" />}
                className="!py-2"
              >
                <Typography className="!font-semibold !text-brand-maroon !text-base">
                  {t(`faq.q.${key}`)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails className="!pb-4">
                <Typography
                  variant="body2"
                  className="!text-brand-text-medium !whitespace-pre-line !leading-[1.7]"
                >
                  {t(`faq.a.${key}`)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>

        <Typography className="!text-center !mt-8 !text-brand-text-medium !text-[0.9rem]">
          {t("faq.contactPrompt")}{" "}
          <Box
            component="a"
            href="/contact"
            className="text-brand-saffron font-semibold"
          >
            {t("nav.contact")}
          </Box>
        </Typography>
      </Box>
    </Box>
  );
}
