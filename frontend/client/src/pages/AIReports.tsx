import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Brain, 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Loader2,
  BarChart3,
  Clock
} from 'lucide-react';

interface AIReport {
  filename: string;
  metadata: {
    id: string;
    type: string;
    period: string;
    generatedAt: string;
    userId: string;
    dataSnapshot: {
      totalProducts: number;
      totalValue: number;
      totalUnits: number;
      ordersInPeriod: number;
      criticalAlerts: number;
    };
    aiStatus?: {
      keyUsed: string;
      usingFallback: boolean;
    };
  };
  size: number;
}

interface AISystemStatus {
  aiSystem: {
    primaryAvailable: boolean;
    fallbackAvailable: boolean;
    currentKey: string;
    usingFallback: boolean;
    primaryFailures: number;
    quota: {
      remainingQuota: number;
      quotaResetIn: number;
    };
  };
}

export default function AIReports() {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AISystemStatus | null>(null);
  const [formData, setFormData] = useState({
    type: 'weekly',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchReports();
    fetchAIStatus();
    
    // Set default dates
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    setFormData({
      type: 'weekly',
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Fetching AI reports...');
      const response = await apiClient.get('/ai-reports/list');
      console.log('📊 AI reports response:', response.data);
      if (response.data.success) {
        setReports(response.data.reports || []);
        console.log(`✅ Loaded ${response.data.reports?.length || 0} reports`);
      } else {
        console.error('❌ Failed to load reports:', response.data);
        toast.error('Failed to load AI reports');
      }
    } catch (error: any) {
      console.error('❌ Error loading AI reports:', error);
      toast.error(error.response?.data?.error || 'Failed to load AI reports');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAIStatus = async () => {
    try {
      console.log('🔍 Fetching AI status...');
      const response = await apiClient.get('/ai-reports/status/ai-system');
      console.log('🔍 AI status response:', response.data);
      if (response.data.success) {
        setAiStatus(response.data);
        console.log('✅ AI status loaded');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch AI status:', error);
      // Don't show error toast for status, it's not critical
    }
  };

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    try {
      setIsGenerating(true);
      toast.info('Generating AI report... This may take a moment.');
      
      const response = await apiClient.post('/ai-reports/generate', {
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });

      if (response.data.success) {
        toast.success('AI report generated successfully!');
        setIsDialogOpen(false);
        fetchReports();
        fetchAIStatus(); // Update quota status
      } else {
        toast.error(response.data.error || 'Failed to generate report');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to generate AI report';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const viewReport = async (reportId: string) => {
    try {
      const response = await apiClient.get(`/ai-reports/${reportId}`);
      if (response.data.success) {
        setSelectedReport(response.data.report);
        setIsViewDialogOpen(true);
      }
    } catch (error: any) {
      toast.error('Failed to load report content');
      console.error(error);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      const response = await apiClient.get(`/ai-reports/${reportId}/download`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_report_${reportId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download report');
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" />
              AI Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate intelligent inventory insights with AI-powered analysis
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Generate AI Report</DialogTitle>
                  <DialogDescription>
                    Create an AI-powered inventory analysis report
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={generateReport} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Report Type</label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly Report</SelectItem>
                        <SelectItem value="monthly">Monthly Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* AI System Status */}
        {aiStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                AI System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Primary Status Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">System Status</p>
                    <p className={`font-medium ${(aiStatus.aiSystem.primaryAvailable || aiStatus.aiSystem.fallbackAvailable) ? 'text-green-600' : 'text-red-600'}`}>
                      {(aiStatus.aiSystem.primaryAvailable || aiStatus.aiSystem.fallbackAvailable) ? '✅ Available' : '❌ Unavailable'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active Key</p>
                    <p className="font-medium">
                      {aiStatus.aiSystem.usingFallback ? '🔄 Fallback' : '🔑 Primary'}
                      {aiStatus.aiSystem.primaryFailures > 0 && (
                        <span className="text-xs text-orange-600 ml-1">
                          ({aiStatus.aiSystem.primaryFailures} failures)
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Keys Status</p>
                    <p className="font-medium text-sm">
                      <span className={aiStatus.aiSystem.primaryAvailable ? 'text-green-600' : 'text-red-600'}>
                        Primary: {aiStatus.aiSystem.primaryAvailable ? '✅' : '❌'}
                      </span>
                      <br />
                      <span className={aiStatus.aiSystem.fallbackAvailable ? 'text-green-600' : 'text-red-600'}>
                        Fallback: {aiStatus.aiSystem.fallbackAvailable ? '✅' : '❌'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining Quota</p>
                    <p className="font-medium text-blue-600">
                      {aiStatus.aiSystem.quota?.remainingQuota || 0} requests
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quota Reset</p>
                    <p className="font-medium text-orange-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {aiStatus.aiSystem.quota?.quotaResetIn ? Math.ceil(aiStatus.aiSystem.quota.quotaResetIn / 60) : 0} min
                    </p>
                  </div>
                </div>

                {/* API Keys Status Detail */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3 text-foreground">API Keys Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground">Primary API Key</p>
                        <span className={`text-xs px-2 py-1 rounded ${aiStatus.aiSystem.primaryAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {aiStatus.aiSystem.primaryAvailable ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <code className="text-xs bg-background px-2 py-1 rounded block truncate border">
                        {aiStatus.aiSystem.primaryAvailable ? 
                          'AIza...****' : 
                          'Not configured'
                        }
                      </code>
                      <p className="text-xs text-muted-foreground mt-2">
                        {aiStatus.aiSystem.primaryAvailable ? 
                          'Primary key is working correctly' : 
                          'Primary key is not configured or invalid'
                        }
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground">Fallback API Key</p>
                        <span className={`text-xs px-2 py-1 rounded ${aiStatus.aiSystem.fallbackAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {aiStatus.aiSystem.fallbackAvailable ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <code className="text-xs bg-background px-2 py-1 rounded block truncate border">
                        {aiStatus.aiSystem.fallbackAvailable ? 
                          'AIza...****' : 
                          'Not configured'
                        }
                      </code>
                      <p className="text-xs text-muted-foreground mt-2">
                        {aiStatus.aiSystem.fallbackAvailable ? 
                          'Fallback key is ready for use' : 
                          'Fallback key is not configured'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                {aiStatus.aiSystem.quota && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3 text-foreground">Usage Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Requests</p>
                        <p className="font-medium text-foreground text-lg">
                          {aiStatus.aiSystem.quota.totalRequests || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed Requests</p>
                        <p className="font-medium text-red-600 text-lg">
                          {aiStatus.aiSystem.quota.failedRequests || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">AI Model</p>
                        <p className="font-medium text-foreground text-xs">
                          gemini-2.5-flash
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cache Size</p>
                        <p className="font-medium text-blue-600 text-lg">
                          {(aiStatus.aiSystem as any).cacheSize || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning Messages */}
                {!aiStatus.aiSystem.primaryAvailable && !aiStatus.aiSystem.fallbackAvailable && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-200">No API Keys Available</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          Both primary and fallback API keys are not configured or invalid. 
                          AI report generation will not work until at least one valid API key is configured.
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          Configure keys in backend/.env: GEMINI_API_KEY and GEMINI_FALLBACK_API_KEY
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {aiStatus.aiSystem.usingFallback && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-orange-900 dark:text-orange-200">Using Fallback API Key</p>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                          The system has switched to the fallback API key due to {aiStatus.aiSystem.primaryFailures} consecutive failures with the primary key.
                          This is normal behavior to ensure continuous service.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {aiStatus.aiSystem.primaryAvailable && aiStatus.aiSystem.fallbackAvailable && !aiStatus.aiSystem.usingFallback && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-200">All Systems Operational</p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Both primary and fallback API keys are active and working correctly. 
                          AI report generation is fully operational with automatic failover support.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No AI reports generated yet. Create your first intelligent inventory analysis!
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                <Brain className="mr-2 h-4 w-4" />
                Generate First Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.metadata.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Brain className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            {report.metadata.type.charAt(0).toUpperCase() + report.metadata.type.slice(1)} Report
                            {report.metadata.aiStatus?.usingFallback && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                Fallback AI
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {report.metadata.period}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Products</p>
                          <p className="font-medium text-foreground">
                            {report.metadata.dataSnapshot.totalProducts}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Value</p>
                          <p className="font-medium text-foreground">
                            ${report.metadata.dataSnapshot.totalValue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Orders</p>
                          <p className="font-medium text-foreground">
                            {report.metadata.dataSnapshot.ordersInPeriod}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Alerts</p>
                          <p className={`font-medium ${report.metadata.dataSnapshot.criticalAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {report.metadata.dataSnapshot.criticalAlerts}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Generated</p>
                          <p className="font-medium text-foreground">
                            {formatDate(report.metadata.generatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewReport(report.metadata.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(report.metadata.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Report View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI Report: {selectedReport?.metadata.type} Analysis
              </DialogTitle>
              <DialogDescription>
                Generated on {selectedReport && formatDate(selectedReport.metadata.generatedAt)}
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Report Period</h4>
                  <p className="text-sm text-muted-foreground">{selectedReport.metadata.period}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">AI Analysis</h4>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedReport.content}
                    </pre>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadReport(selectedReport.metadata.id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}