import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { CSVParseResult } from '../types';
import { useCSVParser } from '../hooks';

interface CSVUploaderProps {
  onParsed: (result: CSVParseResult) => void;
  disabled?: boolean;
}

export function CSVUploader({ onParsed, disabled }: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isParsing, parseResult, parseFile, clearResult } = useCSVParser();

  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      return;
    }
    setFile(selectedFile);
    const result = await parseFile(selectedFile);
    onParsed(result);
  }, [parseFile, onParsed]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleClear = useCallback(() => {
    setFile(null);
    clearResult();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [clearResult]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">CSV File Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${file ? 'bg-muted/30' : ''}
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={disabled ? undefined : handleDrag}
          onDragLeave={disabled ? undefined : handleDrag}
          onDragOver={disabled ? undefined : handleDrag}
          onDrop={disabled ? undefined : handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled}
          />
          
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drop your CSV file here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
            </div>
          )}
        </div>

        {isParsing && (
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              Parsing CSV file...
            </AlertDescription>
          </Alert>
        )}

        {parseResult && !isParsing && (
          <div className="space-y-2">
            {parseResult.nodes.length > 0 || parseResult.links.length > 0 ? (
              <Alert className="border-success/50 bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription>
                  Found {parseResult.nodes.length} nodes and {parseResult.links.length} links
                </AlertDescription>
              </Alert>
            ) : null}

            {parseResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">{parseResult.errors.length} parsing error(s):</p>
                  <ul className="text-xs space-y-0.5 max-h-20 overflow-auto">
                    {parseResult.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>...and {parseResult.errors.length - 5} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Expected CSV Format:</p>
          <p><strong>Nodes:</strong> id, name, type, status, x, y, icon</p>
          <p><strong>Links:</strong> id, source, target, type, status, label, bandwidth, latency</p>
        </div>
      </CardContent>
    </Card>
  );
}
