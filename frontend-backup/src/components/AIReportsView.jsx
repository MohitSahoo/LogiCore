import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext.jsx';

const AIReportsView = ({ apiBase }) => {
  const { colors } = useTheme();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [generating, setGenerating] = useState(false);

  // Load reports and stats on component mount
  useEffect(() => {
    loadReports();
    loadStats();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBase}/ai-reports/list`);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${apiBase}/ai-reports/stats/overview`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const viewReport = async (reportId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBase}/ai-reports/${reportId}`);
      setSelectedReport(response.data.report);
      setActiveTab('view');
    } catch (error) {
      console.error('Failed to load report:', error);
      alert('Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const response = await axios.get(`${apiBase}/ai-reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_report_${reportId}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report.');
    }
  };

  const generateReport = async (type) => {
    try {
      setGenerating(true);
      
      // Calculate date range based on type
      const endDate = new Date();
      const startDate = new Date();
      
      if (type === 'weekly') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (type === 'monthly') {
        startDate.setMonth(endDate.getMonth() - 1);
      }

      const response = await axios.post(`${apiBase}/ai-reports/generate`, {
        type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      if (response.data.success) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully!`);
        // Refresh the reports list and stats
        await loadReports();
        await loadStats();
      } else {
        alert(`Failed to generate report: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      
      // Show more specific error messages
      if (error.response?.data?.error) {
        alert(`Failed to generate report: ${error.response.data.error}`);
      } else if (error.response?.status === 429) {
        alert('AI service rate limit exceeded. Please wait a moment and try again.');
      } else if (error.response?.status === 500) {
        alert('AI service is temporarily unavailable. Please try again later.');
      } else {
        alert('Failed to generate report. Please check your connection and try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatsOverview = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      <div style={{
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ color: '#a5b4fc', fontSize: '0.875rem', marginBottom: '4px' }}>
          Total Reports
        </div>
        <div style={{ color: '#e5e7eb', fontSize: '1.5rem', fontWeight: '600' }}>
          {stats?.totalReports || 0}
        </div>
      </div>
      
      <div style={{
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ color: '#86efac', fontSize: '0.875rem', marginBottom: '4px' }}>
          Weekly Reports
        </div>
        <div style={{ color: '#e5e7eb', fontSize: '1.5rem', fontWeight: '600' }}>
          {stats?.weeklyReports || 0}
        </div>
      </div>
      
      <div style={{
        background: 'rgba(168, 85, 247, 0.1)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ color: '#c4b5fd', fontSize: '0.875rem', marginBottom: '4px' }}>
          Monthly Reports
        </div>
        <div style={{ color: '#e5e7eb', fontSize: '1.5rem', fontWeight: '600' }}>
          {stats?.monthlyReports || 0}
        </div>
      </div>
      
      <div style={{
        background: 'rgba(251, 191, 36, 0.1)',
        border: '1px solid rgba(251, 191, 36, 0.2)',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{ color: '#fcd34d', fontSize: '0.875rem', marginBottom: '4px' }}>
          Last Generated
        </div>
        <div style={{ color: '#e5e7eb', fontSize: '0.875rem', fontWeight: '500' }}>
          {stats?.lastGenerated ? formatDate(stats.lastGenerated) : 'Never'}
        </div>
      </div>
    </div>
  );

  const renderReportsList = () => (
    <div>
      {renderStatsOverview()}
      
      {/* Reports List */}
      <div style={{
        background: colors.bgSurface,
        border: `1px solid ${colors.borderDefault}`,
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.borderDefault}`,
          background: colors.bgSurfaceElevated
        }}>
          <h3 style={{ color: colors.textPrimary, fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
            Generated Reports ({reports.length})
          </h3>
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: colors.textTertiary }}>
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: colors.textTertiary }}>
            No reports generated yet. Use the "Generate Weekly Report" or "Generate Monthly Report" buttons above to create your first report.
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {reports.map((report) => (
              <div
                key={report.metadata.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.02)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      padding: '2px 8px',
                      background: report.metadata.type === 'weekly' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                      color: report.metadata.type === 'weekly' ? '#86efac' : '#c4b5fd',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}>
                      {report.metadata.type}
                    </span>
                  </div>
                  <div style={{ color: '#e5e7eb', fontSize: '0.875rem', fontWeight: '500', marginBottom: '2px' }}>
                    {report.metadata.period}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Generated: {formatDate(report.metadata.generatedAt)}
                  </div>
                  {report.metadata.dataSnapshot && (
                    <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px' }}>
                      {report.metadata.dataSnapshot.totalProducts} products • 
                      ${parseFloat(report.metadata.dataSnapshot.totalValue || 0).toLocaleString()} value • 
                      {report.metadata.dataSnapshot.criticalAlerts} alerts
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => viewReport(report.metadata.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(99, 102, 241, 0.3)';
                      e.target.style.color = '#c7d2fe';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(99, 102, 241, 0.2)';
                      e.target.style.color = '#a5b4fc';
                    }}
                  >
                    View
                  </button>
                  
                  <button
                    onClick={() => downloadReport(report.metadata.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      color: '#86efac',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(34, 197, 94, 0.3)';
                      e.target.style.color = '#bbf7d0';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                      e.target.style.color = '#86efac';
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReportView = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#e5e7eb',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          ← Back to Reports
        </button>
        
        {selectedReport && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              padding: '4px 12px',
              background: selectedReport.metadata.type === 'weekly' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(168, 85, 247, 0.2)',
              color: selectedReport.metadata.type === 'weekly' ? '#86efac' : '#c4b5fd',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              {selectedReport.metadata.type} Report
            </span>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {selectedReport.metadata.period}
            </span>
          </div>
        )}
      </div>

      {selectedReport && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '24px',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}>
          <pre style={{
            color: '#e5e7eb',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            margin: 0,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}>
            {selectedReport.content}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '0', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h1 style={{ 
            color: colors.textPrimary, 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            margin: 0 
          }}>
            📊 AI Report Generation
          </h1>
          
          {/* Generate Report Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => generateReport('weekly')}
              disabled={generating}
              style={{
                padding: '10px 16px',
                background: generating ? colors.accentSubtle : `${colors.accent}33`,
                color: generating ? colors.textMuted : colors.accentText,
                border: `1px solid ${generating ? colors.borderDefault : colors.accent}`,
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: generating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!generating) {
                  e.target.style.background = `${colors.accent}55`;
                  e.target.style.color = colors.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!generating) {
                  e.target.style.background = `${colors.accent}33`;
                  e.target.style.color = colors.accentText;
                }
              }}
            >
              {generating ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(107, 114, 128, 0.3)',
                    borderTop: '2px solid #6b7280',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Generating...
                </>
              ) : (
                <>
                  📅 Generate Weekly Report
                </>
              )}
            </button>
            
            <button
              onClick={() => generateReport('monthly')}
              disabled={generating}
              style={{
                padding: '10px 16px',
                background: generating ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.2)',
                color: generating ? '#6b7280' : '#c4b5fd',
                border: `1px solid ${generating ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.3)'}`,
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: generating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!generating) {
                  e.target.style.background = 'rgba(168, 85, 247, 0.3)';
                  e.target.style.color = '#ddd6fe';
                }
              }}
              onMouseLeave={(e) => {
                if (!generating) {
                  e.target.style.background = 'rgba(168, 85, 247, 0.2)';
                  e.target.style.color = '#c4b5fd';
                }
              }}
            >
              {generating ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(107, 114, 128, 0.3)',
                    borderTop: '2px solid #6b7280',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Generating...
                </>
              ) : (
                <>
                  📊 Generate Monthly Report
                </>
              )}
            </button>
          </div>
        </div>
        <p style={{ 
          color: colors.textTertiary, 
          fontSize: '0.875rem', 
          margin: 0 
        }}>
          Generate new AI-powered inventory reports or view existing ones
        </p>
      </div>

      {/* Content */}
      {activeTab === 'list' ? renderReportsList() : renderReportView()}
    </div>
  );
};

export default AIReportsView;