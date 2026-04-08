import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  UploadCloud, Activity, ShieldCheck, AlertTriangle, 
  Wallet, PiggyBank, ArrowRight, Loader2, Download, Globe, Lock,
  ChevronRight, CheckCircle2, Users, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { translations, Language } from './translations';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Transaction {
  Date: string;
  Amount: number;
  Type: 'IN' | 'OUT';
  Category?: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface AnalysisResult {
  trustScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  loanEligibility: string;
  savingsRecommendation: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  };
  categories: CategoryData[];
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const dashboardRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('TrustFlow_Certificate.pdf');
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
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
        Determine the Risk Level (Low, Medium, High).
        Provide a suggested Loan Eligibility amount.
        Provide a highly specific, goal-oriented savings recommendation. For example: "You consistently have an extra $15 at the end of the week. If you save $10 of that, you can afford [relevant business tool] in 3 months."
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

  const LandingPage = () => (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6">
              <Activity className="w-4 h-4" />
              {t.subtitle}
            </div>
            <h1 className="text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[0.9] mb-8">
              {t.heroTitle}
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
              {t.heroDesc}
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setView('dashboard')}
                className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
              >
                {t.getStarted}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all">
                {t.howItWorks}
              </button>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-50" />
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 overflow-hidden">
              <img 
                src="https://picsum.photos/seed/finance/800/600" 
                alt="TrustFlow Dashboard Preview" 
                className="rounded-2xl w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-8 right-8 bg-white/90 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Trust Score</div>
                  <div className="text-xl font-black text-slate-900">84/100</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">{t.howItWorks}</h2>
            <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: UploadCloud, title: t.step1Title, desc: t.step1Desc, color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: Activity, title: t.step2Title, desc: t.step2Desc, color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { icon: ShieldCheck, title: t.step3Title, desc: t.step3Desc, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            ].map((step, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", step.bg)}>
                  <step.icon className={cn("w-8 h-8", step.color)} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-48 bg-indigo-600 rounded-3xl flex items-center justify-center text-white p-6">
                  <Users className="w-12 h-12" />
                </div>
                <div className="h-64 bg-slate-100 rounded-3xl overflow-hidden">
                  <img src="https://picsum.photos/seed/market/400/600" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="h-64 bg-emerald-500 rounded-3xl overflow-hidden">
                  <img src="https://picsum.photos/seed/worker/400/600" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="h-48 bg-slate-900 rounded-3xl flex items-center justify-center text-white p-6">
                  <TrendingUp className="w-12 h-12" />
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-4xl font-bold text-slate-900 mb-8">{t.whyTrustFlow}</h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{t.privacyTitle}</h4>
                  <p className="text-slate-600">{t.privacyDesc}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{t.impactTitle}</h4>
                  <p className="text-slate-600">{t.impactDesc}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setView('dashboard')}
              className="mt-12 px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              {t.getStarted}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-indigo-600">
            <Activity className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight">TrustFlow</span>
          </div>
          <div className="text-slate-500 text-sm">
            © 2024 TrustFlow. Empowering the informal economy.
          </div>
          <div className="flex gap-6">
            <button onClick={() => setLang('en')} className={cn("text-sm font-bold", lang === 'en' ? "text-indigo-600" : "text-slate-400")}>English</button>
            <button onClick={() => setLang('sw')} className={cn("text-sm font-bold", lang === 'sw' ? "text-indigo-600" : "text-slate-400")}>Swahili</button>
          </div>
        </div>
      </footer>
    </div>
  );

  const Dashboard = () => (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 cursor-pointer" onClick={() => setView('landing')}>
            <Activity className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight">{t.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <Lock className="w-3.5 h-3.5" />
              {t.privacyBadge}
            </div>
            <button 
              onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
              className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <Globe className="w-4 h-4" />
              {lang === 'en' ? 'SW' : 'EN'}
            </button>
            <button 
              onClick={() => setView('landing')}
              className="text-sm font-bold text-slate-500 hover:text-slate-900"
            >
              {t.backToHome}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Privacy Badge */}
      <div className="sm:hidden bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-start gap-2 text-xs font-medium text-emerald-700">
        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
        {t.privacyBadge}
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-semibold">{t.dataInput}</h2>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {t.inputHelp}
            </p>
            <textarea
              className="w-full h-64 p-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="QW12345678 Confirmed. You have received Ksh 5,000..."
            />
            <button
              onClick={() => setInputText(SAMPLE_SMS)}
              className="w-full mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors text-left"
            >
              + {t.loadSample}
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText.trim()}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.analyzing}
                </>
              ) : (
                <>
                  {t.analyzeBtn}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          {!result && !isAnalyzing && (
            <div className="h-full min-h-[400px] bg-white rounded-2xl shadow-sm border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <ShieldCheck className="w-16 h-16 mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">{t.readyTitle}</h3>
              <p className="max-w-sm">
                {t.readyDesc}
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="h-full min-h-[400px] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-indigo-500 p-8 text-center">
              <Loader2 className="w-12 h-12 mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">{t.analyzing}</h3>
            </div>
          )}

          {result && !isAnalyzing && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-end">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t.downloadScore}
                </button>
              </div>

              <div ref={dashboardRef} className="space-y-6 bg-slate-50 p-2 -m-2 rounded-xl">
                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Trust Score */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className={cn(
                      "absolute top-0 left-0 w-full h-1",
                      result.trustScore >= 70 ? "bg-emerald-500" : 
                      result.trustScore >= 40 ? "bg-amber-500" : "bg-red-500"
                    )} />
                    <span className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">{t.trustScore}</span>
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        "text-5xl font-bold tracking-tighter",
                        result.trustScore >= 70 ? "text-emerald-600" : 
                        result.trustScore >= 40 ? "text-amber-500" : "text-red-500"
                      )}>
                        {result.trustScore}
                      </span>
                      <span className="text-slate-400 font-medium">/100</span>
                    </div>
                  </div>

                  {/* Risk Level */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className={cn(
                        "w-5 h-5",
                        result.riskLevel === 'Low' ? "text-emerald-500" :
                        result.riskLevel === 'Medium' ? "text-amber-500" : "text-red-500"
                      )} />
                      <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t.riskLevel}</span>
                    </div>
                    <span className={cn(
                      "text-2xl font-bold",
                      result.riskLevel === 'Low' ? "text-emerald-600" :
                      result.riskLevel === 'Medium' ? "text-amber-600" : "text-red-600"
                    )}>
                      {result.riskLevel === 'Low' ? t.lowRisk : result.riskLevel === 'Medium' ? t.mediumRisk : t.highRisk}
                    </span>
                  </div>

                  {/* Loan Eligibility */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-5 h-5 text-indigo-500" />
                      <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t.eligibility}</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900 leading-tight">
                      {result.loanEligibility}
                    </span>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold mb-6">{t.incomeVsExpenses}</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold mb-6">{t.expenseCategories}</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={result.categories}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {result.categories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => `$${value.toLocaleString()}`}
                          />
                          <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Recommendations & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                      <PiggyBank className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-indigo-900">{t.aiRecommendation}</h3>
                    </div>
                    <p className="text-indigo-800 text-sm leading-relaxed">
                      {result.savingsRecommendation}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-slate-900 mb-4">{t.dataSummary}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{t.totalIncome}</span>
                        <span className="font-medium text-emerald-600">KES {result.summary.totalIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{t.totalExpenses}</span>
                        <span className="font-medium text-rose-600">KES {result.summary.totalExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{t.netBalance}</span>
                        <span className="font-medium text-slate-900">KES {result.summary.balance.toLocaleString()}</span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                        <span className="text-slate-500">{t.transactions}</span>
                        <span className="font-medium text-slate-900">{result.summary.transactionCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );

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
          <LandingPage />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Dashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
