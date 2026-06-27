import { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import type { FormInputs, CalculationResults } from './types';
import { calculateResults } from './calculations';
import { Building2, ArrowLeft } from 'lucide-react';
import { Button } from './components/ui/button';

export default function App() {
  const [results, setResults] = useState<CalculationResults | null>(null);

  const handleCalculate = (inputs: FormInputs) => {
    const calculatedResults = calculateResults(inputs);
    setResults(calculatedResults);
    // Scroll to top to show results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Smart Resilient House Planning Calculator
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Code-Compliant Safety Logic for Disaster-Ready Homes
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!results ? (
          <InputForm onCalculate={handleCalculate} />
        ) : (
          <div className="space-y-6">
            <Button onClick={handleReset} variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Input Form
            </Button>
            <ResultsDisplay results={results} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            This calculator provides guidance based on Indian Building Codes, Fire Safety Provisions 2016,
            and standard engineering practices.
          </p>
          <p className="mt-2">
            Always consult with licensed structural engineers and local authorities before construction.
          </p>
        </div>
      </footer>
    </div>
  );
}
