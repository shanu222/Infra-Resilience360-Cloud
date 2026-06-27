import React from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { FormInputs } from '../types';

interface InputFormProps {
  onCalculate: (inputs: FormInputs) => void;
}

export function InputForm({ onCalculate }: InputFormProps) {
  const [location, setLocation] = React.useState('');
  const [plotSize, setPlotSize] = React.useState('');
  const [floors, setFloors] = React.useState('');
  const [rooms, setRooms] = React.useState('');
  const [people, setPeople] = React.useState('');
  const [soilType, setSoilType] = React.useState('');
  const [constructionType, setConstructionType] = React.useState('');
  const [floodProne, setFloodProne] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputs: FormInputs = {
      location,
      plotSize: Number(plotSize),
      floors: Number(floors),
      rooms: Number(rooms),
      people: Number(people),
      soilType: soilType as FormInputs['soilType'],
      constructionType: constructionType as FormInputs['constructionType'],
      floodProne: floodProne === 'yes',
    };

    onCalculate(inputs);
  };

  const isFormValid = location && plotSize && floors && rooms && people && soilType && constructionType && floodProne;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">House Planning Input</CardTitle>
        <CardDescription>
          Enter your house details for a comprehensive safety and resilience assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location (GPS or City)</Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., Delhi, Mumbai, Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            {/* Plot Size */}
            <div className="space-y-2">
              <Label htmlFor="plotSize">Plot Size (sq ft)</Label>
              <Input
                id="plotSize"
                type="number"
                placeholder="e.g., 1000"
                value={plotSize}
                onChange={(e) => setPlotSize(e.target.value)}
                min="100"
                required
              />
            </div>

            {/* Number of Floors */}
            <div className="space-y-2">
              <Label htmlFor="floors">Number of Floors</Label>
              <Input
                id="floors"
                type="number"
                placeholder="e.g., 2"
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                min="1"
                max="10"
                required
              />
            </div>

            {/* Number of Rooms */}
            <div className="space-y-2">
              <Label htmlFor="rooms">Number of Rooms</Label>
              <Input
                id="rooms"
                type="number"
                placeholder="e.g., 3"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                min="1"
                required
              />
            </div>

            {/* Number of People */}
            <div className="space-y-2">
              <Label htmlFor="people">Number of People</Label>
              <Input
                id="people"
                type="number"
                placeholder="e.g., 5"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                min="1"
                required
              />
            </div>

            {/* Soil Type */}
            <div className="space-y-2">
              <Label htmlFor="soilType">Soil Type</Label>
              <Select value={soilType} onValueChange={setSoilType} required>
                <SelectTrigger id="soilType">
                  <SelectValue placeholder="Select soil type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandy">Sandy</SelectItem>
                  <SelectItem value="clay">Clay</SelectItem>
                  <SelectItem value="rocky">Rocky</SelectItem>
                  <SelectItem value="wet">Wet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Construction Type */}
            <div className="space-y-2">
              <Label htmlFor="constructionType">Construction Type</Label>
              <Select value={constructionType} onValueChange={setConstructionType} required>
                <SelectTrigger id="constructionType">
                  <SelectValue placeholder="Select construction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RCC">RCC (Reinforced Cement Concrete)</SelectItem>
                  <SelectItem value="Brick">Brick</SelectItem>
                  <SelectItem value="Mud">Mud</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Flood Prone */}
            <div className="space-y-2">
              <Label htmlFor="floodProne">Flood Prone Area?</Label>
              <Select value={floodProne} onValueChange={setFloodProne} required>
                <SelectTrigger id="floodProne">
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={!isFormValid}>
            Calculate Resilient House Plan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
