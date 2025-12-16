'use client';

import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { importContactsAction } from '@/lib/actions/mail/import';
import { Contact } from '@/lib/actions/mail/contacts';

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

// System fields available for mapping
const SYSTEM_FIELDS: { key: keyof Contact; label: string; required?: boolean }[] = [
    { key: 'email', label: 'Email Address', required: true },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'position', label: 'Job Title' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'country', label: 'Country' },
    { key: 'tags', label: 'Tags' },
];

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
    const [step, setStep] = useState<'upload' | 'map' | 'importing' | 'complete'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({}); // systemField -> csvHeader
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ total: 0, success: 0, errors: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            preview: 1000, // Limit preview for performance, but we process all later? No, Papa parses all unless preview is set. Let's parse all client side for now (assuming < 10MB).
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setCsvHeaders(results.meta.fields || []);
                    setParsedData(results.data);

                    // Auto-guess mapping
                    const autoMapping: Record<string, string> = {};
                    const fields = results.meta.fields || [];

                    SYSTEM_FIELDS.forEach(sys => {
                        // Simple fuzzy match
                        const match = fields.find(f =>
                            f.toLowerCase().includes(sys.label.toLowerCase()) ||
                            f.toLowerCase().replace('_', '').includes(sys.key.toLowerCase())
                        );
                        if (match) {
                            autoMapping[sys.key] = match;
                        }
                    });

                    setMapping(autoMapping);
                    setStep('map');
                } else {
                    toast.error('File appears to be empty');
                }
            },
            error: (error) => {
                toast.error(`Parse error: ${error.message}`);
            }
        });
    };

    const handleImport = async () => {
        if (!mapping['email']) {
            toast.error('Please map the Email field');
            return;
        }

        setStep('importing');
        setProgress(0);

        // Transform data
        const contactsToImport = parsedData.map(row => {
            const contact: any = {};
            Object.entries(mapping).forEach(([sysKey, csvHeader]) => {
                if (csvHeader && row[csvHeader]) {
                    contact[sysKey] = row[csvHeader];
                }
            });
            return contact;
        });

        const total = contactsToImport.length;
        setStats({ total, success: 0, errors: 0 });

        // Call Server Action
        // We can do it in one go or simulated chunks if we want progress updates.
        // For < 1000 rows, one go is fine. 
        // Let's do a single call as our server action already handles chunking.
        try {
            const result = await importContactsAction(contactsToImport);
            if (result.success) {
                setStats({
                    total,
                    success: result.count,
                    errors: total - result.count
                });
                setProgress(100);
                setTimeout(() => {
                    setStep('complete');
                    onSuccess();
                }, 500);
            } else {
                toast.error('Import failed: ' + result.errors.join(', '));
                setStep('map'); // Go back
            }
        } catch (error) {
            toast.error('Import failed unexpectedly');
            console.error(error);
            setStep('map');
        }
    };

    const reset = () => {
        setStep('upload');
        setFile(null);
        setMapping({});
        setParsedData([]);
        setProgress(0);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v) reset();
            onOpenChange(v);
        }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Contacts</DialogTitle>
                    <DialogDescription>
                        Import contacts from a CSV file.
                    </DialogDescription>
                </DialogHeader>

                {step === 'upload' && (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                CSV files only (max 10MB)
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                )}

                {step === 'map' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md text-sm">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{file?.name}</span>
                            </div>
                            <span className="text-muted-foreground">{parsedData.length} records</span>
                        </div>

                        <div className="h-[300px] overflow-y-auto border rounded-md p-4 space-y-4 custom-scrollbar">
                            <p className="text-sm font-medium mb-4">Map Columns</p>
                            {SYSTEM_FIELDS.map((field) => (
                                <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                                    <div className="text-sm">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </div>
                                    <Select
                                        value={mapping[field.key] || ''}
                                        onValueChange={(val) => setMapping(prev => ({ ...prev, [field.key]: val }))}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select column..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ignore">-- Ignore --</SelectItem>
                                            {csvHeaders.map(header => (
                                                <SelectItem key={header} value={header}>{header}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="py-8 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span>Importing...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} />
                        <p className="text-xs text-muted-foreground text-center">
                            Processing {parsedData.length} contacts. This may take a moment.
                        </p>
                    </div>
                )}

                {step === 'complete' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-medium text-lg">Import Complete</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Successfully processed {stats.success} contacts.
                                {stats.errors > 0 && ` (${stats.errors} duplicates skipped)`}
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 'upload' && (
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    )}
                    {step === 'map' && (
                        <>
                            <Button variant="outline" onClick={() => reset()}>Back</Button>
                            <Button onClick={handleImport}>Import Contacts</Button>
                        </>
                    )}
                    {step === 'complete' && (
                        <Button onClick={() => onOpenChange(false)}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
