# Organ Chat - İnatçı ve İnteraktif Anatomi Asistanı

Bu proje, insan organlarını birer sohbet partnerine dönüştüren, Next.js tabanlı modern bir web uygulamasıdır.

## 🚀 Başlatma (Docker ile)

Uygualamayı Docker üzerinde en performanslı (standalone) modda çalıştırmak için:

```bash
docker-compose up --build
```

Bu komut:
1. Uygulamayı derler.
2. `standalone` moduna optimize eder.
3. `http://localhost:3000` adresinde yayına alır.

## 🛠️ Özellikler

- **AI Model Esnekliği:** OpenAI, Claude veya Ollama (Local) desteği.
- **3 Farklı Mod:** Doktor, Meraklı ve Çocuk modları ile her seviyeye uygun anlatım.
- **Uberon Ontolojisi:** Gerçek tıbbi veri hiyerarşisi üzerine kurulu organ listesi.
- **Premium Arayüz:** Karanlık mod, cam efektleri ve akışkan animasyonlar.

## 📁 Dosya Yapısı

- `app/`: Next.js uygulama dosyaları ve UI bileşenleri.
- `scripts/`: Veri madenciliği ve Uberon extraction scriptleri.
- `data/`: İşlenmiş organ verileri.
- `Dockerfile` & `docker-compose.yml`: Docker konfigürasyonu.
