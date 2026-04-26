"use client";

import { useState } from "react";
import {
  TextField,
  IconButton,
  InputAdornment,
  type TextFieldProps,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// Drop-in replacement for a password TextField with a built-in eye toggle.
// Consumers must NOT pass `type` — it's owned by this component.
//
// Why a wrapper instead of inline state per page: 3+ forms use it (login,
// register, forgot/reset, admin password change). Centralising the toggle
// means the a11y labels, tabIndex behaviour, and adornment styling stay
// consistent.
export default function PasswordField(props: Omit<TextFieldProps, "type">) {
  const [show, setShow] = useState(false);
  const { slotProps, ...rest } = props;

  // Merge our endAdornment into whatever slotProps the consumer passed,
  // preserving existing input-slot props (e.g. autoComplete) without
  // clobbering them.
  const inputSlot =
    (slotProps as { input?: Record<string, unknown> } | undefined)?.input ?? {};

  return (
    <TextField
      {...rest}
      type={show ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: {
          ...inputSlot,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
                size="small"
                // tabIndex=-1 so Tab from the password field still goes to
                // the next form control, not into the toggle button.
                tabIndex={-1}
              >
                {show ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
