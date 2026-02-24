
"use client";

import { useState } from "react";
import {
  Save,
  Eye,
  FileText,
  Home,
  Info,
  Briefcase,
  Phone,
  Image,
  Edit3,
  Check,
  X,
  ChevronRight,
} from "lucide-react";

// Sample content data
const initialContent = {
  homepage: {
    heroTitle: "Transform Your Business with Enterprise IT Solutions",
    heroSubtitle:
      "Leading provider of ERP, Cloud, AI, and Salesforce solutions for Fortune 500 companies worldwide.",
    heroCtaText: "Get Started",
    stats: {
      clients: "500+",
      years: "15+",
      locations: "25+",
      satisfaction: "98%",
    },
  },
  about: {
    title: "About Ocean Blue Corporation",
    mission:
      "To empower businesses with cutting-edge technology solutions that drive growth and innovation.",
    vision:
      "To be the global leader in enterprise IT transformation and digital innovation.",
    description:
      "Ocean Blue Corporation is a premier IT consulting firm specializing in enterprise solutions. With over 15 years of experience, we have helped hundreds of organizations transform their operations through technology.",
  },
  services: {
    title: "Our Services",
    subtitle: "Comprehensive IT Solutions for Modern Enterprises",
    description:
      "From legacy system modernization to cutting-edge AI implementation, we provide end-to-end solutions that drive business growth.",
  },
  contact: {
    title: "Get in Touch",
    subtitle: "We'd love to hear from you",
    email: "hr@oceanbluecorp.com",
    phone: "+1 614-844-6925",
    address: "Powell, OH 43065",
  },
};

const pages = [
  { id: "homepage", name: "Homepage", icon: Home },
  { id: "about", name: "About", icon: Info },
  { id: "services", name: "Services", icon: Briefcase },
  { id: "contact", name: "Contact", icon: Phone },
];

export default function ContentPage() {
  const [content, setContent] = useState(initialContent);
  const [activePage, setActivePage] = useState("homepage");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const handleEdit = (field: string, value: string) => {
    setEditingField(field);
    setTempValue(value);
  };

  const handleSave = (field: string) => {
    const keys = field.split(".");
    setContent((prev) => {
      const newContent = { ...prev };
      let obj: any = newContent;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = tempValue;
      return newContent;
    });
    setEditingField(null);
    setTempValue("");
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const renderField = (
    label: string,
    field: string,
    value: string,
    type: "text" | "textarea" = "text"
  ) => {
    const isEditing = editingField === field;

    return (
      <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            {isEditing ? (
              <div className="space-y-2">
                {type === "textarea" ? (
                  <textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    rows={4}
                    autoFocus
                  />
                ) : (
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    autoFocus
                  />
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave(field)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-900">{value}</p>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={() => handleEdit(field, value)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPageContent = () => {
    const pageContent = content[activePage as keyof typeof content];

    switch (activePage) {
      case "homepage":
        const hp = pageContent as typeof content.homepage;
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Hero Section
              </h3>
              <div className="space-y-4">
                {renderField("Hero Title", "homepage.heroTitle", hp.heroTitle)}
                {renderField(
                  "Hero Subtitle",
                  "homepage.heroSubtitle",
                  hp.heroSubtitle,
                  "textarea"
                )}
                {renderField(
                  "CTA Button Text",
                  "homepage.heroCtaText",
                  hp.heroCtaText
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {renderField(
                  "Enterprise Clients",
                  "homepage.stats.clients",
                  hp.stats.clients
                )}
                {renderField(
                  "Years of Excellence",
                  "homepage.stats.years",
                  hp.stats.years
                )}
                {renderField(
                  "Global Locations",
                  "homepage.stats.locations",
                  hp.stats.locations
                )}
                {renderField(
                  "Client Satisfaction",
                  "homepage.stats.satisfaction",
                  hp.stats.satisfaction
                )}
              </div>
            </div>
          </div>
        );

      case "about":
        const about = pageContent as typeof content.about;
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              About Page Content
            </h3>
            <div className="space-y-4">
              {renderField("Page Title", "about.title", about.title)}
              {renderField(
                "Mission Statement",
                "about.mission",
                about.mission,
                "textarea"
              )}
              {renderField(
                "Vision Statement",
                "about.vision",
                about.vision,
                "textarea"
              )}
              {renderField(
                "Company Description",
                "about.description",
                about.description,
                "textarea"
              )}
            </div>
          </div>
        );

      case "services":
        const services = pageContent as typeof content.services;
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Services Page Content
            </h3>
            <div className="space-y-4">
              {renderField("Page Title", "services.title", services.title)}
              {renderField("Subtitle", "services.subtitle", services.subtitle)}
              {renderField(
                "Description",
                "services.description",
                services.description,
                "textarea"
              )}
            </div>
          </div>
        );

      case "contact":
        const contact = pageContent as typeof content.contact;
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Page Content
            </h3>
            <div className="space-y-4">
              {renderField("Page Title", "contact.title", contact.title)}
              {renderField("Subtitle", "contact.subtitle", contact.subtitle)}
              {renderField("Email", "contact.email", contact.email)}
              {renderField("Phone", "contact.phone", contact.phone)}
              {renderField("Address", "contact.address", contact.address)}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-1">
            Edit website content across all pages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview Site
          </a>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : showSaved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Page selector sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-24">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Pages</h3>
            </div>
            <nav className="p-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activePage === page.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <page.icon className="w-5 h-5" />
                  <span className="font-medium">{page.name}</span>
                  <ChevronRight
                    className={`w-4 h-4 ml-auto transition-transform ${
                      activePage === page.id ? "rotate-90" : ""
                    }`}
                  />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content editor */}
        <div className="lg:col-span-3">{renderPageContent()}</div>
      </div>
    </div>
  );
}