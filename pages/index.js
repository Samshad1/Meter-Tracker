import React, { useState } from 'react';
import { Plus, RotateCcw, Calculator, Zap, AlertTriangle } from 'lucide-react';

const MeterTracker = () => {
  const [neighborAvailableUnits, setNeighborAvailableUnits] = useState(0);
  const [neighborLockedUnits] = useState((parseFloat('13') || 0) + (parseFloat('46.01') || 0));
  const [neighborTotalPrepaid] = useState(20000 / 65);
  const [myPurchases, setMyPurchases] = useState([]);
  const [newPurchaseAmount, setNewPurchaseAmount] = useState('');
  const [monthlyReadings, setMonthlyReadings] = useState([]);
  const [totalMeterReading, setTotalMeterReading] = useState('');
  const [myMeterReading, setMyMeterReading] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
  
  const [myStartingUnits, setMyStartingUnits] = useState(0);
  const [neighborStartingUnits, setNeighborStartingUnits] = useState(0);
  const [setupComplete, setSetupComplete] = useState(false);
  const [tempMyStarting, setTempMyStarting] = useState('');
  const [tempNeighborStarting, setTempNeighborStarting] = useState('');
  
  const [tempOutstanding1, setTempOutstanding1] = useState('13');
  const [tempOutstanding2, setTempOutstanding2] = useState('46.01');
  
  const oldRate = 65;
  const newRate = 227;
  
  const completeSetup = () => {
    if (tempMyStarting && tempNeighborStarting) {
      setMyStartingUnits(parseFloat(tempMyStarting));
      setNeighborStartingUnits(parseFloat(tempNeighborStarting));
      
      const outstanding1 = parseFloat(tempOutstanding1) || 0;
      const outstanding2 = parseFloat(tempOutstanding2) || 0;
      const totalOutstanding = outstanding1 + outstanding2;
      
      setNeighborAvailableUnits(neighborTotalPrepaid - totalOutstanding);
      setSetupComplete(true);
    }
  };
  
  const addMyPurchase = () => {
    if (newPurchaseAmount) {
      const amount = parseFloat(newPurchaseAmount);
      const units = amount / newRate;
      setMyPurchases([...myPurchases, { 
        amount, 
        units, 
        date: new Date().toLocaleDateString(),
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      }]);
      setNewPurchaseAmount('');
    }
  };
  
  const addMonthlyReading = () => {
    if (totalMeterReading && myMeterReading && currentMonth) {
      const total = parseFloat(totalMeterReading);
      const mine = parseFloat(myMeterReading);
      
      const adjustedTotal = total - (myStartingUnits + neighborStartingUnits);
      const adjustedMine = mine - myStartingUnits;
      const neighborUsed = adjustedTotal - adjustedMine;
      
      const newReading = {
        month: currentMonth,
        totalReading: total,
        myReading: mine,
        adjustedTotal,
        adjustedMine,
        neighborUsed: neighborUsed,
        neighborAvailableBeforeDeduction: neighborAvailableUnits,
        date: new Date().toLocaleDateString()
      };
      
      const newNeighborUnits = Math.max(0, neighborAvailableUnits - neighborUsed);
      setNeighborAvailableUnits(newNeighborUnits);
      
      setMonthlyReadings([...monthlyReadings, newReading]);
      setTotalMeterReading('');
      setMyMeterReading('');
      setCurrentMonth('');
    }
  };
  
  const resetTracker = () => {
    setNeighborAvailableUnits(0);
    setMyPurchases([]);
    setMonthlyReadings([]);
    setTotalMeterReading('');
    setMyMeterReading('');
    setCurrentMonth('');
    setSetupComplete(false);
    setMyStartingUnits(0);
    setNeighborStartingUnits(0);
    setTempMyStarting('');
    setTempNeighborStarting('');
  };
  
  const exportData = () => {
    const data = {
      exportDate: new Date().toLocaleDateString(),
      neighborStartingUnits,
      neighborRemainingUnits: neighborAvailableUnits,
      neighborLockedUnits,
      neighborTotalPrepaid,
      myPurchases,
      monthlyReadings,
      summary: {
        totalSpentByMe: myTotalSpent,
        totalUnitsIBought: myTotalUnits,
        totalNeighborUsed,
        neighborsUnitsLeft: neighborAvailableUnits
      }
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meter-tracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const exportToText = () => {
    let report = `SHARED METER TRACKER REPORT\n`;
    report += `Generated: ${new Date().toLocaleDateString()}\n`;
    report += `================================\n\n`;
    
    report += `NEIGHBOR'S PREPAID STATUS:\n`;
    report += `- Meter baseline: ${neighborStartingUnits.toFixed(2)} units\n`;
    report += `- Total prepaid: ${neighborTotalPrepaid.toFixed(2)} units (₦20,000 at ₦${oldRate}/unit)\n`;
    report += `- Locked units: ${neighborLockedUnits.toFixed(2)} units (outstanding debt)\n`;
    report += `- Available units: ${neighborAvailableUnits.toFixed(2)} units\n`;
    report += `- Used since setup: ${(neighborTotalPrepaid - neighborLockedUnits - neighborAvailableUnits).toFixed(2)} units\n\n`;
    
    report += `MY PURCHASES:\n`;
    myPurchases.forEach(purchase => {
      report += `- ${purchase.date}: ₦${purchase.amount.toLocaleString()} → ${purchase.units.toFixed(2)} units\n`;
    });
    report += `- TOTAL: ₦${myTotalSpent.toLocaleString()} → ${myTotalUnits.toFixed(2)} units\n\n`;
    
    report += `MONTHLY USAGE HISTORY:\n`;
    monthlyReadings.forEach(reading => {
      report += `${reading.month}:\n`;
      report += `  - Total new consumption: ${reading.adjustedTotal.toFixed(2)} units\n`;
      report += `  - I used: ${reading.adjustedMine.toFixed(2)} units\n`;
      report += `  - Neighbor used: ${reading.neighborUsed.toFixed(2)} units (deducted from prepaid)\n\n`;
    });
    
    if (daysRemainingEstimate()) {
      report += `ESTIMATE: Neighbor's units will last ~${daysRemainingEstimate()} more days\n`;
    }
    
    const dataBlob = new Blob([report], {type: 'text/plain'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meter-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const myTotalUnits = myPurchases.reduce((sum, purchase) => sum + purchase.units, 0);
  const myTotalSpent = myPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const totalNeighborUsed = monthlyReadings.reduce((sum, reading) => sum + reading.neighborUsed, 0);
  const totalMyUsed = monthlyReadings.reduce((sum, reading) => sum + reading.adjustedMine, 0);
  
  const myCurrentEffectiveUnits = myStartingUnits + myTotalUnits - totalMyUsed;
  
  const daysRemainingEstimate = () => {
    if (monthlyReadings.length === 0 || neighborAvailableUnits <= 0) return null;
    
    const avgMonthlyUsage = totalNeighborUsed / monthlyReadings.length;
    const avgDailyUsage = avgMonthlyUsage / 30;
    
    if (avgDailyUsage <= 0) return null;
    
    return Math.floor(neighborAvailableUnits / avgDailyUsage);
  };

  if (!setupComplete) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="text-yellow-500" />
            Meter Tracker Setup
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Enter your current meter readings (what the physical meters display right now) to establish baselines for tracking new consumption.
            </p>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Your Current Meter Reading (not available units!)
              </label>
              <input
                type="number"
                placeholder="e.g., 4254"
                value={tempMyStarting}
                onChange={(e) => setTempMyStarting(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">This is what your physical meter displays right now - cumulative usage since installation</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Neighbor's Current Meter Reading (not available units!)
              </label>
              <input
                type="number"
                placeholder="e.g., 362"
                value={tempNeighborStarting}
                onChange={(e) => setTempNeighborStarting(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">This is what her physical meter displays right now - cumulative usage since installation</p>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-200">
            <h3 className="font-medium text-red-800 mb-3">Outstanding Usage (Already Consumed)</h3>
            <p className="text-sm text-red-700 mb-3">
              Your neighbor used these units in previous months but hasn't paid for them yet. 
              Since she already bought the prepaid units, these will be deducted from her prepaid balance:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">
                  Month 1 Outstanding (units)
                </label>
                <input
                  type="number"
                  value={tempOutstanding1}
                  onChange={(e) => setTempOutstanding1(e.target.value)}
                  className="w-full border border-red-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">
                  Month 2 Outstanding (units)
                </label>
                <input
                  type="number"
                  value={tempOutstanding2}
                  onChange={(e) => setTempOutstanding2(e.target.value)}
                  className="w-full border border-red-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div className="mt-3 text-sm bg-white p-3 rounded border">
              <div className="font-medium">How This Works:</div>
              <div>• Your meter baseline: {tempMyStarting || '0'} units (what your meter shows now)</div>
              <div>• Neighbor's meter baseline: {tempNeighborStarting || '0'} units (what her meter shows now)</div>
              <div>• Her total prepaid units: {neighborTotalPrepaid.toFixed(2)} units</div>
              <div className="text-red-600">• Less outstanding debt: {((parseFloat(tempOutstanding1) || 0) + (parseFloat(tempOutstanding2) || 0)).toFixed(2)} units</div>
              <div className="font-bold text-green-600 border-t pt-1 mt-1">
                = She can use {(neighborTotalPrepaid - (parseFloat(tempOutstanding1) || 0) - (parseFloat(tempOutstanding2) || 0)).toFixed(2)} more units for free
              </div>
              <div className="text-blue-600 text-xs mt-1">
                (Her meter will show up to {((parseFloat(tempNeighborStarting) || 0) + (neighborTotalPrepaid - (parseFloat(tempOutstanding1) || 0) - (parseFloat(tempOutstanding2) || 0))).toFixed(2)} before free units are exhausted)
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-blue-800 mb-2">What This Setup Does:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Sets baseline readings for accurate future tracking</li>
              <li>• Adds neighbor's 248.68 available prepaid units on top of her 362 baseline</li>
              <li>• Future readings will calculate NEW consumption only (reading minus baseline)</li>
              <li>• Monthly processing deducts her new usage from available prepaid units</li>
            </ul>
          </div>
          
          <button
            onClick={completeSetup}
            disabled={!tempMyStarting || !tempNeighborStarting}
            className="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            Complete Setup & Start Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Zap className="text-yellow-500" />
          Shared Meter Tracker - Deduction Method
        </h1>
        <p className="text-gray-600 mb-4">Track neighbor's prepaid units and your purchases until her units are exhausted</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${neighborAvailableUnits > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className={`font-semibold mb-2 ${neighborAvailableUnits > 0 ? 'text-green-800' : 'text-red-800'}`}>
              Neighbor's Prepaid Status
            </h3>
            <div className="space-y-1 text-sm">
              <div>Baseline reading: {neighborStartingUnits.toFixed(2)} units</div>
              <div>Total prepaid: {neighborTotalPrepaid.toFixed(2)} units</div>
              <div className="text-orange-600">🔒 Locked units: {neighborLockedUnits.toFixed(2)}</div>
              <div className="font-bold text-lg text-green-600">
                ✅ Available: {neighborAvailableUnits.toFixed(2)} units
              </div>
              <div>Used since setup: {(neighborTotalPrepaid - neighborLockedUnits - neighborAvailableUnits).toFixed(2)} units</div>
              <div>Cost per unit: ₦{oldRate} (prepaid)</div>
              {neighborAvailableUnits <= 0 && (
                <div className="text-red-600 font-medium flex items-center gap-1 mt-2">
                  <AlertTriangle size={16} />
                  Free Units Exhausted!
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">My Usage Status</h3>
            <div className="space-y-1 text-sm">
              <div>Baseline reading: {myStartingUnits.toFixed(2)}</div>
              <div>Units purchased: {myTotalUnits.toFixed(2)}</div>
              <div className="font-bold text-lg">
                Total spent: ₦{myTotalSpent.toLocaleString()}
              </div>
              <div>Used since setup: {totalMyUsed.toFixed(2)} units</div>
              <div className="font-bold text-green-600">
                Current balance: {myCurrentEffectiveUnits.toFixed(2)} units
              </div>
              <div>Cost per unit: ₦{newRate} (current purchases)</div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Rate Comparison</h3>
            <div className="space-y-1 text-sm">
              <div>Neighbor's rate: ₦{oldRate}/unit</div>
              <div>Your rate: ₦{newRate}/unit</div>
              <div className="font-medium text-red-600">
                Difference: ₦{newRate - oldRate}/unit
              </div>
              <div className="text-orange-600">
                Price increase: {((newRate/oldRate - 1) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Timeline Estimate</h3>
            <div className="text-sm">
              {daysRemainingEstimate() ? (
                <div>
                  <div>Based on usage pattern:</div>
                  <div className="font-bold">~{daysRemainingEstimate()} days remaining</div>
                  <div className="text-gray-600 mt-1">for neighbor's units</div>
                </div>
              ) : (
                <div className="text-gray-600">
                  Add monthly readings to see estimates
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {neighborAvailableUnits <= 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-red-500">
          <h2 className="text-xl font-semibold mb-4 text-red-700 flex items-center gap-2">
            <AlertTriangle className="text-red-600" />
            Payment Required - Free Units Exhausted
          </h2>
          
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <p className="text-red-800 font-medium mb-2">
              Your neighbor's available prepaid units are exhausted. She now has 3 options:
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-green-300 rounded-lg p-4 bg-green-50">
              <h4 className="font-bold text-green-700 mb-2">Option 1: Unlock Prepaid</h4>
              <div className="text-sm space-y-1">
                <div>Pay outstanding debt at old rate:</div>
                <div className="font-bold text-lg">₦{(neighborLockedUnits * oldRate).toLocaleString()}</div>
                <div>Unlocks: {neighborLockedUnits.toFixed(2)} units</div>
                <div className="text-green-600">✅ Best value option</div>
              </div>
            </div>
            
            <div className="border border-yellow-300 rounded-lg p-4 bg-yellow-50">
              <h4 className="font-bold text-yellow-700 mb-2">Option 2: Settle at Current Rate</h4>
              <div className="text-sm space-y-1">
                <div>Pay outstanding debt at current rate:</div>
                <div className="font-bold text-lg">₦{(neighborLockedUnits * newRate).toLocaleString()}</div>
                <div>Settles: {neighborLockedUnits.toFixed(2)} units</div>
                <div className="text-yellow-600">⚠️ More expensive</div>
              </div>
            </div>
            
            <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
              <h4 className="font-bold text-blue-700 mb-2">Option 3: New Purchases Only</h4>
              <div className="text-sm space-y-1">
                <div>Buy new electricity at:</div>
                <div className="font-bold text-lg">₦{newRate}/unit</div>
                <div>Locked units remain unused</div>
                <div className="text-blue-600">💡 Pay as you go</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Plus className="text-green-600" />
          My Electricity Purchases (₦{newRate}/unit)
        </h2>
        <div className="flex gap-3 items-center mb-4">
          <input
            type="number"
            placeholder="Amount (₦)"
            value={newPurchaseAmount}
            onChange={(e) => setNewPurchaseAmount(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-40"
          />
          <button
            onClick={addMyPurchase}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Add Purchase
          </button>
        </div>
        
        {myPurchases.length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
              <span>Date</span>
              <span>Amount</span>
              <span>Units</span>
            </div>
            {myPurchases.map((purchase, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-2 rounded">
                <span>{purchase.date}</span>
                <span>₦{purchase.amount.toLocaleString()}</span>
                <span>{purchase.units.toFixed(2)} units</span>
              </div>
            ))}
            <div className="border-t pt-2 font-semibold bg-green-50 p-2 rounded">
              <div className="grid grid-cols-3 gap-4">
                <span>TOTAL:</span>
                <span>₦{myTotalSpent.toLocaleString()}</span>
                <span>{myTotalUnits.toFixed(2)} units</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">No purchases recorded yet</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calculator className="text-blue-600" />
          Monthly Meter Readings & Deductions
        </h2>
        
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <input
            type="text"
            placeholder="Month (e.g., Sept 2025)"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Total meter reading"
            value={totalMeterReading}
            onChange={(e) => setTotalMeterReading(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="My meter reading"
            value={myMeterReading}
            onChange={(e) => setMyMeterReading(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <button
            onClick={addMonthlyReading}
            disabled={!totalMeterReading || !myMeterReading || !currentMonth}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Process Month
          </button>
        </div>
        
        {monthlyReadings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Monthly History:</h4>
            {monthlyReadings.map((reading, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-blue-800 mb-2">{reading.month}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">Meter Readings:</div>
                      <div>Total: {reading.totalReading} units</div>
                      <div>Your meter: {reading.myReading} units</div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">New Consumption:</div>
                      <div>Total new: {reading.adjustedTotal.toFixed(2)} units</div>
                      <div>Your new: {reading.adjustedMine.toFixed(2)} units</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">
                          Cost: ₦{(reading.adjustedMine * newRate).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-green-600">Neighbor Used:</div>
                        <div>{reading.neighborUsed.toFixed(2)} units</div>
                        <div className="text-xs text-gray-500">
                          From prepaid (₦{oldRate}/unit)
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Current Status</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Your Situation:</h3>
            <div className="space-y-1 text-sm">
              <div>Total spent: ₦{myTotalSpent.toLocaleString()}</div>
              <div>Units purchased: {myTotalUnits.toFixed(2)}</div>
              <div>Average cost: ₦{myTotalSpent > 0 ? (myTotalSpent/myTotalUnits).toFixed(2) : newRate}/unit</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Neighbor's Situation:</h3>
            <div className="space-y-1 text-sm">
              <div>Prepaid units left: {neighborAvailableUnits.toFixed(2)}</div>
              <div>Total used so far: {totalNeighborUsed.toFixed(2)} units</div>
              <div>Still covered by prepaid: {neighborAvailableUnits > 0 ? 'Yes' : 'No'}</div>
              {neighborAvailableUnits <= 0 && (
                <div className="text-red-600 font-medium">
                  Must now buy at ₦{newRate}/unit
                </div>
              )}
            </div>
          </div>
        </div>
        
        {daysRemainingEstimate() && neighborAvailableUnits > 0 && (
          <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded">
            <strong>Estimate:</strong> At current usage rate, neighbor's prepaid units will last approximately {daysRemainingEstimate()} more days.
          </div>
        )}
        
        {neighborAvailableUnits <= 0 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
            <strong>Notice:</strong> Neighbor's prepaid units are exhausted. She must now purchase electricity at the current rate of ₦{newRate}/unit.
          </div>
        )}
      </div>
      
      <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">How to Use This Tracker</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span><strong>When you buy electricity:</strong> Add your purchase amount. The system calculates units automatically.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span><strong>At month-end:</strong> Read both meters, enter the values and month name, then click "Process Month".</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span><strong>Automatic deduction:</strong> The system automatically deducts your neighbor's usage from her remaining prepaid units.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">4.</span>
            <span><strong>No payments between you:</strong> Your neighbor pays nothing until her prepaid units run out completely.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">5.</span>
            <span><strong>After exhaustion:</strong> Once her units are finished, she'll need to start buying at ₦{newRate}/unit like you.</span>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={resetTracker}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset All Data
          </button>
          
          <button
            onClick={exportToText}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
          >
            📄 Export Report
          </button>
          
          <button
            onClick={exportData}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"
          >
            💾 Save Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeterTracker; className="font-medium text-blue-600">You Used:</div>
                        <div>{reading.adjustedMine.toFixed(2)} units</div>
                        <div 
