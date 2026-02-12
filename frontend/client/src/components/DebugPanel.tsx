import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPanel() {
  const { user, token, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState<any>({});

  const testAPI = async (endpoint: string, name: string) => {
    try {
      console.log(`Testing ${name}...`);
      const response = await apiClient.get(endpoint);
      console.log(`${name} success:`, response.data);
      setTestResults(prev => ({
        ...prev,
        [name]: { success: true, data: response.data, count: Array.isArray(response.data) ? response.data.length : 'N/A' }
      }));
    } catch (error: any) {
      console.error(`${name} failed:`, error);
      setTestResults(prev => ({
        ...prev,
        [name]: { success: false, error: error.message, status: error.response?.status }
      }));
    }
  };

  const runAllTests = async () => {
    setTestResults({});
    await testAPI('/products?user_only=true', 'Products');
    await testAPI('/suppliers?user_only=true', 'Suppliers');
    await testAPI('/orders?user_only=true', 'Orders');
    await testAPI('/reports/alerts', 'Alerts');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auth Status */}
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Authentication Status</h3>
          <p>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
          <p>User: {user ? `${user.firstName} ${user.lastName} (${user.email})` : 'None'}</p>
          <p>Token: {token ? `${token.substring(0, 20)}...` : 'None'}</p>
          <p>API Headers: {JSON.stringify(apiClient.defaults.headers.common, null, 2)}</p>
        </div>

        {/* Test Button */}
        <Button onClick={runAllTests} className="w-full">
          🧪 Run API Tests
        </Button>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {Object.entries(testResults).map(([name, result]: [string, any]) => (
              <div key={name} className={`p-3 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{name}</span>
                  <span>{result.success ? '✅' : '❌'}</span>
                </div>
                {result.success ? (
                  <p className="text-sm text-gray-600">Count: {result.count}</p>
                ) : (
                  <div className="text-sm text-red-600">
                    <p>Error: {result.error}</p>
                    {result.status && <p>Status: {result.status}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}