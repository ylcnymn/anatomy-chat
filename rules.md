UYGULAMA RULES DOSYASI - "ORGAN CHAT"
1. PROJE TANIMI VE AMAÇ
Proje Adı: Organ Chat - İnsan Anatomisi ile İnteraktif Sohbet Uygulaması
Ana Amaç: Kullanıcıların insan vücudundaki organlar hakkında bilgi edinmelerini ve seçili organla yapay zeka destekli sohbet etmelerini sağlamak.
Temel Özellikler:
Liste bazlı organ navigasyonu
3 farklı kullanıcı modu (Doktor, Meraklı, Çocuk)
Yapay zeka ile organ bazlı sohbet
Çoklu AI model desteği (OpenAI, Local LLM vb.)
Uberon ontolojisi tabanlı veri yapısı
2. HEDEF KİTLE VE MODLAR
Mod A - Tıp Öğrencileri/Doktorlar:
Latince terminoloji kullanımı
Anatomi, fizyoloji, patoloji odaklı
Akademik referanslar ve detaylı bilgiler
Profesyonel ve ciddi ton
Mod B - Genel Kullanıcı/Meraklılar:
Halk diline çevrilmiş tıbbi terimler
Analojiler ve günlük örnekler
İşlevsel bilgiler ve sağlık ipuçları
Arkadaş canlısı ama ciddi ton
Mod C - Çocuklar/Eğitim:
Basitleştirilmiş dil ve açıklamalar
Emojiler ve neşeli ifadeler
Hikayeleştirme ve süper kahraman benzetmeleri
Korkutucu içeriklerden kaçınma
3. VERİ KAYNAKLARI VE API STRATEJİSİ
Ana Veri Kaynağı: Uberon Ontology (CC BY Lisansı)
Filtreleme: NCBI Taxon ID: 9606 (Homo sapiens)
Veri çekimi: Bir kez indirilip kendi veritabanına aktarılacak
Hiyerarşi: Bölge → Alt Bölge → Organ → Doku (gerektiğinde)
Veritabanı Yapısı:

Tablolar:
- BodyRegions (id, name, parent_id)
- Organs (id, name, latin_name, region_id, description, uberon_id)
- Prompts (id, organ_id, mode, system_prompt)
- ChatHistory (id, organ_id, mode, message, response, timestamp)

4. YAPAY ZEKA ENTEGRASYONU
Desteklenen Modeller:
OpenAI GPT serisi (GPT-4, GPT-3.5)
Anthropic Claude serisi
Local LLM (Ollama, Llama, Mistral vb.)
OpenAI-Compatible API'ler
Persona Sistemi (System Prompts):

// Mod A - Doktor
"Sen bir insan [ORGAN]sın. Muhatabın bir tıp öğrencisi veya doktor. Anatomi, fizyoloji ve patoloji hakkında Latince terminoloji kullanarak, akademik referanslara dayalı, detaylı ve profesyonel cevaplar ver. Kesinlik ve tıbbi doğruluk esastır."

// Mod B - Meraklı
"Sen bir insan [ORGAN]sın. Muhatabın sağlığını merak eden bir yetişkin. Tıbbi terimleri halk diline çevirerek, analojiler kullanarak ne işe yaradığını anlat. Arkadaş canlısı ama ciddi bir ton kullan. Tavsiye verme, bilgi ver."

// Mod C - Çocuk
"Sen bir insan [ORGAN]sın ve şu an bir çocukla konuşuyorsun. Neşeli, emojiler kullanan, hikayeleştirici bir dil kullan. Vücuttaki görevini bir süper kahraman veya bir fabrika işçisi gibi basitçe anlat. Asla korkutucu hastalıklardan bahsetme."

5. KULLANICI ARAYÜZÜ VE DENEYİMİ
Ana Ekran Yapısı:

┌─────────────────────────────────────────┐
│  Logo | Mod Seçimi | Ayarlar (⚙️)       │
├──────────────────┬──────────────────────┤
│  SOL PANEL       │   SAĞ PANEL          │
│  (Navigasyon)    │   (Chat Alanı)       │
│                  │                      │
│  📂 Baş          │  [Seçili Organ]      │
│    ├─ Beyin      │  Kısa Bilgi          │
│    └─ Gözler     │                      │
│  📂 Gövde        │  📨 Sohbet Geçmişi   │
│    ├─ Kalp       │                      │
│    ├─ Akciğerler │  📝 Mesaj Girişi     │
│    └─ Mide       │                      │
└──────────────────┴──────────────────────┘

