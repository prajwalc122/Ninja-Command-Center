import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Copy, Check } from 'lucide-react';

interface Props {
  initialParameters?: { amount?: number; from?: string; to?: string };
  onRecordHistory?: (result: any) => void;
}

// Global conversion rates
const CURRENCY_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  INR: 0.012, // 1 INR ~ 0.012 USD (1 USD ~ 83.4 INR)
  EUR: 1.08,
  GBP: 1.28,
  JPY: 0.0067,
  CAD: 0.74,
};

export const UnitConverterTool: React.FC<Props> = ({ initialParameters, onRecordHistory }) => {
  const [category, setCategory] = useState<'currency' | 'length' | 'weight' | 'temp'>('currency');
  const [amount, setAmount] = useState<number>(initialParameters?.amount || 10);
  const [fromUnit, setFromUnit] = useState<string>(initialParameters?.from || 'USD');
  const [toUnit, setToUnit] = useState<string>(initialParameters?.to || 'INR');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialParameters) {
      if (initialParameters.amount) setAmount(initialParameters.amount);
      if (initialParameters.from) setFromUnit(initialParameters.from.toUpperCase());
      if (initialParameters.to) setToUnit(initialParameters.to.toUpperCase());
    }
  }, [initialParameters]);

  const calculateResult = (): number => {
    if (category === 'currency') {
      const fromRate = CURRENCY_RATES_TO_USD[fromUnit] || 1;
      const toRate = CURRENCY_RATES_TO_USD[toUnit] || 1;
      const inUsd = amount * fromRate;
      return inUsd / toRate;
    }

    if (category === 'length') {
      // Base: meters
      const toMeters: Record<string, number> = { KM: 1000, M: 1, CM: 0.01, MILE: 1609.34, FEET: 0.3048, INCH: 0.0254 };
      const fromM = amount * (toMeters[fromUnit] || 1);
      return fromM / (toMeters[toUnit] || 1);
    }

    if (category === 'weight') {
      // Base: kg
      const toKg: Record<string, number> = { KG: 1, G: 0.001, LBS: 0.453592, OZ: 0.0283495 };
      const fromK = amount * (toKg[fromUnit] || 1);
      return fromK / (toKg[toUnit] || 1);
    }

    if (category === 'temp') {
      if (fromUnit === 'C' && toUnit === 'F') return (amount * 9) / 5 + 32;
      if (fromUnit === 'F' && toUnit === 'C') return ((amount - 32) * 5) / 9;
      if (fromUnit === 'C' && toUnit === 'K') return amount + 273.15;
      if (fromUnit === 'K' && toUnit === 'C') return amount - 273.15;
      return amount;
    }

    return amount;
  };

  const result = calculateResult();

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${amount} ${fromUnit} = ${result.toFixed(2)} ${toUnit}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (onRecordHistory) {
      onRecordHistory({
        command: `Converted ${amount} ${fromUnit} to ${toUnit}`,
        toolId: 'unit-converter',
        toolName: 'Currency & Unit Converter',
        status: 'success',
        resultPreview: `${amount} ${fromUnit} = ${result.toFixed(2)} ${toUnit}`,
      });
    }
  };

  const currencyUnits = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'CAD'];
  const lengthUnits = ['KM', 'M', 'CM', 'MILE', 'FEET', 'INCH'];
  const weightUnits = ['KG', 'G', 'LBS', 'OZ'];
  const tempUnits = ['C', 'F', 'K'];

  const getUnits = () => {
    if (category === 'currency') return currencyUnits;
    if (category === 'length') return lengthUnits;
    if (category === 'weight') return weightUnits;
    return tempUnits;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Category selector */}
      <div className="flex rounded-xl p-1 bg-slate-900 border border-slate-800">
        {[
          { id: 'currency', label: 'Currency' },
          { id: 'length', label: 'Length' },
          { id: 'weight', label: 'Weight' },
          { id: 'temp', label: 'Temperature' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCategory(c.id as any);
              if (c.id === 'currency') {
                setFromUnit('USD');
                setToUnit('INR');
              } else if (c.id === 'length') {
                setFromUnit('KM');
                setToUnit('MILE');
              } else if (c.id === 'weight') {
                setFromUnit('KG');
                setToUnit('LBS');
              } else {
                setFromUnit('C');
                setToUnit('F');
              }
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
              category === c.id
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Input / Swap / Output */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1322] p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">From</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {getUnits().map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center md:col-span-1 pt-4">
            <button
              onClick={handleSwap}
              className="p-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title="Swap units"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">To</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 font-mono text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {getUnits().map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result display */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
          <div className="text-xs text-slate-400">Calculated Value</div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {result.toLocaleString(undefined, { maximumFractionDigits: 3 })} <span className="text-base text-slate-400">{toUnit}</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            1 {fromUnit} = {(result / (amount || 1)).toFixed(4)} {toUnit}
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied Conversion</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Conversion Result</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
