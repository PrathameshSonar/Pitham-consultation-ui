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

const WRAPPER_CLASS = "min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-12 px-4";
const CONTAINER_CLASS = "max-w-[780px] mx-auto";

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

function deriveSource(batchLabel: string | null | undefined, t: (k: any, vars?: any) => string): SourceInfo {
  const raw = (batchLabel || "").trim();

  const consultMatch = raw.match(/^Consultation\s*#?(\d+)/i);
  if (consultMatch) {
    return {
      kind: "consultation",
      label: t("docs.from.consultation", { id: consultMatch[1] }),
      icon: <EventNoteIcon fontSize="inherit" />,
    };
  }

  if (/^List:/i.test(raw)) {
    return {
      kind: "list",
      label: t("docs.from.list", { name: raw.replace(/^List:\s*/i, "") }),
      icon: <GroupIcon fontSize="inherit" />,
    };
  }

  if (/^Bulk:/i.test(raw)) {
    return {
      kind: "bulk",
      label: t("docs.from.bulk"),
      icon: <CampaignIcon fontSize="inherit" />,
    };
  }

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
    <Paper
      elevation={0}
      className="!p-6 !mb-4 !rounded-3xl !border !border-brand-sand !flex !items-center !justify-between !gap-4 !transition-all !duration-200 hover:!shadow-[0_8px_25px_rgba(230,81,0,0.08)]"
    >
      <Box className="flex items-center gap-4 min-w-0 flex-1">
        <DescriptionIcon className="!text-[2.5rem] !text-brand-gold" />
        <Box className="min-w-0">
          <Typography className="!font-bold !text-brand-maroon">{doc.title}</Typography>
          {doc.description && (
            <Typography variant="body2" color="text.secondary">
              {doc.description}
            </Typography>
          )}
          <Box className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Chip
              icon={source.icon as any}
              label={source.label}
              size="small"
              variant="outlined"
              color={SOURCE_COLOR[source.kind]}
              className="!font-semibold !text-[0.72rem]"
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
        className="!shrink-0"
      >
        {downloadLabel}
      </Button>
    </Paper>
  );
});

export default function Documents() {
  const { t } = useT();
  const { data: docs = [], isLoading } = useAuthQuery<Doc[]>(["my-documents"], getMyDocuments);

  const docsWithSource = useMemo(
    () => docs.map((d) => ({ doc: d, source: deriveSource(d.batch_label, t) })),
    [docs, t],
  );

  if (isLoading) {
    return (
      <Box className={`${WRAPPER_CLASS} flex items-center justify-center`}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box className={WRAPPER_CLASS}>
      <Box className={CONTAINER_CLASS}>
        <Typography variant="h4" className="!text-brand-maroon !font-bold !mb-8">
          {t("docs.title")}
        </Typography>

        {docsWithSource.length === 0 ? (
          <Paper
            elevation={0}
            className="!p-12 !text-center !rounded-3xl !border !border-dashed !border-brand-sand"
          >
            <Typography variant="h1" className="!text-[3rem] !mb-2">
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
