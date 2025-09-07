import React, { useState, useEffect } from 'react';
import { Globe, Check, RefreshCw, Download, Settings, Volume2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Toast } from '../ui/Toast';
import { TranslationContext } from '../../hooks/useTranslation';

// Define the interface locally since it's not exported from the hook
interface TranslationContextType {
  currentLanguage: string;
  translations: Record<string, string>;
  setLanguage: (code: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isLoading: boolean;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  coverage: number; // Percentage of translated content
}

const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    coverage: 100
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
    coverage: 95
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
    coverage: 90
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
    coverage: 85
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    rtl: false,
    coverage: 80
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true,
    coverage: 75
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    rtl: false,
    coverage: 85
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    rtl: false,
    coverage: 70
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    coverage: 65
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
    coverage: 60
  }
];

const DEFAULT_TRANSLATIONS = {
  en: {
    'app.title': 'TradieHelper',
    'nav.find_work': 'Find Work',
    'nav.post_job': 'Post a Job',
    'nav.messages': 'Messages',
    'nav.profile': 'Profile',
    'button.apply': 'Apply',
    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'button.submit': 'Submit',
    'language.settings': 'Language Settings',
    'language.select': 'Select Language',
    'language.download': 'Download Language Pack',
    'jobs.title': 'Available Jobs',
    'jobs.hourly_rate': 'Hourly Rate',
    'jobs.location': 'Location',
    'profile.skills': 'Skills',
    'profile.experience': 'Experience',
    'messages.new': 'New Message',
    'error.network': 'Network error occurred',
    'success.saved': 'Settings saved successfully'
  }
};

