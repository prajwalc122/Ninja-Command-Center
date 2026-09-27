import React, { useState, useEffect } from 'react';
import { Landmark, Copy, Check } from 'lucide-react';

interface Props {
  initialParameters?: {
    principal?: number;
    rate?: number;
    years?: number;
  };
  onRecordHistory?: (result: any) => void;
}

export const EmiCalculatorTool: React.FC<Props> = ({ initialParameters, onRecordHistory }) => {
  const [principal, setPrincipal] = useState<number>(initialParameters?.principal || 500000);
  const [rate, setRate] = useState<number>(initialParameters?.rate || 9.0);
  const [years, setYears] = useState<number>(initialParameters?.years || 5);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialParameters) {
      if (initialParameters.principal) setPrincipal(initialParameters.principal);
      if (initialParameters.rate) setRate(initialParameters.rate);
      if (initialParameters.years) setYears(initialParameters.years);
    }
  }, [initialParameters]);

  // Monthly interest rate
  const monthlyRate = rate / 12 / 100;
  const totalMonths = years * 12;

  // EMI formula: [P x R x (1+R)^N] / [(1+R)^N - 1]
  const emi =
    monthlyRate === 0
      ? principal / totalMonths
      : Math.round(
          (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        );

  const totalAmount = emi * totalMonths;
  const totalInterest = Math.max(0, totalAmount - principal);
  const interestRatio = totalAmount > 0 ? Math.round((totalInterest / totalAmount) * 100) : 0;
  const principalRatio = 100 - interestRatio;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopyBreakdown = () => {
    const text = `Loan EMI Summary:
Principal Loan Amount: ${formatCurrency(principal)}
Annual Interest Rate: ${rate}%
Tenure: ${years} Years (${totalMonths} months)
-----------------------------
Monthly EMI: ${formatCurrency(emi)}
Total Interest Payable: ${formatCurrency(totalInterest)}
Total Payment (Principal + Interest): ${formatCurrency(totalAmount)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (onRecordHistory) {
      onRecordHistory({
        command: `Calculated EMI for ${formatCurrency(principal)} at ${rate}% for ${years} yrs`,
        toolId: 'emi-calculator',
        toolName: 'Loan EMI Calculator',
        status: 'success',
        resultPreview: `Monthly EMI: ${formatCurrency(emi)} | Total Interest: ${formatCurrency(totalInterest)}`,
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Inputs Form */}
      <div className="lg:col-span-7 space-y-6">
        {/* Principal */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-400 uppercase tracking-wider">Loan Amount</span>
            <span className="font-mono text-emerald-400 text-sm">{formatCurrency(principal)}</span>
          </div>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Math.max(1000, Number(e.target.value)))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
          />
          <input
            type="range"
            min="50000"
            max="10000000"
            step="25000"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex gap-2 pt-1">
            {[100000, 500000, 1000000, 2500000, 5000000].map((amt) => (
              <button
                key={amt}
                onClick={() => setPrincipal(amt)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  principal === amt
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                ₹{amt / 100000}L
              </button>
            ))}
          </div>
        </div>

        {/* Rate of Interest */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-400 uppercase tracking-wider">Interest Rate (p.a.)</span>
            <span className="font-mono text-emerald-400 text-sm">{rate}%</span>
          </div>
          <input
            type="number"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(Math.max(0.1, Number(e.target.value)))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
          />
          <input
            type="range"
            min="1"
            max="25"
            step="0.25"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Tenure */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-400 uppercase tracking-wider">Tenure</span>
            <span className="font-mono text-emerald-400 text-sm">{years} Years ({totalMonths} Months)</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex gap-2 pt-1">
            {[1, 3, 5, 10, 15, 20].map((yr) => (
              <button
                key={yr}
                onClick={() => setYears(yr)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  years === yr
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                {yr} {yr === 1 ? 'yr' : 'yrs'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Card */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0d1322] p-6 space-y-6">
        <div>
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Monthly Loan EMI</span>
          <div className="text-3xl font-extrabold text-white mt-1 font-mono tracking-tight text-emerald-400">
            {formatCurrency(emi)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Payable for {totalMonths} months</div>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Principal Amount:</span>
            <span className="font-mono font-semibold text-slate-200">{formatCurrency(principal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total Interest:</span>
            <span className="font-mono font-semibold text-amber-400">{formatCurrency(totalInterest)}</span>
          </div>
          <div className="flex justify-between items-center font-bold text-slate-100 pt-2 border-t border-slate-800">
            <span>Total Payable Amount:</span>
            <span className="font-mono text-sm text-white">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Visual proportion */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Principal ({principalRatio}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Interest ({interestRatio}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-800 flex overflow-hidden">
            <div style={{ width: `${principalRatio}%` }} className="bg-emerald-500 h-full" />
            <div style={{ width: `${interestRatio}%` }} className="bg-amber-500 h-full" />
          </div>
        </div>

        <button
          onClick={handleCopyBreakdown}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied Breakdown</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy EMI Summary</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
