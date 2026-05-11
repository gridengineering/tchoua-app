"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Users, FileText, ChevronRight, ChevronLeft, 
  Check, Plus, Trash2, Loader2, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type Regulation = {
  title: string;
  content: string;
};

export default function WizardCreationAssociation() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [myAssociations, setMyAssociations] = useState<{id: string, name: string}[]>([]);

  // Wizard Data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "TONTINE_CLUB",
    color: "#165E39",
    region: "",
    email: "",
    phone: "",
    parentId: "",
    parentSubscriptionFee: "",
    regulations: [{ title: "Article 1 : Adhésion", content: "" }] as Regulation[]
  });

  useEffect(() => {
    // Fetch user associations for the "Parent" dropdown
    fetch("/api/associations")
      .then(res => res.json())
      .then(data => {
        if (data && data.associations) {
          setMyAssociations(data.associations.map((a: any) => ({id: a.id, name: a.name})));
        }
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRegulation = () => {
    setFormData(prev => ({
      ...prev,
      regulations: [...prev.regulations, { title: `Article ${prev.regulations.length + 1}`, content: "" }]
    }));
  };

  const handleRegulationChange = (index: number, field: string, value: string) => {
    const updated = [...formData.regulations];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, regulations: updated }));
  };

  const handleRemoveRegulation = (index: number) => {
    const updated = formData.regulations.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, regulations: updated }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/associations/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.association) {
        router.push(`/associations/${data.association.id}`);
      } else {
        throw new Error(data.error || "Une erreur est survenue");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold text-charcoal mb-2">Créer une Association</h1>
        <p className="text-graphite font-medium">Assistant de configuration complet (Mode Wizard)</p>
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-0 h-1 bg-[#165E39] -z-10 -translate-y-1/2 transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>

        {[
          { num: 1, label: "Identité", icon: Building2 },
          { num: 2, label: "Contact & Localisation", icon: MapPinIcon },
          { num: 3, label: "Hiérarchie", icon: Users },
          { num: 4, label: "Règlement Intérieur", icon: FileText }
        ].map(s => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-cream">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center font-black transition-all",
              step === s.num ? "bg-[#165E39] text-white shadow-lg ring-4 ring-[#165E39]/20" : 
              step > s.num ? "bg-forest text-white" : "bg-warm-white border-2 border-gray-200 text-ash"
            )}>
              {step > s.num ? <Check className="w-6 h-6" /> : s.num}
            </div>
            <span className={cn("text-xs font-bold", step >= s.num ? "text-gray-900" : "text-ash")}>{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-8 p-4 bg-error/10 text-red-600 rounded-xl font-bold border border-red-100">
          {error}
        </div>
      )}

      {/* Forms */}
      <div className="bg-warm-white p-8 rounded-3xl shadow-sm border border-stone min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold text-charcoal mb-6">Informations Générales</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nom de l'association *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none" placeholder="Ex: Tontine des Anciens" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-[#165E39]/20 outline-none min-h-[100px]" placeholder="But et objectifs de l'association..."></textarea>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange} className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none">
                  <option value="TONTINE_CLUB">Club de Tontine</option>
                  <option value="COOPERATIVE">Coopérative</option>
                  <option value="SOLIDARITY">Fonds de Solidarité</option>
                  <option value="INVESTMENT">Club d'Investissement</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Couleur du thème</label>
                <div className="flex gap-2">
                  <input type="color" name="color" value={formData.color} onChange={handleInputChange} className="h-12 w-12 rounded-xl cursor-pointer" />
                  <input type="text" value={formData.color} readOnly className="flex-1 bg-cream border border-gray-200 rounded-xl px-4 font-mono text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold text-charcoal mb-6">Contact & Localisation</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Région / Ville</label>
              <input type="text" name="region" value={formData.region} onChange={handleInputChange} className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none" placeholder="Ex: Douala, Cameroun" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email de contact</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none" placeholder="contact@asso.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none" placeholder="+237 XXX XX XX XX" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold text-charcoal mb-6">Hiérarchie (Association Parente)</h2>
            <div className="p-4 bg-info/10 text-blue-800 rounded-xl font-medium text-sm border border-blue-100">
              Si cette association est une "section" ou "filiale" d'une association plus grande, sélectionnez-la ci-dessous. Les membres de votre nouvelle association seront automatiquement inscrits à l'association parente.
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Association Parente (Optionnel)</label>
              <select name="parentId" value={formData.parentId} onChange={handleInputChange} className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none">
                <option value="">Aucune (Association indépendante)</option>
                {myAssociations.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {formData.parentId && (
              <div className="animate-in fade-in zoom-in">
                <label className="block text-sm font-bold text-gray-700 mb-2">Frais de souscription au parent (FCFA)</label>
                <input type="number" name="parentSubscriptionFee" value={formData.parentSubscriptionFee} onChange={handleInputChange} className="w-full bg-cream border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-[#165E39]/20 outline-none" placeholder="Ex: 5000" />
                <p className="text-xs text-graphite mt-2">Ce montant sera exigé pour tout nouveau membre rejoignant cette section.</p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-charcoal">Règlement Intérieur</h2>
              <button onClick={handleAddRegulation} className="flex items-center gap-2 text-sm font-bold text-[#165E39] bg-[#165E39]/10 px-4 py-2 rounded-lg hover:bg-[#165E39]/20 transition-colors">
                <Plus className="w-4 h-4" /> Ajouter un article
              </button>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {formData.regulations.map((reg, index) => (
                <div key={index} className="p-4 bg-cream border border-gray-200 rounded-2xl relative group">
                  <div className="flex justify-between items-center mb-3">
                    <input 
                      type="text" 
                      value={reg.title} 
                      onChange={(e) => handleRegulationChange(index, "title", e.target.value)}
                      className="font-semibold text-charcoal bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                      placeholder="Titre de l'article"
                    />
                    {formData.regulations.length > 1 && (
                      <button onClick={() => handleRemoveRegulation(index)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <textarea 
                    value={reg.content}
                    onChange={(e) => handleRegulationChange(index, "content", e.target.value)}
                    className="w-full bg-warm-white border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none min-h-[80px]"
                    placeholder="Contenu des règles..."
                    required
                  ></textarea>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between items-center">
        <button 
          onClick={() => setStep(step - 1)} 
          disabled={step === 1 || isSubmitting}
          className="flex items-center gap-2 px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-5 h-5" /> Précédent
        </button>

        {step < 4 ? (
          <button 
            onClick={() => setStep(step + 1)} 
            disabled={step === 1 && !formData.name}
            className="flex items-center gap-2 px-8 py-3 font-black text-white bg-[#165E39] hover:bg-[#0F3F26] rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            Suivant <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !formData.regulations[0].content}
            className="flex items-center gap-2 px-8 py-3 font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Terminer et Créer"}
            {!isSubmitting && <ArrowRight className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  )
}
