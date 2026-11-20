import { useEffect, useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from './translations';
import { LandingPage } from './components/LandingPage';
import { Dashboard, AnalysisResult, MonthlyData } from './components/Dashboard';
import { downloadCertificate } from './lib/certificate';
import { scoreBand } from './lib/score';

// Created lazily: the SDK throws in the browser when the key is missing,
// which would otherwise crash the whole page on load.
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Create a .env.local file in the project folder with GEMINI_API_KEY=your_key, then restart "npm run dev".',
    );
  }
  aiClient ??= new GoogleGenAI({ apiKey });
  return aiClient;
}

interface Transaction {
  Date: string;
  Amount: number;
  Type: 'IN' | 'OUT';
  Category?: string;
}

const SAMPLE_SMS = `
QW12345678 Confirmed. You have received Ksh 5,000 from John Doe on 1/9/23 at 10:00 AM. New M-PESA balance is Ksh 15,000.
QW87654321 Confirmed. Ksh 1,200 sent to KPLC PREPAID for account 123456 on 5/9/23 at 2:30 PM. New M-PESA balance is Ksh 13,800.
QX11223344 Confirmed. You have received Ksh 3,000 from Jane Smith on 12/9/23 at 9:15 AM. New M-PESA balance is Ksh 16,800.
QX99887766 Confirmed. Ksh 500 sent to Safaricom Data Bundles on 15/9/23 at 6:45 PM. New M-PESA balance is Ksh 16,300.
QY55443322 Confirmed. Ksh 2,000 sent to Mama Mboga Market on 20/9/23 at 11:20 AM. New M-PESA balance is Ksh 14,300.
QZ12312312 Confirmed. You have received Ksh 6,000 from Client A on 2/10/23 at 4:00 PM. New M-PESA balance is Ksh 20,300.
QZ98798798 Confirmed. Ksh 1,500 sent to Nairobi Water on 8/10/23 at 1:10 PM. New M-PESA balance is Ksh 18,800.
QA11122233 Confirmed. You have received Ksh 4,000 from Client B on 14/10/23 at 10:30 AM. New M-PESA balance is Ksh 22,800.
QA44455566 Confirmed. Ksh 800 sent to Naivas Supermarket on 18/10/23 at 5:50 PM. New M-PESA balance is Ksh 22,000.
QB77788899 Confirmed. Ksh 2,500 sent to Hardware Store on 25/10/23 at 9:00 AM. New M-PESA balance is Ksh 19,500.
`;

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('en');

  const t = translations[lang];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const handleDownloadPDF = () => {
    if (!result) return;
    const key = scoreBand(result.trustScore).key;
    const label = key === 'low' ? t.lowRisk : key === 'medium' ? t.mediumRisk : t.highRisk;
    try {
      downloadCertificate(result, label);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  const handleStart = (withSample?: boolean) => {
    if (withSample) setInputText(SAMPLE_SMS.trim());
    setView('dashboard');
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setInputText('');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const ai = getAI();
      const parsePrompt = `
        You are a financial data parser. Extract transactions from the following text.
        The text might be raw M-Pesa SMS messages or CSV data.
        For each transaction, extract:
        - Date (format as YYYY-MM-DD)
        - Amount (number only)
        - Type ('IN' for received money, 'OUT' for sent/paid money)
        - Category (For 'OUT' transactions, categorize the expense based on the recipient name, e.g., 'Utilities', 'Groceries', 'Business Inventory', 'Airtime/Data', 'Other'. For 'IN', leave empty or 'Income').
        
        Return a JSON array of these transaction objects.
        
        Text to parse:
        ${inputText}
      `;

      const parseResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: parsePrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                Date: { type: Type.STRING },
                Amount: { type: Type.NUMBER },
                Type: { type: Type.STRING },
                Category: { type: Type.STRING },
              },
              required: ['Date', 'Amount', 'Type'],
            }
          }
        }
      });

      const transactions: Transaction[] = JSON.parse(parseResponse.text || '[]');

      if (transactions.length === 0) {
        throw new Error('No valid transactions found. Please check your input.');
      }

      let totalIncome = 0;
      let totalExpenses = 0;
      const monthlyMap = new Map<string, { income: number; expenses: number }>();
      const categoryMap = new Map<string, number>();

      transactions.forEach(t => {
        if (t.Type === 'IN') totalIncome += t.Amount;
        if (t.Type === 'OUT') {
          totalExpenses += t.Amount;
          const cat = t.Category || 'Other';
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.Amount);
        }

        const date = new Date(t.Date);
        if (isNaN(date.getTime())) return;
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { income: 0, expenses: 0 });
        }
        
        const current = monthlyMap.get(monthKey)!;
        if (t.Type === 'IN') current.income += t.Amount;
        if (t.Type === 'OUT') current.expenses += t.Amount;
      });

      const newChartData = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setChartData(newChartData);

      const categories = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const summary = {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transactionCount: transactions.length,
      };

      const analysisPrompt = `
        Analyze the following mobile money transaction summary for an informal worker to provide an alternative credit score.
        
        Summary:
        - Total Income: ${summary.totalIncome}
        - Total Expenses: ${summary.totalExpenses}
        - Balance: ${summary.balance}
        - Number of Transactions: ${summary.transactionCount}
        - Monthly Data: ${JSON.stringify(newChartData)}
        - Expense Categories: ${JSON.stringify(categories)}
        
        Based on this data, calculate a Trust Score (0-100) considering income stability, spending vs income balance, and transaction consistency.
        Determine the Risk Level using these bands: score 0-40 = High, 41-70 = Medium, 71-100 = Low.
        Provide a suggested Loan Eligibility as a short phrase in Kenyan Shillings, e.g. "Up to KES 15,000" (max 8 words).
        Provide a highly specific, goal-oriented savings recommendation in 1-2 sentences, using KES. For example: "You consistently have an extra KES 1,500 at the end of the week. If you save KES 1,000 of that, you can afford [relevant business tool] in 3 months."
        ${lang === 'sw' ? 'Write loanEligibility and savingsRecommendation in Kiswahili.' : ''}
      `;

      const analysisResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: analysisPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              trustScore: { type: Type.INTEGER, description: 'Trust score from 0 to 100' },
              riskLevel: { type: Type.STRING, description: 'Low, Medium, or High' },
              loanEligibility: { type: Type.STRING, description: 'Suggested loan amount or eligibility status' },
              savingsRecommendation: { type: Type.STRING, description: 'Personalized, goal-oriented advice for saving' },
            },
            required: ['trustScore', 'riskLevel', 'loanEligibility', 'savingsRecommendation'],
          },
        },
      });

      const aiResult = JSON.parse(analysisResponse.text || '{}');
      
      setResult({
        ...aiResult,
        summary,
        categories
      });

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || '';
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        setError('API Key Error (403 Forbidden): Please ensure your GEMINI_API_KEY is set in the Secrets panel, and that the key does not have restrictive HTTP referrer limits in Google Cloud.');
      } else {
        setError(errorMessage || t.error);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <LandingPage t={t} lang={lang} setLang={setLang} onStart={handleStart} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Dashboard
            t={t}
            lang={lang}
            setLang={setLang}
            onHome={() => setView('landing')}
            inputText={inputText}
            setInputText={setInputText}
            onLoadSample={() => setInputText(SAMPLE_SMS.trim())}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            onDownload={handleDownloadPDF}
            isAnalyzing={isAnalyzing}
            error={error}
            result={result}
            chartData={chartData}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
