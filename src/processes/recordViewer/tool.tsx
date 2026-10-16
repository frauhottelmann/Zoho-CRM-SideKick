import RefreshIcon from "@mui/icons-material/Refresh";
import {
    Alert,
    Box,
    Chip,
    IconButton,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography
} from "@mui/material";
import { DataGrid, GridToolbarContainer, GridToolbarQuickFilter, type GridColDef } from "@mui/x-data-grid";
import JsonView from "@uiw/react-json-view";
import { SnackbarProvider } from "notistack";
import { forwardRef, useMemo, useState } from "react";

import { ProcessButton, type ProcessProps, type ProcessRef } from "../../utils/global/.processClass";
import useCopyWithSnack from "../../utils/hooks/use/useCopyWithSnack";
import { getRecordLocation } from "../../utils/zoho/environment";
import { useLocationHref } from "../../utils/zoho/useLocationHref";
import { useZohoFields, useZohoModules, useZohoRecord } from "../../utils/zoho/ZohoApi";

class RecordViewerProcess extends ProcessButton {
    static id = "recordviewer";
    constructor() {
        super("recordviewer");
        this.process = RecordViewer;
    }
}

const RecordViewer = forwardRef<ProcessRef, ProcessProps>(function RecordViewerProcess(props: ProcessProps, ref) {
    return (
        <SnackbarProvider dense maxSnack={3}>
            <RecordViewerContent />
        </SnackbarProvider>
    );
});

interface FieldRow {
    id: string;
    label: string;
    apiName: string;
    dataType: string;
    value: string;
}

function RecordViewerContent() {
    const href = useLocationHref();
    const location = useMemo(() => getRecordLocation(href), [href]);

    const modules = useZohoModules();

    // The URL contains the module's "module_name" (e.g. Potentials), the API needs its "api_name" (e.g. Deals)
    const module = useMemo(
        () =>
            location
                ? modules.data?.find(
                      (m) => m.module_name === location.moduleTab || m.api_name === location.moduleTab
                  ) ?? null
                : null,
        [location, modules.data]
    );

    const record = useZohoRecord(module?.api_name ?? null, location?.recordId ?? null);
    const fields = useZohoFields(module?.api_name ?? null);

    const [view, setView] = useState<"fields" | "json">("fields");
    const copy = useCopyWithSnack();

    const rows = useMemo<FieldRow[]>(() => {
        if (!record.data) return [];
        const fieldByApiName = new Map((fields.data ?? []).map((field) => [field.api_name, field]));
        return Object.entries(record.data).map(([apiName, value]) => {
            const field = fieldByApiName.get(apiName);
            return {
                id: apiName,
                apiName,
                label: field?.field_label ?? "",
                dataType: field?.data_type ?? "",
                value: formatValue(value)
            };
        });
    }, [record.data, fields.data]);

    const columns = useMemo<GridColDef<FieldRow>[]>(
        () => [
            { field: "label", headerName: "Label", flex: 1, minWidth: 120 },
            {
                field: "apiName",
                headerName: "API name",
                flex: 1,
                minWidth: 130,
                renderCell: (params) => (
                    <Box
                        component="span"
                        sx={{ cursor: "copy", fontFamily: "monospace" }}
                        onClick={() => copy(params.value)}>
                        {params.value}
                    </Box>
                )
            },
            { field: "dataType", headerName: "Type", width: 90 },
            {
                field: "value",
                headerName: "Value",
                flex: 1.5,
                minWidth: 160,
                renderCell: (params) => (
                    <Tooltip title={params.value} placement="left" disableInteractive>
                        <Box component="span" sx={{ cursor: "copy" }} onClick={() => copy(params.value)}>
                            {params.value}
                        </Box>
                    </Tooltip>
                )
            }
        ],
        [copy]
    );

    if (!location) {
        return (
            <Typography variant="body2" color="text.secondary" p={2}>
                Open a record (for example a lead or a deal) to see its data here.
            </Typography>
        );
    }

    const error = modules.error ?? record.error;
    const unknownModule = !modules.loading && modules.data && !module;

    return (
        <Stack height="100%" spacing={0.5} p={1} boxSizing="border-box">
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                    size="small"
                    label={module?.api_name ?? location.moduleTab}
                    onClick={() => copy(module?.api_name ?? location.moduleTab)}
                />
                <Chip
                    size="small"
                    variant="outlined"
                    label={location.recordId}
                    onClick={() => copy(location.recordId)}
                />
                <Box flex="1 1 auto" />
                <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, value) => value && setView(value)}>
                    <ToggleButton value="fields">Fields</ToggleButton>
                    <ToggleButton value="json">JSON</ToggleButton>
                </ToggleButtonGroup>
                <Tooltip title="Reload record">
                    <IconButton size="small" onClick={record.reload}>
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}
            {unknownModule && (
                <Alert severity="warning">The module "{location.moduleTab}" is not available through the API.</Alert>
            )}

            <Box flex="1 1 auto" minHeight={0} overflow={view === "json" ? "auto" : "hidden"}>
                {view === "fields" ? (
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={modules.loading || record.loading}
                        density="compact"
                        hideFooterSelectedRowCount
                        slots={{ toolbar: QuickFilterToolbar }}
                    />
                ) : (
                    record.data && <JsonView value={record.data} collapsed={2} displayDataTypes={false} />
                )}
            </Box>
        </Stack>
    );
}

function QuickFilterToolbar() {
    return (
        <GridToolbarContainer>
            <GridToolbarQuickFilter sx={{ width: "100%" }} />
        </GridToolbarContainer>
    );
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
        // Lookups and owners come back as { name, id }
        const lookup = value as { name?: string; id?: string };
        if (!Array.isArray(value) && lookup.id && lookup.name !== undefined) return `${lookup.name} (${lookup.id})`;
        return JSON.stringify(value);
    }
    return String(value);
}

export default RecordViewerProcess;
