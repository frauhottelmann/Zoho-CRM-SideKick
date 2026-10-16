import RefreshIcon from "@mui/icons-material/Refresh";
import {
    Alert,
    Box,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography
} from "@mui/material";
import { DataGrid, GridToolbar, type GridColDef } from "@mui/x-data-grid";
import JsonView from "@uiw/react-json-view";
import { SnackbarProvider } from "notistack";
import { forwardRef, useMemo, useState } from "react";

import { ProcessButton, type ProcessProps, type ProcessRef } from "../../utils/global/.processClass";
import useCopyWithSnack from "../../utils/hooks/use/useCopyWithSnack";
import type { ZohoModule } from "../../utils/zoho/types";
import {
    useZohoFields,
    useZohoLayouts,
    useZohoModules,
    useZohoRelatedLists,
    type ZohoQueryState
} from "../../utils/zoho/ZohoApi";
import { useLoginWhen, ZohoAuthGate } from "../../utils/zoho/ZohoAuthGate";

class MetadataBrowserProcess extends ProcessButton {
    static id = "metadatabrowser";
    constructor() {
        super("metadatabrowser");
        this.process = MetadataBrowser;
    }
}

const MetadataBrowser = forwardRef<ProcessRef, ProcessProps>(function MetadataBrowserProcess(props: ProcessProps, ref) {
    return (
        <SnackbarProvider dense maxSnack={3}>
            <ZohoAuthGate>
                <MetadataBrowserContent />
            </ZohoAuthGate>
        </SnackbarProvider>
    );
});

function MetadataBrowserContent() {
    const modules = useZohoModules();
    useLoginWhen(modules.authRequired);
    const [selectedModule, setSelectedModule] = useState<ZohoModule | null>(null);
    const copy = useCopyWithSnack({ textPrefix: "API name" });

    const moduleColumns = useMemo<GridColDef<ZohoModule>[]>(
        () => [
            { field: "plural_label", headerName: "Label", flex: 1, minWidth: 120 },
            { field: "api_name", headerName: "API name", flex: 1, minWidth: 120, renderCell: copyableCell(copy) },
            { field: "module_name", headerName: "Module name (URL)", flex: 1, minWidth: 120 },
            { field: "generated_type", headerName: "Type", width: 90 }
        ],
        [copy]
    );

    return (
        <Stack direction="row" spacing={1} height="100%" p={1} minHeight={0} boxSizing="border-box">
            <Stack width="38%" minWidth={320} height="100%" spacing={0.5}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">Modules</Typography>
                    <Tooltip title="Reload metadata">
                        <IconButton size="small" onClick={modules.reload}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <QueryError query={modules} />
                <Box flex="1 1 auto" minHeight={0}>
                    <DataGrid
                        rows={modules.data ?? []}
                        columns={moduleColumns}
                        loading={modules.loading}
                        density="compact"
                        hideFooterSelectedRowCount
                        onRowClick={(params) => setSelectedModule(params.row)}
                        slots={{ toolbar: GridToolbar }}
                        slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: "zoho-modules" } } }}
                    />
                </Box>
            </Stack>
            <Box flex="1 1 auto" minWidth={0} height="100%">
                {selectedModule ? (
                    <ModuleDetails module={selectedModule} />
                ) : (
                    <Typography variant="body2" color="text.secondary" p={2}>
                        Select a module to see its fields, layouts and related lists.
                    </Typography>
                )}
            </Box>
        </Stack>
    );
}

function ModuleDetails(props: { module: ZohoModule }) {
    const { module } = props;
    const [tab, setTab] = useState(0);
    const copy = useCopyWithSnack({ textPrefix: "API name" });

    return (
        <Stack height="100%" spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1">{module.plural_label}</Typography>
                <Chip size="small" label={module.api_name} onClick={() => copy(module.api_name)} />
            </Stack>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable">
                <Tab label="Fields" />
                <Tab label="Layouts" />
                <Tab label="Related lists" />
                <Tab label="Module JSON" />
            </Tabs>
            <Box flex="1 1 auto" minHeight={0}>
                {tab === 0 && <FieldsGrid moduleApiName={module.api_name} />}
                {tab === 1 && <LayoutsGrid moduleApiName={module.api_name} />}
                {tab === 2 && <RelatedListsGrid moduleApiName={module.api_name} />}
                {tab === 3 && (
                    <Box height="100%" overflow="auto">
                        <JsonView value={module} collapsed={2} displayDataTypes={false} />
                    </Box>
                )}
            </Box>
        </Stack>
    );
}