Etkileşim Akışı:
Kullanıcı mod seçer (A/B/C)
Sol panelden bölge seçer
Organ listesinden organ seçer
Sağ panelden organ bilgilerini görür
AI ile sohbet başlatır
Ayarlardan AI modeli değiştirebilir
6. GÜVENLİK VE YASAL KONULAR
Yasal Uyarılar:
Uygulama açılışında: "Bu uygulama sadece eğitim ve bilgilendirme amaçlıdır. Teşhis veya tedavi yerine geçmez."
Her sohbet penceresinde sabit uyarı
Acil durumlarda doktora yönlendirme mesajı
Veri Güvenliği:
API anahtarları LocalStorage'da şifreli saklanacak
Sohbet geçmişi kullanıcı cihazında tutulacak
Sunucu tarafında kişisel veri saklanmayacak
AI Güvenlik Katmanı:
Prompt içinde "Asla kesin teşhis koyma" kuralı
Tıbbi içerik doğrulama mekanizması
Hassas konular için otomatik uyarı
7. TEKNİK MİMARİ VE STACK
Frontend:
Framework: Next.js (App Router)
UI Kit: Shadcn/UI veya Mantine
State Management: Zustand
Real-time Chat: Vercel AI SDK (useChat hook)
Backend:
Framework: Node.js veya Python (FastAPI)
Veritabanı: PostgreSQL/Supabase
AI Entegrasyonu: LangChain veya Vercel AI SDK
Veri İşleme:
Uberon parsing: Python (rdflib, owlready2)
Veri temizleme ve filtreleme: Pandas
Veritabanı migrasyonu: SQL scripts
8. GELİŞTİRME AŞAMALARI VE ROADMAP
Faz 1: Veri Hazırlığı (Hafta 1)
Uberon dosyasını indirme
Python script ile insan anatomisi filtreleme
JSON/SQL formatına dönüştürme
Veritabanı şeması oluşturma
Faz 2: Temel Uygulama (Hafta 2)
Next.js projesi kurulumu
Sol menü navigasyon yapısı
Organ listeleme ve seçim mekanizması
Temel UI/UX tasarımı
Faz 3: AI Entegrasyonu (Hafta 3)
Ayarlar sayfası ve model ekleme formu
OpenAI-Compatible client katmanı
3 farklı persona sistemi
Sohbet arayüzü ve streaming desteği
Faz 4: İyileştirme ve Test (Hafta 4)
Sohbet geçmişi kaydetme
Loading animasyonları
Mobil uyumluluk testleri
Performans optimizasyonu
🛠️ ADIM ADIM GELİŞTİRME PLANI
HAFTA 1: VERİ HAZIRLIĞI
Gün 1-2: Uberon Veri Çekimi

# Örnek Python Script - Uberon Parsing
import requests
from rdflib import Graph, Namespace

# Uberon OWL dosyasını indir
url = "http://purl.obolibrary.org/obo/uberon.owl"
response = requests.get(url)
with open("uberon.owl", "wb") as f:
    f.write(response.content)

# RDF grafiğini yükle
g = Graph()
g.parse("uberon.owl", format="xml")

# Homo sapiens filtresi (Taxon ID: 9606)
HUMAN_TAXON = "http://purl.obolibrary.org/obo/NCBITaxon_9606"

# Organ hiyerarşisini çıkarma
def extract_human_anatomy(graph):
    human_organs = []
    for s, p, o in graph.triples((None, None, None)):
        # Homo sapiens filtresi uygula
        if HUMAN_TAXON in str(o):
            # Organ bilgilerini çıkar
            organ_info = {
                'name': get_label(s),
                'uberon_id': str(s),
                'part_of': get_parent(s)
            }
            human_organs.append(organ_info)
    return human_organs

-- PostgreSQL Tablo Oluşturma
CREATE TABLE body_regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES body_regions(id)
);

CREATE TABLE organs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latin_name VARCHAR(100),
    region_id INTEGER REFERENCES body_regions(id),
    description TEXT,
    uberon_id VARCHAR(50) UNIQUE
);

CREATE TABLE prompts (
    id SERIAL PRIMARY KEY,
    organ_id INTEGER REFERENCES organs(id),
    mode VARCHAR(10) NOT NULL, -- 'doctor', 'curious', 'child'
    system_prompt TEXT NOT NULL
);

npx create-next-app@latest organ-chat
cd organ-chat
npm install zustand shadcn-ui vercel/ai

// components/NavigationPanel.jsx
import { useState } from 'react';

const NavigationPanel = ({ onSelectOrgan }) => {
  const [selectedMode, setSelectedMode] = useState('curious');
  
  return (
    <div className="navigation-panel">
      <ModeSelector 
        mode={selectedMode} 
        onChange={setSelectedMode}
      />
      
      <OrganTree 
        mode={selectedMode}
        onSelect={onSelectOrgan}
      />
    </div>
  );
};


