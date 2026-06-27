import { useMemo } from "react";
import { Shield, Target, Users, CheckCircle, Building2, Globe } from "lucide-react";
import { mockPartners, type Partner } from "../../data/mockData";
import { useMaterialHubStrings } from "../../../i18n/materialHubStrings";

function partnerTypeLabel(type: Partner["type"], t: ReturnType<typeof useMaterialHubStrings>): string {
  if (type === "Government") return t.partnerGov;
  if (type === "International") return t.partnerInt;
  if (type === "NGO") return t.partnerNgo;
  return t.partnerCsr;
}

export function AboutPage() {
  const t = useMaterialHubStrings();

  const objectives = useMemo(
    () =>
      [
        {
          icon: Shield,
          title: t.aboutObj1Title,
          description: t.aboutObj1Desc,
          color: "emerald" as const,
        },
        {
          icon: Users,
          title: t.aboutObj2Title,
          description: t.aboutObj2Desc,
          color: "blue" as const,
        },
        {
          icon: CheckCircle,
          title: t.aboutObj3Title,
          description: t.aboutObj3Desc,
          color: "purple" as const,
        },
        {
          icon: Building2,
          title: t.aboutObj4Title,
          description: t.aboutObj4Desc,
          color: "orange" as const,
        },
        {
          icon: Target,
          title: t.aboutObj5Title,
          description: t.aboutObj5Desc,
          color: "pink" as const,
        },
        {
          icon: Globe,
          title: t.aboutObj6Title,
          description: t.aboutObj6Desc,
          color: "indigo" as const,
        },
      ],
    [t],
  );

  const steps = useMemo(
    () => [
      { step: "01", title: t.aboutStep1Title, description: t.aboutStep1Desc },
      { step: "02", title: t.aboutStep2Title, description: t.aboutStep2Desc },
      { step: "03", title: t.aboutStep3Title, description: t.aboutStep3Desc },
      { step: "04", title: t.aboutStep4Title, description: t.aboutStep4Desc },
    ],
    [t],
  );

  const featureSections = useMemo(
    () => [
      {
        title: t.aboutFeat1Title,
        features: [t.aboutFeat1F1, t.aboutFeat1F2, t.aboutFeat1F3, t.aboutFeat1F4],
      },
      {
        title: t.aboutFeat2Title,
        features: [t.aboutFeat2F1, t.aboutFeat2F2, t.aboutFeat2F3, t.aboutFeat2F4],
      },
      {
        title: t.aboutFeat3Title,
        features: [t.aboutFeat3F1, t.aboutFeat3F2, t.aboutFeat3F3, t.aboutFeat3F4],
      },
      {
        title: t.aboutFeat4Title,
        features: [t.aboutFeat4F1, t.aboutFeat4F2, t.aboutFeat4F3, t.aboutFeat4F4],
      },
    ],
    [t],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center space-x-2 bg-emerald-100 px-4 py-2 rounded-full mb-6">
          <Shield className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">{t.aboutBadge}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{t.aboutHeroTitle}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.aboutHeroSub}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white shadow-xl">
          <Target className="h-12 w-12 mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-4">{t.aboutMissionTitle}</h2>
          <p className="text-emerald-50 leading-relaxed">{t.aboutMissionBody}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
          <Globe className="h-12 w-12 mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-4">{t.aboutVisionTitle}</h2>
          <p className="text-blue-50 leading-relaxed">{t.aboutVisionBody}</p>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t.aboutCoreTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {objectives.map((objective, idx) => {
            const Icon = objective.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl transition-shadow"
              >
                <div
                  className={`bg-${objective.color}-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4`}
                >
                  <Icon className={`h-7 w-7 text-${objective.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{objective.title}</h3>
                <p className="text-gray-600">{objective.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-8 md:p-12 mb-16 border border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t.aboutHowTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="text-center">
              <div className="bg-gradient-to-br from-emerald-600 to-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 mx-auto shadow-lg">
                {step.step}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t.aboutFeaturesTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureSections.map((section, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{t.aboutPartnersTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div
                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                  partner.type === "Government"
                    ? "bg-emerald-100 text-emerald-700"
                    : partner.type === "International"
                      ? "bg-blue-100 text-blue-700"
                      : partner.type === "NGO"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-orange-100 text-orange-700"
                }`}
              >
                {partnerTypeLabel(partner.type, t)}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{partner.name}</h3>
              <p className="text-sm text-gray-600">{partner.contribution}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t.aboutImpactTitle}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">3</div>
            <div className="text-emerald-100">{t.aboutStatHubs}</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">600+</div>
            <div className="text-emerald-100">{t.aboutStatHomes}</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">15K+</div>
            <div className="text-emerald-100">{t.aboutStatMaterials}</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
            <div className="text-emerald-100">{t.aboutStatEmergency}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.aboutContactTitle}</h2>
        <p className="text-gray-600 mb-6">{t.aboutContactBody}</p>
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>{t.aboutContactOrg}</strong>
          </p>
          <p>{t.aboutContactAddr}</p>
          <p>{t.aboutContactReach}</p>
        </div>
      </div>
    </div>
  );
}