function FieldsGrid(props: { moduleApiName: string }) {
    const fields = useZohoFields(props.moduleApiName);
    useLoginWhen(fields.authRequired);
    const copy = useCopyWithSnack({ textPrefix: "API name" });
    const [detail, setDetail] = useState<object | null>(null);

    const columns = useMemo<GridColDef[]>(
        () => [
            { field: "field_label", headerName: "Label", flex: 1, minWidth: 140 },
            { field: "api_name", headerName: "API name", flex: 1, minWidth: 140, renderCell: copyableCell(copy) },
            { field: "data_type", headerName: "Data type", width: 110 },
            { field: "json_type", headerName: "JSON type", width: 90 },
            { field: "custom_field", headerName: "Custom", type: "boolean", width: 75 },
            { field: "system_mandatory", headerName: "Mandatory", type: "boolean", width: 90 },
            {
                field: "read_only",
                headerName: "Read only",
                type: "boolean",
                width: 85,
                valueGetter: (_value, row) => !!(row.read_only || row.field_read_only)
            },
            { field: "length", headerName: "Length", type: "number", width: 75 },
            {
                field: "lookup",
                headerName: "Lookup module",
                width: 120,
                valueGetter: (_value, row) => row.lookup?.module?.api_name ?? ""
            },
            {
                field: "pick_list_values",
                headerName: "Picklist values",
                flex: 1,
                minWidth: 160,
                valueGetter: (_value, row) =>
                    (row.pick_list_values ?? []).map((value: any) => value.actual_value).join(", ")
            }
        ],
        [copy]
    );

    return (
        <>
            <QueryError query={fields} />
            <DataGrid
                rows={fields.data ?? []}
                columns={columns}
                loading={fields.loading}
                density="compact"
                hideFooterSelectedRowCount
                onRowDoubleClick={(params) => setDetail(params.row)}
                initialState={{ columns: { columnVisibilityModel: { json_type: false, length: false } } }}
                slots={{ toolbar: GridToolbar }}
                slotProps={{
                    toolbar: { showQuickFilter: true, csvOptions: { fileName: `zoho-fields-${props.moduleApiName}` } }
                }}
            />
            <JsonDialog value={detail} onClose={() => setDetail(null)} />
        </>
    );
}

function LayoutsGrid(props: { moduleApiName: string }) {
    const layouts = useZohoLayouts(props.moduleApiName);
    useLoginWhen(layouts.authRequired);
    const [detail, setDetail] = useState<object | null>(null);

    const columns = useMemo<GridColDef[]>(
        () => [
            { field: "name", headerName: "Name", flex: 1, minWidth: 140 },
            { field: "display_label", headerName: "Label", flex: 1, minWidth: 140 },
            { field: "status", headerName: "Status", width: 100 },
            { field: "visible", headerName: "Visible", type: "boolean", width: 80 },
            {
                field: "sections",
                headerName: "Sections",
                flex: 1,
                minWidth: 160,
                valueGetter: (_value, row) =>
                    (row.sections ?? []).map((section: any) => section.display_label).join(", ")
            },
            { field: "id", headerName: "ID", width: 170 }
        ],
        []
    );

    return (
        <>
            <QueryError query={layouts} />
            <DataGrid
                rows={layouts.data ?? []}
                columns={columns}
                loading={layouts.loading}
                density="compact"
                hideFooterSelectedRowCount
                onRowDoubleClick={(params) => setDetail(params.row)}
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true } }}
            />
            <JsonDialog value={detail} onClose={() => setDetail(null)} />
        </>
    );
}

function RelatedListsGrid(props: { moduleApiName: string }) {
    const relatedLists = useZohoRelatedLists(props.moduleApiName);
    useLoginWhen(relatedLists.authRequired);
    const copy = useCopyWithSnack({ textPrefix: "API name" });

    const columns = useMemo<GridColDef[]>(
        () => [
            { field: "display_label", headerName: "Label", flex: 1, minWidth: 140 },
            { field: "api_name", headerName: "API name", flex: 1, minWidth: 140, renderCell: copyableCell(copy) },
            {
                field: "module",
                headerName: "Module",
                width: 140,
                valueGetter: (_value, row) => row.module?.api_name ?? ""
            },
            { field: "type", headerName: "Type", width: 110 },
            { field: "visible", headerName: "Visible", type: "boolean", width: 80 }
        ],
        [copy]
    );

    return (
        <>
            <QueryError query={relatedLists} />
            <DataGrid
                rows={relatedLists.data ?? []}
                columns={columns}
                loading={relatedLists.loading}
                density="compact"
                hideFooterSelectedRowCount
                slots={{ toolbar: GridToolbar }}
                slotProps={{ toolbar: { showQuickFilter: true } }}
            />
        </>
    );
}

function copyableCell(copy: (text: string) => void) {
    return (params: { value?: any }) => (
        <Tooltip title="Click to copy" placement="left" disableInteractive>
            <Box
                component="span"
                sx={{ cursor: "copy", fontFamily: "monospace" }}
                onClick={(event) => {
                    event.stopPropagation();
                    copy(String(params.value ?? ""));
                }}>
                {params.value}
            </Box>
        </Tooltip>
    );
}

function QueryError(props: { query: ZohoQueryState<any> }) {
    const { query } = props;
    if (!query.error || query.authRequired) return null;
    return (
        <Alert severity="error" sx={{ mb: 0.5 }}>
            {query.error}
        </Alert>
    );
}

function JsonDialog(props: { value: object | null; onClose: () => void }) {
    return (
        <Dialog open={!!props.value} onClose={props.onClose} maxWidth="md" fullWidth>
            <DialogTitle>Details</DialogTitle>
            <DialogContent>
                {props.value && <JsonView value={props.value} collapsed={2} displayDataTypes={false} />}
            </DialogContent>
        </Dialog>
    );
}

export default MetadataBrowserProcess;
