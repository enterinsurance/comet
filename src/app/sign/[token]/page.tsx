'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Download, PenTool, RotateCcw } from 'lucide-react';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface SigningData {
  id: string;
  documentId: string;
  documentUrl: string;
  documentName: string;
  recipientEmail: string;
  recipientName: string;
  expiresAt: string;
  signatureFields: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    required: boolean;
  }>;
  isExpired: boolean;
  isCompleted: boolean;
}

export default function PublicSigningPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [signingData, setSigningData] = useState<SigningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Signature capture state
  const [signatureCanvas, setSignatureCanvas] = useState<SignatureCanvas | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [signerNotes, setSignerNotes] = useState('');

  useEffect(() => {
    if (token) {
      fetchSigningData();
    }
  }, [token]);

  const fetchSigningData = async () => {
    try {
      const response = await fetch(`/api/sign/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to validate token');
      }

      const data = await response.json();
      setSigningData(data.signingData);
      setSignerName(data.signingData.recipientName || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signing data');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleClearSignature = () => {
    if (signatureCanvas) {
      signatureCanvas.clear();
      setSignatureData(null);
    }
  };

  const handleSaveSignature = () => {
    if (signatureCanvas && !signatureCanvas.isEmpty()) {
      const dataUrl = signatureCanvas.toDataURL();
      setSignatureData(dataUrl);
      toast.success('Signature captured successfully');
    } else {
      toast.error('Please provide a signature');
    }
  };

  const handleSubmitSigning = async () => {
    if (!signatureData) {
      toast.error('Please provide your signature');
      return;
    }

    if (!signerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/sign/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          signatureData,
          signerName: signerName.trim(),
          signerTitle: signerTitle.trim(),
          signerNotes: signerNotes.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit signature');
      }

      const result = await response.json();
      toast.success('Document signed successfully!');
      
      // Redirect to success page or show completion message
      router.push(`/sign/${token}/success`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit signature');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !signingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load document for signing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error || 'Invalid or expired signing link'}
            </p>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signingData.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Signing Link Expired</CardTitle>
            <CardDescription>This signing link has expired</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The signing link for "{signingData.documentName}" expired on{' '}
              {new Date(signingData.expiresAt).toLocaleDateString()}.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Please contact the document sender to request a new signing link.
            </p>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signingData.isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Document Already Signed</CardTitle>
            <CardDescription>This document has already been signed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The document "{signingData.documentName}" has already been signed.
            </p>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Sign Document</h1>
          <p className="text-muted-foreground">
            Please review and sign: <strong>{signingData.documentName}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Recipient: {signingData.recipientName} ({signingData.recipientEmail})
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Document Preview</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {numPages}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                        disabled={currentPage >= numPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative border rounded-lg overflow-hidden bg-white">
                  <Document
                    file={signingData.documentUrl}
                    onLoadSuccess={handleDocumentLoadSuccess}
                    className="flex justify-center"
                  >
                    <div className="relative">
                      <Page 
                        pageNumber={currentPage} 
                        scale={pdfScale}
                        className="shadow-lg"
                      />
                      
                      {/* Signature Field Overlays */}
                      {signingData.signatureFields
                        .filter(field => field.page === currentPage)
                        .map(field => (
                          <div
                            key={field.id}
                            className="absolute border-2 border-blue-500 border-dashed bg-blue-100/30 flex items-center justify-center"
                            style={{
                              left: `${field.x * pdfScale}px`,
                              top: `${field.y * pdfScale}px`,
                              width: `${field.width * pdfScale}px`,
                              height: `${field.height * pdfScale}px`,
                            }}
                          >
                            <div className="text-xs text-blue-600 font-medium bg-white px-2 py-1 rounded">
                              {field.required ? 'Signature Required' : 'Signature'}
                            </div>
                          </div>
                        ))}
                    </div>
                  </Document>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signing Panel */}
          <div className="space-y-6">
            {/* Signer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Signer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="signerName">Full Name *</Label>
                  <Input
                    id="signerName"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="signerTitle">Title (Optional)</Label>
                  <Input
                    id="signerTitle"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="e.g., CEO, Manager"
                  />
                </div>

                <div>
                  <Label htmlFor="signerNotes">Notes (Optional)</Label>
                  <Textarea
                    id="signerNotes"
                    value={signerNotes}
                    onChange={(e) => setSignerNotes(e.target.value)}
                    placeholder="Any additional comments..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Signature Capture */}
            <Card>
              <CardHeader>
                <CardTitle>Your Signature</CardTitle>
                <CardDescription>
                  Draw your signature in the box below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <SignatureCanvas
                    ref={(ref) => setSignatureCanvas(ref)}
                    canvasProps={{
                      width: 300,
                      height: 150,
                      className: 'signature-canvas bg-white rounded border',
                      style: { width: '100%', height: '150px' }
                    }}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearSignature}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveSignature}
                    className="flex-1"
                  >
                    Save Signature
                  </Button>
                </div>

                {signatureData && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    ✓ Signature captured successfully
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleSubmitSigning}
                  disabled={isSubmitting || !signatureData || !signerName.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting Signature...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Sign Document
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  By signing, you agree that this constitutes a legal signature
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}