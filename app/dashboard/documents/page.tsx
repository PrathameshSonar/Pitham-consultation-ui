"use client";

import { memo, useMemo } from "react";
import { Box, Paper, Typography, Button, CircularProgress, Chip } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GroupIcon from "@mui/icons-material/Group";
import CampaignIcon from "@mui/icons-material/Campaign";
import PersonIcon from "@mui/icons-material/Person";
import { getMyDocuments, fileUrl } from "@/services/api";
import { useAuthQuery } from "@/services/queryHooks";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

interface Doc {
  id: number;
  title: string;
  description?: string | null;
  file_path: string;
  batch_label?: string | null;
  created_at: string;
}

type SourceKind = "consultation" | "list" | "bulk" | "direct";

interface SourceInfo {
  kind: SourceKind;
  label: string;
  icon: React.ReactNode;
}

/** Translate the raw batch_label string into a user-friendly source descriptor. */
function deriveSource(batchLabel: string | null | undefined, t: (k: any, vars?: any) => string): SourceInfo {
  const raw = (batchLabel || "").trim();

  // "Consultation #5" → extract the id and show "From Consultation #5"
  const consultMatch = raw.match(/^Consultation\s*#?(\d+)/i);
  if (consultMatch) {
    return {
      kind: "consultation",
      label: t("docs.from.consultation", { id: consultMatch[1] }),
      icon: <EventNoteIcon fontSize="inherit" />,
    };
  }

  // "List: Morning Group" → "From group: Morning Group"
  if (/^List:/i.test(raw)) {
    return {
      kind: "list",
      label: t("docs.from.list", { name: raw.replace(/^List:\s*/i, "") }),
      icon: <GroupIcon fontSize="inherit" />,
    };
  }

  // "Bulk: 12 users" → generic announcement (don't reveal recipient count)
  if (/^Bulk:/i.test(raw)) {
    return {
      kind: "bulk",
      label: t("docs.from.bulk"),
      icon: <CampaignIcon fontSize="inherit" />,
    };
  }

  // No batch_label → assigned individually
  return {
    kind: "direct",
    label: t("docs.from.direct"),
    icon: <PersonIcon fontSize="inherit" />,
  };
}

const SOURCE_COLOR: Record<SourceKind, "primary" | "secondary" | "success" | "default"> = {
  consultation: "primary",
  list: "secondary",
  bulk: "success",
  direct: "default",
};

/** Memoized row — re-renders only if its own doc changes. */
const DocRow = memo(function DocRow({
  doc,
  source,
  downloadLabel,
}: {
  doc: Doc;
  source: SourceInfo;
  downloadLabel: string;
}) {
  return (
    <Paper elevation={0} sx={s.docCard}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0, flex: 1 }}>
        <DescriptionIcon sx={s.docIcon} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={s.docTitle}>{doc.title}</Typography>
          {doc.description && (
            <Typography variant="body2" color="text.secondary">
              {doc.description}
            </Typography>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
            <Chip
              icon={source.icon as any}
              label={source.label}
              size="small"
              variant="outlined"
              color={SOURCE_COLOR[source.kind]}
              sx={{ fontWeight: 600, fontSize: "0.72rem" }}
            />
            <Typography variant="caption" color="text.disabled">
              {new Date(doc.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Button
        component="a"
        href={fileUrl(doc.file_path)}
        target="_blank"
        rel="noreferrer"
        variant="outlined"
        startIcon={<DownloadIcon />}
        sx={{ flexShrink: 0 }}
      >
        {downloadLabel}
      </Button>
    </Paper>
  );
});

export default function Documents() {
  const { t } = useT();
  const { data: docs = [], isLoading } = useAuthQuery<Doc[]>(["my-documents"], getMyDocuments);

  // Compute sources once per docs array — not on every row render.
  const docsWithSource = useMemo(
    () => docs.map((d) => ({ doc: d, source: deriveSource(d.batch_label, t) })),
    [docs, t],
  );

  if (isLoading) {
    return (
      <Box sx={{ ...s.wrapper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Typography variant="h4" sx={s.title}>
          {t("docs.title")}
        </Typography>

        {docsWithSource.length === 0 ? (
          <Paper elevation={0} sx={s.emptyCard}>
            <Typography variant="h1" sx={{ fontSize: "3rem", mb: 1 }}>
              📜
            </Typography>
            <Typography color="text.secondary">{t("users.noDocs")}</Typography>
          </Paper>
        ) : (
          docsWithSource.map(({ doc, source }) => (
            <DocRow key={doc.id} doc={doc} source={source} downloadLabel={t("common.download")} />
          ))
        )}
      </Box>
    </Box>
  );
}