const MultiLanguageInterface: React.FC = () => {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [downloadedLanguages, setDownloadedLanguages] = useState<string[]>(['en']);
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>(DEFAULT_TRANSLATIONS);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [autoDetect, setAutoDetect] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadUserLanguageSettings();
    detectUserLanguage();
  }, [user?.id]);

  const loadUserLanguageSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('language_settings')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.language_settings) {
        const settings = data.language_settings;
        setSelectedLanguage(settings.current_language || 'en');
        setDownloadedLanguages(settings.downloaded_languages || ['en']);
        setAutoDetect(settings.auto_detect !== false);
      }
    } catch (error) {
      console.error('Error loading language settings:', error);
    }

    // Load cached translations from localStorage
    const cachedTranslations = localStorage.getItem('cached_translations');
    if (cachedTranslations) {
      try {
        setTranslations(JSON.parse(cachedTranslations));
      } catch (error) {
        console.error('Error parsing cached translations:', error);
      }
    }
  };

  const detectUserLanguage = () => {
    if (!autoDetect) return;

    const browserLanguage = navigator.language.split('-')[0];
    const supportedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === browserLanguage);
    
    if (supportedLanguage && selectedLanguage === 'en') {
      setSelectedLanguage(browserLanguage);
    }
  };

  const downloadLanguagePack = async (languageCode: string) => {
    setIsDownloading(languageCode);

    try {
      // In a real implementation, this would fetch from a translation service
      // For demo purposes, we'll simulate downloading translations
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate download time

      // Generate mock translations for the language
      const mockTranslations = generateMockTranslations(languageCode);
      
      setTranslations(prev => ({
        ...prev,
        [languageCode]: mockTranslations
      }));

      setDownloadedLanguages(prev => [...prev, languageCode]);

      // Cache translations in localStorage
      const updatedTranslations = { ...translations, [languageCode]: mockTranslations };
      localStorage.setItem('cached_translations', JSON.stringify(updatedTranslations));

      await saveLanguageSettings();
      
      setToast({ 
        message: `${SUPPORTED_LANGUAGES.find(l => l.code === languageCode)?.name} language pack downloaded`, 
        type: 'success' 
      });

    } catch (error) {
      console.error('Error downloading language pack:', error);
      setToast({ message: 'Failed to download language pack', type: 'error' });
    } finally {
      setIsDownloading(null);
    }
  };

  const generateMockTranslations = (languageCode: string): Record<string, string> => {
    // This would normally be fetched from a translation service
    const mockTranslations: Record<string, Record<string, string>> = {
      es: {
        'app.title': 'AyudanteComercio',
        'nav.find_work': 'Buscar Trabajo',
        'nav.post_job': 'Publicar Trabajo',
        'nav.messages': 'Mensajes',
        'nav.profile': 'Perfil',
        'button.apply': 'Aplicar',
        'button.save': 'Guardar',
        'button.cancel': 'Cancelar',
        'button.submit': 'Enviar',
        'language.settings': 'Configuración de Idioma',
        'language.select': 'Seleccionar Idioma',
        'language.download': 'Descargar Paquete de Idioma',
        'jobs.title': 'Trabajos Disponibles',
        'jobs.hourly_rate': 'Tarifa por Hora',
        'jobs.location': 'Ubicación',
        'profile.skills': 'Habilidades',
        'profile.experience': 'Experiencia',
        'messages.new': 'Nuevo Mensaje',
        'error.network': 'Error de red ocurrido',
        'success.saved': 'Configuración guardada exitosamente'
      },
      fr: {
        'app.title': 'AideArtisan',
        'nav.find_work': 'Trouver du Travail',
        'nav.post_job': 'Publier un Emploi',
        'nav.messages': 'Messages',
        'nav.profile': 'Profil',
        'button.apply': 'Postuler',
        'button.save': 'Sauvegarder',
        'button.cancel': 'Annuler',
        'button.submit': 'Soumettre',
        'language.settings': 'Paramètres de Langue',
        'language.select': 'Sélectionner la Langue',
        'language.download': 'Télécharger le Pack de Langue',
        'jobs.title': 'Emplois Disponibles',
        'jobs.hourly_rate': 'Taux Horaire',
        'jobs.location': 'Emplacement',
        'profile.skills': 'Compétences',
        'profile.experience': 'Expérience',
        'messages.new': 'Nouveau Message',
        'error.network': 'Erreur réseau survenue',
        'success.saved': 'Paramètres sauvegardés avec succès'
      },
      de: {
        'app.title': 'HandwerkerHelfer',
        'nav.find_work': 'Arbeit Finden',
        'nav.post_job': 'Job Veröffentlichen',
        'nav.messages': 'Nachrichten',
        'nav.profile': 'Profil',
        'button.apply': 'Bewerben',
        'button.save': 'Speichern',
        'button.cancel': 'Abbrechen',
        'button.submit': 'Einreichen',
        'language.settings': 'Spracheinstellungen',
        'language.select': 'Sprache Auswählen',
        'language.download': 'Sprachpaket Herunterladen',
        'jobs.title': 'Verfügbare Jobs',
        'jobs.hourly_rate': 'Stundensatz',
        'jobs.location': 'Standort',
        'profile.skills': 'Fähigkeiten',
        'profile.experience': 'Erfahrung',
        'messages.new': 'Neue Nachricht',
        'error.network': 'Netzwerkfehler aufgetreten',
        'success.saved': 'Einstellungen erfolgreich gespeichert'
      }
    };

    return mockTranslations[languageCode] || DEFAULT_TRANSLATIONS.en;
  };

  const saveLanguageSettings = async () => {
    if (!user?.id) return;

    const settings = {
      current_language: selectedLanguage,
      downloaded_languages: downloadedLanguages,
      auto_detect: autoDetect
    };

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert([{
          user_id: user.id,
          language_settings: settings
        }], {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving language settings:', error);
    }
  };

  const changeLanguage = async (languageCode: string) => {
    if (!downloadedLanguages.includes(languageCode)) {
      await downloadLanguagePack(languageCode);
    }

    setSelectedLanguage(languageCode);
    
    // Update document direction for RTL languages
    const language = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    document.documentElement.dir = language?.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = languageCode;

    await saveLanguageSettings();
    setToast({ message: 'Language changed successfully', type: 'success' });
  };

  const translateText = (key: string, params?: Record<string, string>): string => {
    const languageTranslations = translations[selectedLanguage] || translations['en'] || {};
    let text = languageTranslations[key] || key;

    // Simple parameter replacement
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{{${param}}}`, value);
      });
    }

    return text;
  };

  const removeLanguagePack = (languageCode: string) => {
    if (languageCode === 'en' || languageCode === selectedLanguage) return;

    setDownloadedLanguages(prev => prev.filter(lang => lang !== languageCode));
    
    const updatedTranslations = { ...translations };
    delete updatedTranslations[languageCode];
    setTranslations(updatedTranslations);
    
    localStorage.setItem('cached_translations', JSON.stringify(updatedTranslations));
    saveLanguageSettings();
    
    setToast({ message: 'Language pack removed', type: 'info' });
  };

  const playLanguageAudio = (languageCode: string) => {
    // In a real implementation, this would play audio samples
    const language = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    setToast({ 
      message: `Playing ${language?.name} audio sample`, 
      type: 'info' 
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Globe className="h-8 w-8 text-blue-600" />
          Language Settings
        </h1>
        <p className="text-gray-600">
          Choose your preferred language for the TradieHelper platform.
        </p>
      </div>

      {/* Current Language */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Language</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <span className="text-2xl">
                {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.flag}
              </span>
              <div>
                <h3 className="font-medium">
                  {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                size="sm"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Language Preview */}
      {showPreview && (
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Language Preview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium mb-2">{translateText('app.title')}</h3>
                <ul className="space-y-1 text-sm">
                  <li>{translateText('nav.find_work')}</li>
                  <li>{translateText('nav.post_job')}</li>
                  <li>{translateText('nav.messages')}</li>
                  <li>{translateText('nav.profile')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">{translateText('jobs.title')}</h3>
                <ul className="space-y-1 text-sm">
                  <li>{translateText('jobs.hourly_rate')}</li>
                  <li>{translateText('jobs.location')}</li>
                  <li>{translateText('profile.skills')}</li>
                  <li>{translateText('profile.experience')}</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Language Selection */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Available Languages</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUPPORTED_LANGUAGES.map(language => (
              <div
                key={language.code}
                className={`p-4 border rounded-lg transition-all ${
                  selectedLanguage === language.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{language.flag}</span>
                    <div>
                      <h3 className="font-medium">{language.name}</h3>
                      <p className="text-sm text-gray-600">{language.nativeName}</p>
                    </div>
                  </div>
                  
                  {selectedLanguage === language.code && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Translation Coverage</span>
                    <span>{language.coverage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${language.coverage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {downloadedLanguages.includes(language.code) ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => changeLanguage(language.code)}
                        disabled={selectedLanguage === language.code}
                        className="flex-1"
                      >
                        {selectedLanguage === language.code ? 'Active' : 'Select'}
                      </Button>
                      {language.code !== 'en' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLanguagePack(language.code)}
                          disabled={selectedLanguage === language.code}
                        >
                          Remove
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => downloadLanguagePack(language.code)}
                      disabled={isDownloading === language.code}
                      className="flex-1 flex items-center gap-2"
                    >
                      {isDownloading === language.code ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3" />
                          Download
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playLanguageAudio(language.code)}
                    className="p-2"
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Settings */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Language Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-detect Language</h3>
                <p className="text-sm text-gray-600">
                  Automatically detect your language based on browser settings
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
                className="rounded"
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Downloaded Languages</h3>
              <div className="flex flex-wrap gap-2">
                {downloadedLanguages.map(langCode => {
                  const language = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
                  return (
                    <span
                      key={langCode}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {language?.flag} {language?.name}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total storage: {(downloadedLanguages.length * 0.5).toFixed(1)} MB
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={saveLanguageSettings} className="bg-blue-600 hover:bg-blue-700 text-white">
                Save Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAutoDetect(true);
                  setSelectedLanguage('en');
                }}
              >
                Reset to Default
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// Translation Provider Component
export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>(DEFAULT_TRANSLATIONS.en);
  const [isLoading, setIsLoading] = useState(false);

  const setLanguage = async (code: string) => {
    setIsLoading(true);
    setCurrentLanguage(code);
    
    // Load translations for the language
    const cachedTranslations = localStorage.getItem('cached_translations');
    if (cachedTranslations) {
      const allTranslations = JSON.parse(cachedTranslations);
      setTranslations(allTranslations[code] || DEFAULT_TRANSLATIONS.en);
    }
    
    setIsLoading(false);
  };

  const t = (key: string, params?: Record<string, string>): string => {
    let text = translations[key] || key;

    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{{${param}}}`, value);
      });
    }

    return text;
  };

  const value: TranslationContextType = {
    currentLanguage,
    translations,
    setLanguage,
    t,
    isLoading
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export default MultiLanguageInterface;