HAFTA 3: AI ENTEGRASYONU
Gün 1: Ayarlar Sayfası
// components/SettingsModal.jsx
const SettingsModal = ({ isOpen, onClose }) => {
  const [modelConfig, setModelConfig] = useState({
    provider: 'openai',
    baseUrl: '',
    apiKey: '',
    modelName: ''
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>AI Model Ayarları</h2>
      <Select 
        value={modelConfig.provider}
        onChange={(e) => setModelConfig({...modelConfig, provider: e.target.value})}
      >
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="ollama">Ollama (Local)</option>
        <option value="custom">Custom API</option>
      </Select>
      
      {modelConfig.provider === 'custom' && (
        <Input
          placeholder="Base URL (e.g., http://localhost:11434/v1)"
          value={modelConfig.baseUrl}
          onChange={(e) => setModelConfig({...modelConfig, baseUrl: e.target.value})}
        />
      )}
      
      <Input
        type="password"
        placeholder="API Key"
        value={modelConfig.apiKey}
        onChange={(e) => setModelConfig({...modelConfig, apiKey: e.target.value})}
      />
    </Modal>
  );
};

Gün 2-3: AI Client Katmanı

// lib/aiClient.js
class AIChatClient {
  constructor(config) {
    this.config = config;
    this.provider = this.getProvider(config.provider);
  }

  getProvider(providerName) {
    const providers = {
      openai: {
        baseUrl: 'https://api.openai.com/v1',
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      },
      ollama: {
        baseUrl: this.config.baseUrl || 'http://localhost:11434/v1',
        headers: {}
      },
      custom: {
        baseUrl: this.config.baseUrl,
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      }
    };
    return providers[providerName];
  }

  async sendMessage(messages, systemPrompt) {
    const response = await fetch(`${this.provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.provider.headers
      },
      body: JSON.stringify({
        model: this.config.modelName || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true
      })
    });

    return response;
  }
}

Gün 4-5: Persona Sistemi ve Sohbet

// lib/personaSystem.js
export const getSystemPrompt = (organName, mode) => {
  const prompts = {
    doctor: `Sen bir insan ${organName}sın. Muhatabın bir tıp öğrencisi veya doktor. Anatomi, fizyoloji ve patoloji hakkında Latince terminoloji kullanarak, akademik referanslara dayalı, detaylı ve profesyonel cevaplar ver. Kesinlik ve tıbbi doğruluk esastır.`,
    
    curious: `Sen bir insan ${organName}sın. Muhatabın sağlığını merak eden bir yetişkin. Tıbbi terimleri halk diline çevirerek, analojiler kullanarak ne işe yaradığını anlat. Arkadaş canlısı ama ciddi bir ton kullan. Tavsiye verme, bilgi ver.`,
    
    child: `Sen bir insan ${organName}sın ve şu an bir çocukla konuşuyorsun. Neşeli, emojiler kullanan, hikayeleştirici bir dil kullan. Vücuttaki görevini bir süper kahraman veya bir fabrika işçisi gibi basitçe anlat. Asla korkutucu hastalıklardan bahsetme.`
  };
  
  return prompts[mode] || prompts.curious;
};

HAFTA 4: İYİLEŞTİRME VE TEST
Gün 1-2: Sohbet Geçmişi ve LocalStorage

// lib/chatHistory.js
export const saveChatHistory = (organId, mode, messages) => {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '{}');
  history[`${organId}_${mode}`] = messages;
  localStorage.setItem('chatHistory', JSON.stringify(history));
};

export const loadChatHistory = (organId, mode) => {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '{}');
  return history[`${organId}_${mode}`] || [];
};

Gün 3: Loading Animasyonları

// components/ChatBubble.jsx
const ChatBubble = ({ message, isLoading }) => {
  return (
    <div className={`chat-bubble ${message.role}`}>
      {isLoading ? (
        <TypingAnimation text={message.content} />
      ) : (
        <ReactMarkdown>{message.content}</ReactMarkdown>
      )}
    </div>
  );
};

const TypingAnimation = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text]);

  return <span>{displayText} {currentIndex < text.length && '...'}</span>;
};

Gün 4-5: Test ve Deploy

# Test komutları
npm run test
npm run build
npm run lint

# Deploy (Vercel için)
npm install -g vercel
vercel deploy

ÖNEMLİ NOTLAR VE TAVSİYELER
Veri Doğrulama: Uberon verilerini mutlaka tıbbi uzmanlarla kontrol ettirin
AI Güvenliği: Tıbbi içeriklerde AI'nın halüsinasyon riskini minimize edin
Performans: Organ listesini client-side'da cache'leyin
Erişilebilirlik: WCAG standartlarına uygun tasarım yapın
SEO: Next.js'in SSR özelliğini kullanarak organ sayfalarını indexleyin
Bu roadmap ile Organ Chat uygulamanızı sistematik bir şekilde geliştirebilirsiniz. Başlamak için Faz 1 - Veri Hazırlığı ile başlamanızı öneririm.