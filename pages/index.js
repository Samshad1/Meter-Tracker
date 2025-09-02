 import React, { useState } from 'react';
import { Plus, RotateCcw, Calculator, Zap, AlertTriangle } from 'lucide-react';

const MeterTracker = () => {
  const [neighborAvailableUnits, setNeighborAvailableUnits] = useState(0);
  const [neighborTotalPrepaid, setNeighborTotalPrepaid] = useState(20000 / 65);
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
  const [showEditSettings, setShowEditSettings] = useState(false);

  const [tempOutstanding1, setTempOutstanding1] = useState('13');
  const [tempOutstanding2, setTempOutstanding2] = useState('46.01');

  const [oldRate, setOldRate] = useState(65);
  const [newRate, setNewRate] = useState(227);
  const [tempOldRate, setTempOldRate] = useState('65');
  const [tempNewRate, setTempNewRate] = useState('227');

  // ✅ Derived values should be declared before functions use them
  const myTotalUnits = myPurchases.reduce((sum, purchase) => sum + purchase.units, 0);
  const myTotalSpent = myPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const totalNeighborUsed = monthlyReadings.reduce((sum, reading) => sum + reading.neighborUsed, 0);
  const totalMyUsed = monthlyReadings.reduce((sum, reading) => sum + reading.adjustedMine, 0);
  const neighborLockedUnits = (parseFloat(tempOutstanding1) || 0) + (parseFloat(tempOutstanding2) || 0);

  const myCurrentEffectiveUnits = myStartingUnits + myTotalUnits - totalMyUsed;

  const daysRemainingEstimate = () => {
    if (monthlyReadings.length === 0 || neighborAvailableUnits <= 0) return null;

    const avgMonthlyUsage = totalNeighborUsed / monthlyReadings.length;
    const avgDailyUsage = avgMonthlyUsage / 30;

    if (avgDailyUsage <= 0) return null;

    return Math.floor(neighborAvailableUnits / avgDailyUsage);
  };

  const completeSetup = () => {
    if (tempMyStarting && tempNeighborStarting) {
      setMyStartingUnits(parseFloat(tempMyStarting));
      setNeighborStartingUnits(parseFloat(tempNeighborStarting));

      const newOldRate = parseFloat(tempOldRate) || 65;
      const newNewRate = parseFloat(tempNewRate) || 227;
      setOldRate(newOldRate);
      setNewRate(newNewRate);

      const newTotalPrepaid = 20000 / newOldRate;
      setNeighborTotalPrepaid(newTotalPrepaid);

      const outstanding1 = parseFloat(tempOutstanding1) || 0;
      const outstanding2 = parseFloat(tempOutstanding2) || 0;
      const totalOutstanding = outstanding1 + outstanding2;

      setNeighborAvailableUnits(newTotalPrepaid - totalOutstanding);
      setSetupComplete(true);
    }
  };

  const updateSettings = () => {
    const newOldRate = parseFloat(tempOldRate) || oldRate;
    const newNewRate = parseFloat(tempNewRate) || newRate;
    setOldRate(newOldRate);
    setNewRate(newNewRate);

    const newTotalPrepaid = 20000 / newOldRate;
    setNeighborTotalPrepaid(newTotalPrepaid);

    const outstanding1 = parseFloat(tempOutstanding1) || 0;
    const outstanding2 = parseFloat(tempOutstanding2) || 0;
    const totalOutstanding = outstanding1 + outstanding2;

    const totalUsedSoFar = totalNeighborUsed;
    const newAvailable = Math.max(0, newTotalPrepaid - totalOutstanding - totalUsedSoFar);
    setNeighborAvailableUnits(newAvailable);

    setShowEditSettings(false);
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
    setShowEditSettings(false);
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
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meter-tracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToText = () => {
    const neighborLocked = neighborLockedUnits;

    let report = `SHARED METER TRACKER REPORT\n`;
    report += `Generated: ${new Date().toLocaleDateString()}\n`;
    report += `================================\n\n`;

    report += `NEIGHBOR'S PREPAID STATUS:\n`;
    report += `- Meter baseline: ${neighborStartingUnits.toFixed(2)} units\n`;
    report += `- Total prepaid: ${neighborTotalPrepaid.toFixed(2)} units (₦20,000 at ₦${oldRate}/unit)\n`;
    report += `- Locked units: ${neighborLocked.toFixed(2)} units (outstanding debt)\n`;
    report += `- Available units: ${neighborAvailableUnits.toFixed(2)} units\n`;
    report += `- Used since setup: ${(neighborTotalPrepaid - neighborLocked - neighborAvailableUnits).toFixed(2)} units\n\n`;

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

    const dataBlob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meter-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ... rest of your JSX (unchanged)
};

export default MeterTracker;
