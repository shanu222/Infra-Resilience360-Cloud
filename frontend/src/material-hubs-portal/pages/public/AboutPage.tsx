import { Shield, Target, Users, CheckCircle, Building2, Globe } from "lucide-react";
import { mockPartners } from '@/config/materialHubCatalog'
import { useMaterialHubStrings } from '@/hooks/useMaterialHubStrings'

export function AboutPage() {
  const s = useMaterialHubStrings()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mh-page-header-glass text-center mb-16">
        <div className="inline-flex items-center space-x-2 mh-hero-glass__badge px-4 py-2 rounded-full mb-6">
          <Shield className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-semibold">{s.aboutBadge}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{s.aboutHeroTitle}</h1>
        <p className="text-xl max-w-3xl mx-auto">{s.aboutHeroSub}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="mh-mission-card--emerald rounded-2xl p-8 text-white">
          <Target className="h-12 w-12 mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-4">{s.aboutMissionTitle}</h2>
          <p className="text-emerald-50 leading-relaxed">{s.aboutMissionBody}</p>
        </div>

        <div className="mh-mission-card--blue rounded-2xl p-8 text-white">
          <Globe className="h-12 w-12 mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-4">{s.aboutVisionTitle}</h2>
          <p className="text-blue-50 leading-relaxed">{s.aboutVisionBody}</p>
        </div>
      </div>

      {/* Core Objectives */}
      <div className="mb-16">
        <div className="mh-section-header-glass text-center mb-12">
          <h2 className="text-3xl font-bold">Core Objectives</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: 'Disaster Preparedness',
              description: 'Maintain strategic material reserves across provinces for rapid emergency response',
              color: 'emerald',
            },
            {
              icon: Users,
              title: 'Community Resilience',
              description: 'Empower communities through training and skill development in disaster-resilient construction',
              color: 'blue',
            },
            {
              icon: CheckCircle,
              title: 'Transparency & Accountability',
              description: 'Provide real-time public access to inventory levels and material distribution',
              color: 'purple',
            },
            {
              icon: Building2,
              title: 'Reconstruction Capacity',
              description: 'Enable reconstruction of 600+ homes through our network of material hubs',
              color: 'orange',
            },
            {
              icon: Target,
              title: 'Early Response',
              description: 'Facilitate immediate material issuance to disaster-affected areas through PDMA coordination',
              color: 'pink',
            },
            {
              icon: Globe,
              title: 'Partner Collaboration',
              description: 'Coordinate with international organizations, NGOs, and CSR partners for enhanced impact',
              color: 'indigo',
            },
          ].map((objective, idx) => {
            const Icon = objective.icon;
            return (
              <div key={idx} className="mh-content-card rounded-xl p-6 hover:shadow-xl transition-shadow">
                <div className={`bg-${objective.color}-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`h-7 w-7 text-${objective.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{objective.title}</h3>
                <p className="text-gray-600">{objective.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="mh-content-card rounded-2xl p-8 md:p-12 mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">How NMHDP Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: '01',
              title: 'Disaster Assessment',
              description: 'PDMA conducts rapid assessment of affected areas and material needs',
            },
            {
              step: '02',
              title: 'Digital Request',
              description: 'PDMA submits material request through online portal with supporting documentation',
            },
            {
              step: '03',
              title: 'Approval & Dispatch',
              description: 'NDMA reviews and approves request, materials dispatched from nearest hub',
            },
            {
              step: '04',
              title: 'Community Training',
              description: 'Local teams trained on proper installation and reconstruction techniques',
            },
          ].map((step, idx) => (
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

      {/* Key Features */}
      <div className="mb-16">
        <div className="mh-section-header-glass text-center mb-12">
          <h2 className="text-3xl font-bold">Platform Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Live Inventory Management',
              features: [
                'Real-time stock levels across all hubs',
                'Automatic alerts at 75% threshold',
                'Damage tracking and quality monitoring',
                'Material turnover analytics',
              ],
            },
            {
              title: 'Digital Issuance Workflow',
              features: [
                'Online request submission by PDMAs',
                'Automated routing and approvals',
                'Digital acknowledgment system',
                'Utilization tracking',
              ],
            },
            {
              title: 'Public Transparency Dashboard',
              features: [
                'Open access to hub locations and stock levels',
                'Disaster readiness index by region',
                'Partner and donor information',
                'Response timeline updates',
              ],
            },
            {
              title: 'Training & Skill Development',
              features: [
                'Video tutorial library',
                'Certification programs',
                'Community training camps',
                'Reconstruction manuals',
              ],
            },
          ].map((section, idx) => (
            <div key={idx} className="mh-content-card rounded-xl p-6">
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

      {/* Partners Section */}
      <div className="mb-16">
        <div className="mh-section-header-glass text-center mb-12">
          <h2 className="text-3xl font-bold">Our Partners</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPartners.map((partner) => (
            <div key={partner.id} className="mh-content-card rounded-xl p-6 hover:shadow-xl transition-shadow">
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                partner.type === 'Government' ? 'bg-emerald-100 text-emerald-700' :
                partner.type === 'International' ? 'bg-blue-100 text-blue-700' :
                partner.type === 'NGO' ? 'bg-purple-100 text-purple-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {partner.type}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{partner.name}</h3>
              <p className="text-sm text-gray-600">{partner.contribution}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Stats */}
      <div className="mh-impact-banner rounded-2xl p-8 md:p-12 text-white mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">3</div>
            <div className="text-emerald-100">Active Hubs</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">600+</div>
            <div className="text-emerald-100">Home Capacity</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">15K+</div>
            <div className="text-emerald-100">Materials Stocked</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
            <div className="text-emerald-100">Emergency Ready</div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="mh-content-card rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Get In Touch</h2>
        <p className="text-gray-600 mb-6">
          For inquiries, partnerships, or emergency assistance, contact NDMA Pakistan
        </p>
        <div className="space-y-2 text-gray-700">
          <p><strong>National Disaster Management Authority</strong></p>
          <p>Prime Minister's Office, Islamabad, Pakistan</p>
          <p>Email: info@ndma.gov.pk | Phone: +92-51-9205200</p>
        </div>
      </div>
    </div>
  );
}
