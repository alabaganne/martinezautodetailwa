'use client'
import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play, 
  Loader2, 
  RefreshCw,
  Shield,
  MapPin,
  Users,
  Package,
  Calendar,
  UserPlus
} from 'lucide-react';
import {
  testConnection,
  testLocationDetails,
  testCustomerOperations,
  testCatalogItems,
  testTeamMembers,
  testBookingsApi,
  runAllTests
} from '@/lib/utils/testSquareApi';
import { getLocationId, isSandbox } from '@/lib/config/square';

const SquareApiTest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [runningAll, setRunningAll] = useState(false);
  
  // Get location ID from config
  const locationId = getLocationId();

  const tests = [
    { 
      id: 'connection', 
      name: 'API Connection', 
      icon: Shield,
      description: 'Verify credentials and connection',
      fn: testConnection 
    },
    { 
      id: 'location', 
      name: 'Location Details', 
      icon: MapPin,
      description: 'Fetch business location information',
      fn: () => testLocationDetails(locationId) 
    },
    { 
      id: 'customer', 
      name: 'Customer Operations', 
      icon: UserPlus,
      description: 'Create and retrieve test customer',
      fn: testCustomerOperations 
    },
    { 
      id: 'catalog', 
      name: 'Catalog Items', 
      icon: Package,
      description: 'List available services/products',
      fn: testCatalogItems 
    },
    { 
      id: 'team', 
      name: 'Team Members', 
      icon: Users,
      description: 'Check team member access',
      fn: () => testTeamMembers(locationId) 
    },
    { 
      id: 'bookings', 
      name: 'Bookings API', 
      icon: Calendar,
      description: 'Verify bookings availability',
      fn: () => testBookingsApi(locationId) 
    },
  ];

  const runSingleTest = async (test) => {
    setLoading(prev => ({ ...prev, [test.id]: true }));
    try {
      const result = await test.fn();
      setResults(prev => ({ ...prev, [test.id]: result }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [test.id]: { 
          success: false, 
          message: error.message || 'Test failed',
          data: null 
        } 
      }));
    }
    setLoading(prev => ({ ...prev, [test.id]: false }));
  };

  const runAllTestsHandler = async () => {
    setRunningAll(true);
    setResults({});
    setLoading({});
    
    const allResults = await runAllTests(locationId);
    const resultMap = {};
    
    allResults.forEach((result, index) => {
      const testId = tests[index].id;
      resultMap[testId] = result;
    });
    
    setResults(resultMap);
    setRunningAll(false);
  };

  const clearResults = () => {
    setResults({});
  };

  const getStatusIcon = (result) => {
    if (!result) return null;
    if (result.success) {
      return <CheckCircle className="text-green-600" size={20} />;
    }
    return <XCircle className="text-red-600" size={20} />;
  };

  const isSandboxMode = isSandbox();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Square API Test Suite</h1>
              <p className="text-gray-600 mt-1">Test your Square API integration</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isSandboxMode 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isSandboxMode ? 'Sandbox' : 'Production'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={runAllTestsHandler}
              disabled={runningAll}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {runningAll ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Running All Tests...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Run All Tests
                </>
              )}
            </button>
            <button
              onClick={clearResults}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <RefreshCw size={18} />
              Clear Results
            </button>
          </div>
        </div>


        {/* Warning for Sandbox */}
        {isSandboxMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="text-amber-600 mt-0.5 mr-2 flex-shrink-0" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-amber-800">Sandbox Mode Active</p>
                <p className="text-amber-700 mt-1">
                  You're using sandbox credentials. All operations are safe and won't affect real data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Test Cards */}
        <div className="grid gap-4">
          {tests.map((test) => {
            const result = results[test.id];
            const isLoading = loading[test.id];
            const Icon = test.icon;

            return (
              <div key={test.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="text-gray-700" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">{test.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                      
                      {/* Result Display */}
                      {result && (
                        <div className={`mt-4 p-3 rounded-lg ${
                          result.success ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <div className="flex items-start space-x-2">
                            {getStatusIcon(result)}
                            <div className="flex-1">
                              <p className={`font-medium ${
                                result.success ? 'text-green-800' : 'text-red-800'
                              }`}>
                                {result.message}
                              </p>
                              {result.data && (
                                <div className="mt-2 text-sm text-gray-700">
                                  <pre className="bg-white p-2 rounded border overflow-x-auto">
                                    {JSON.stringify(result.data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Test Button */}
                  <button
                    onClick={() => runSingleTest(test)}
                    disabled={isLoading || runningAll}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Test
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {Object.keys(results).length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-3">Test Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {Object.keys(results).length}
                </p>
                <p className="text-sm text-gray-600">Total Tests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(results).filter(r => r.success).length}
                </p>
                <p className="text-sm text-gray-600">Passed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {Object.values(results).filter(r => !r.success).length}
                </p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquareApiTest;
