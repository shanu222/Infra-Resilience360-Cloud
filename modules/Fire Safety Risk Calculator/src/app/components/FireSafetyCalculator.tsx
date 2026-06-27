import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { AlertCircle, Flame, Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface CalculationResult {
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  extinguishers: number;
  recommendations: string[];
}

const buildingTypes = [
  'Residential',
  'Commercial',
  'Industrial',
  'Educational',
  'Healthcare',
  'Mixed Use',
  'Warehouse',
  'Office Building',
];

export function FireSafetyCalculator() {
  const [buildingType, setBuildingType] = useState('');
  const [area, setArea] = useState('');
  const [floors, setFloors] = useState('');
  const [occupants, setOccupants] = useState('');
  const [kitchen, setKitchen] = useState<'yes' | 'no'>('no');
  const [electrical, setElectrical] = useState<'low' | 'medium' | 'high'>('low');
  const [flammable, setFlammable] = useState<'yes' | 'no'>('no');
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateRisk = () => {
    const areaNum = parseFloat(area);
    const floorsNum = parseInt(floors);
    const occupantsNum = parseInt(occupants);

    if (!buildingType || !areaNum || !floorsNum || !occupantsNum) {
      alert('Please fill in all required fields');
      return;
    }

    // Risk Score Calculation based on Building Code of Pakistan
    let riskScore = 0;

    // Floor-based risk
    if (floorsNum >= 3) riskScore += 2;
    if (floorsNum >= 6) riskScore += 3;

    // Occupancy-based risk
    if (occupantsNum > 10) riskScore += 2;
    if (occupantsNum > 50) riskScore += 3;

    // Area-based risk
    if (areaNum > 2000) riskScore += 2;
    if (areaNum > 5000) riskScore += 3;

    // Additional risk factors
    if (kitchen === 'yes') riskScore += 2;
    if (electrical === 'high') riskScore += 3;
    if (flammable === 'yes') riskScore += 4;

    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High';
    if (riskScore <= 4) {
      riskLevel = 'Low';
    } else if (riskScore <= 8) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'High';
    }

    // Calculate fire extinguishers
    let extinguishers = Math.ceil(areaNum / 2000);
    if (floorsNum > 1) extinguishers += floorsNum;
    if (riskLevel === 'High') extinguishers += 2;
    if (kitchen === 'yes') extinguishers += 1;

    // Generate recommendations
    const recommendations = generateRecommendations(
      riskLevel,
      floorsNum,
      areaNum,
      occupantsNum,
      kitchen === 'yes',
      electrical,
      flammable === 'yes',
      buildingType
    );

    setResult({
      riskScore,
      riskLevel,
      extinguishers,
      recommendations,
    });
  };

  const generateRecommendations = (
    riskLevel: string,
    floors: number,
    area: number,
    occupants: number,
    hasKitchen: boolean,
    electrical: string,
    hasFlammable: boolean,
    buildingType: string
  ): string[] => {
    const recommendations: string[] = [];

    // General recommendations based on risk level
    if (riskLevel === 'High') {
      recommendations.push('Install automated fire alarm system with smoke detectors on every floor');
      recommendations.push('Conduct monthly fire drills and maintain evacuation logs');
      recommendations.push('Install fire sprinkler system as per BCP 2016 standards');
    } else if (riskLevel === 'Medium') {
      recommendations.push('Install fire alarm system with smoke detectors');
      recommendations.push('Conduct quarterly fire safety drills');
    } else {
      recommendations.push('Install basic smoke detectors in key areas');
      recommendations.push('Conduct annual fire safety training');
    }

    // Floor-specific recommendations
    if (floors >= 6) {
      recommendations.push('Install fire escape stairways with 2-hour fire rating');
      recommendations.push('Provide emergency exit signage with backup lighting');
    } else if (floors >= 3) {
      recommendations.push('Ensure all stairways have fire-resistant doors');
      recommendations.push('Install emergency lighting in all exit routes');
    }

    // Kitchen recommendations
    if (hasKitchen) {
      recommendations.push('Install Class K fire extinguisher in kitchen area');
      recommendations.push('Install automatic fire suppression system over cooking equipment');
    }

    // Electrical recommendations
    if (electrical === 'high') {
      recommendations.push('Conduct electrical safety audit by certified engineer');
      recommendations.push('Install circuit breakers and surge protectors');
      recommendations.push('Maintain 3-foot clearance around electrical panels');
    }

    // Flammable materials recommendations
    if (hasFlammable) {
      recommendations.push('Store flammable materials in approved fire-rated cabinets');
      recommendations.push('Maintain proper ventilation in storage areas');
      recommendations.push('Install Class B fire extinguishers near flammable storage');
    }

    // Occupancy recommendations
    if (occupants > 50) {
      recommendations.push('Designate fire safety wardens for each floor');
      recommendations.push('Post evacuation maps in all common areas');
    }

    // Area-specific recommendations
    if (area > 5000) {
      recommendations.push('Install multiple fire exit routes (minimum 2 per floor)');
      recommendations.push('Consider installing fire hydrant system');
    }

    return recommendations;
  };

  const resetCalculator = () => {
    setBuildingType('');
    setArea('');
    setFloors('');
    setOccupants('');
    setKitchen('no');
    setElectrical('low');
    setFlammable('no');
    setResult(null);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return '';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Low':
        return <CheckCircle className="w-8 h-8" />;
      case 'Medium':
        return <AlertTriangle className="w-8 h-8" />;
      case 'High':
        return <XCircle className="w-8 h-8" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame className="w-10 h-10 text-red-600" />
            <h1 className="text-4xl font-bold text-gray-900">Fire Safety Risk Calculator</h1>
          </div>
          <p className="text-lg text-gray-600">
            Based on Building Code of Pakistan – Fire Safety Provisions 2016
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Building Information
              </CardTitle>
              <CardDescription>Enter your building details for risk assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Building Type */}
              <div className="space-y-2">
                <Label htmlFor="buildingType">Building Type *</Label>
                <Select value={buildingType} onValueChange={setBuildingType}>
                  <SelectTrigger id="buildingType">
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildingTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Area */}
              <div className="space-y-2">
                <Label htmlFor="area">Area (sq ft) *</Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="Enter area in square feet"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  min="0"
                />
              </div>

              {/* Number of Floors */}
              <div className="space-y-2">
                <Label htmlFor="floors">Number of Floors *</Label>
                <Input
                  id="floors"
                  type="number"
                  placeholder="Enter number of floors"
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                  min="1"
                />
              </div>

              {/* Number of Occupants */}
              <div className="space-y-2">
                <Label htmlFor="occupants">Number of Occupants *</Label>
                <Input
                  id="occupants"
                  type="number"
                  placeholder="Enter number of occupants"
                  value={occupants}
                  onChange={(e) => setOccupants(e.target.value)}
                  min="1"
                />
              </div>

              {/* Kitchen */}
              <div className="space-y-2">
                <Label htmlFor="kitchen">Kitchen *</Label>
                <Select value={kitchen} onValueChange={(val) => setKitchen(val as 'yes' | 'no')}>
                  <SelectTrigger id="kitchen">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Electrical Load */}
              <div className="space-y-2">
                <Label htmlFor="electrical">Electrical Load *</Label>
                <Select
                  value={electrical}
                  onValueChange={(val) => setElectrical(val as 'low' | 'medium' | 'high')}
                >
                  <SelectTrigger id="electrical">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Flammable Materials */}
              <div className="space-y-2">
                <Label htmlFor="flammable">Flammable Materials *</Label>
                <Select value={flammable} onValueChange={(val) => setFlammable(val as 'yes' | 'no')}>
                  <SelectTrigger id="flammable">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={calculateRisk} className="flex-1">
                  Calculate Risk
                </Button>
                <Button onClick={resetCalculator} variant="outline">
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Risk Level Card */}
                <Card className={`border-2 ${getRiskColor(result.riskLevel)}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {getRiskIcon(result.riskLevel)}
                        Risk Level
                      </span>
                      <span className="text-3xl font-bold">{result.riskLevel}</span>
                    </CardTitle>
                    <CardDescription className={result.riskLevel === 'Low' ? 'text-green-700' : result.riskLevel === 'Medium' ? 'text-yellow-700' : 'text-red-700'}>
                      Risk Score: {result.riskScore} points
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Fire Extinguishers Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      Required Fire Extinguishers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-5xl font-bold text-red-600 mb-2">
                        {result.extinguishers}
                      </div>
                      <p className="text-gray-700">Fire Extinguishers Required</p>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Placement Guidelines:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Place one extinguisher per 2,000 sq ft</li>
                        <li>• One extinguisher per floor minimum</li>
                        <li>• Near exits and high-risk areas</li>
                        <li>• Maximum travel distance: 75 feet</li>
                        <li>• Mount 3.5-5 feet above floor level</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      Safety Recommendations
                    </CardTitle>
                    <CardDescription>
                      Based on Building Code of Pakistan 2016
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex gap-3 text-sm">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Extinguisher Placement Diagram */}
                <Card>
                  <CardHeader>
                    <CardTitle>Extinguisher Placement Guide</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 rounded-lg p-6">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {Array.from({ length: Math.min(result.extinguishers, 9) }).map((_, i) => (
                          <div
                            key={i}
                            className="aspect-square bg-white rounded-lg border-2 border-red-500 flex items-center justify-center relative"
                          >
                            <Flame className="w-8 h-8 text-red-600" />
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        Suggested placement diagram (showing {Math.min(result.extinguishers, 9)} of {result.extinguishers} extinguishers)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Results Yet
                  </h3>
                  <p className="text-gray-500">
                    Fill in the building information and click "Calculate Risk" to see your fire
                    safety assessment.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 text-center">
            <strong>Note:</strong> This calculator is based on Building Code of Pakistan – Fire Safety Provisions 2016.
            For complete compliance, consult with a certified fire safety engineer.
          </p>
        </div>
      </div>
    </div>
  );
}
