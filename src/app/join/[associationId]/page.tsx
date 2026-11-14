"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserPlus, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function JoinAssociationPage() {
  const { associationId } = useParams<{ associationId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    sponsorId: "",
    firstSpouseName: "",
    fatherName: "",
    motherName: "",
    childrenCount: "0",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    profession: "",
    location: "",
  });

  // Récupérer la liste des membres actifs pour choisir un parrain
  useEffect(() => {
    fetch(`/api/associations/${associationId}/members?status=ACTIVE`)
      .then(res => res.json())
      .then(data => {
        if (data.members) setMembers(data.members);
      })
      .catch(console.error);
  }, [associationId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/associations/${associationId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "CONSENT_REQUIRED") {
          router.push("/consentements");
          return;
        }
        setError(data.error || "Une erreur est survenue");
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Demande envoyée !</h2>
            <p className="text-gray-600">
              Votre demande d'adhésion a été transmise au bureau de l'association. 
              Vous recevrez une notification dès qu'elle sera approuvée.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 w-full bg-[#0d3d28] text-white py-2.5 rounded-lg font-semibold hover:bg-[#0a2f1f] transition"
            >
              Retour au tableau de bord
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#0d3d28] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Rejoindre l'Association</h2>
          <p className="mt-2 text-sm text-gray-600">
            Veuillez remplir ce formulaire. Ces informations sont cruciales pour le calcul des aides sociales.
          </p>
        </div>

        <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
          <CardContent className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl text-sm font-semibold border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Section 1 : Parrainage */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0d3d28]" /> 1. Parrainage
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionnez votre parrain (Membre actif) *</label>
                  <select 
                    name="sponsorId" 
                    value={formData.sponsorId} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] focus:border-[#0d3d28] bg-white text-gray-900"
                    required
                  >
                    <option value="">-- Aucun / Sélectionner un parrain --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-px bg-gray-100 my-8"></div>

              {/* Section 2 : Informations Personnelles */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">2. Informations Personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                    <input type="text" name="profession" value={formData.profession} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] bg-gray-50" placeholder="Ex: Enseignant" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville de résidence</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] bg-gray-50" placeholder="Ex: Douala" />
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 my-8"></div>

              {/* Section 3 : Famille (Aides Sociales) */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" /> 3. Composition Familiale (Pour les Aides)
                </h3>
                <p className="text-xs text-gray-500 mb-4 italic">Seule la première conjointe enregistrée est prise en compte pour les aides maladies (cas de polygamie).</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la conjointe (1ère)</label>
                    <input type="text" name="firstSpouseName" value={formData.firstSpouseName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'enfants à charge</label>
                    <input type="number" min="0" name="childrenCount" value={formData.childrenCount} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du père (vivant ou non)</label>
                    <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la mère (vivante ou non)</label>
                    <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] bg-gray-50" />
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 my-8"></div>

              {/* Section 4 : Urgence */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">4. Contact d'Urgence</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] bg-gray-50" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] bg-gray-50" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lien de parenté</label>
                    <input type="text" name="emergencyRelationship" value={formData.emergencyRelationship} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-[#0d3d28] bg-gray-50" placeholder="Ex: Frère" required />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-8 flex items-center justify-center gap-2 bg-[#0d3d28] text-white py-3.5 rounded-xl font-bold text-lg hover:bg-[#0a2f1f] shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {loading ? "Envoi en cours..." : "Soumettre ma candidature"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
