"use client";

import ReCAPTCHA from "react-google-recaptcha";
import { useRef, forwardRef, useImperativeHandle } from "react";
import { Box } from "@mui/material";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

export interface CaptchaRef {
  getToken: () => string | null;
  reset: () => void;
}

const Captcha = forwardRef<CaptchaRef>(function Captcha(_, ref) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useImperativeHandle(ref, () => ({
    getToken: () => recaptchaRef.current?.getValue() || null,
    reset: () => recaptchaRef.current?.reset(),
  }));

  if (!SITE_KEY) return null;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
      <ReCAPTCHA ref={recaptchaRef} sitekey={SITE_KEY} />
    </Box>
  );
});

export default Captcha;
