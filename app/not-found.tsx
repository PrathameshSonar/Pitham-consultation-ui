"use client";

import Link from "next/link";
import { Box, Typography, Button } from "@mui/material";

export default function NotFound() {
  return (
    <Box sx={{
      minHeight: "calc(100vh - 64px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      textAlign: "center", p: 4,
    }}>
      <Typography sx={{ fontSize: "5rem", mb: 1 }}>404</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Page Not Found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        The page you are looking for does not exist or has been moved.
      </Typography>
      <Button component={Link} href="/" variant="contained" size="large">
        Go to Homepage
      </Button>
    </Box>
  );
}
