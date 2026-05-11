"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Settings, ShieldAlert, CreditCard } from "lucide-react";

export default function WalletSettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/settings/wallet");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev: any) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setMessage("Configuration sauvegardée avec succès !");
      } else {
        setMessage("Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      setMessage("Erreur de connexion.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#165E39]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Settings className="w-7 h-7 text-[#165E39]" />
            Paramètres du Wallet
          </h1>
          <p className="text-gray-500 font-medium">Configurez les frais de transaction et les plafonds de sécurité.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-[#165E39] hover:bg-[#0F3F26] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Enregistrer
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Frais de Dépôt */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <CreditCard className="w-5 h-5 text-gray-400" /> Frais de Dépôt
          </h2>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Money (%)</label>
            <input type="number" step="0.1" name="depositMobileMoneyPct" value={config?.depositMobileMoneyPct} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-[#165E39]/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Min (FCFA)</label>
              <input type="number" name="depositMobileMoneyMin" value={config?.depositMobileMoneyMin} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-[#165E39]/20" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Max (FCFA)</label>
              <input type="number" name="depositMobileMoneyMax" value={config?.depositMobileMoneyMax} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-[#165E39]/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Carte Bancaire (%)</label>
            <input type="number" step="0.1" name="depositBankCardPct" value={config?.depositBankCardPct} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-[#165E39]/20" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Espèces (Fixe FCFA)</label>
            <input type="number" name="depositCashFixed" value={config?.depositCashFixed} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-[#165E39]/20" />
          </div>
        </div>

        {/* Frais de Retrait */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <CreditCard className="w-5 h-5 text-gray-400" /> Frais de Retrait
          </h2>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Money (Fixe FCFA)</label>
            <input type="number" name="withdrawalMobileMoneyFixed" value={config?.withdrawalMobileMoneyFixed} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-[#165E39]/20" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Virement Bancaire (Fixe FCFA)</label>
            <input type="number" name="withdrawalBankFixed" value={config?.withdrawalBankFixed} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-[#165E39]/20" />
          </div>
        </div>

        {/* Limites et Plafonds */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-gray-400" /> Plafonds de Transaction
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Dépôt max / Tx</label>
              <input type="number" name="depositMaxTx" value={config?.depositMaxTx} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Dépôt max / Jour</label>
              <input type="number" name="depositMaxDay" value={config?.depositMaxDay} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Retrait max / Tx</label>
              <input type="number" name="withdrawalMaxTx" value={config?.withdrawalMaxTx} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Retrait max / Jour</label>
              <input type="number" name="withdrawalMaxDay" value={config?.withdrawalMaxDay} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none" />
            </div>
          </div>
        </div>

        {/* Sécurité 2FA */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-gray-400" /> Seuils Sécurité OTP (2FA)
          </h2>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Retrait ({'>'} FCFA exige OTP)</label>
            <input type="number" name="otpWithdrawalThreshold" value={config?.otpWithdrawalThreshold} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Transfert ({'>'} FCFA exige OTP)</label>
            <input type="number" name="otpTransferThreshold" value={config?.otpTransferThreshold} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <p className="text-xs text-gray-400 mt-2">Les transactions au-dessus de ces seuils déclencheront systématiquement une validation par code (OTP).</p>
        </div>

      </div>
    </div>
  );
}
