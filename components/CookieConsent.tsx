"use client";

import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useT } from "@/i18n/I18nProvider";

export default function CookieConsent() {
  const { t } = useT();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) setShow(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <Box sx={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider",
      px: { xs: 2, md: 4 }, py: 2,
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 2, flexWrap: "wrap",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
    }}>
      <Typography variant="body2" sx={{ flex: 1, minWidth: 200 }}>
        {t("cookie.message")}
      </Typography>
      <Button variant="contained" size="small" onClick={accept}>
        {t("cookie.accept")}
      </Button>
    </Box>
  );
}
