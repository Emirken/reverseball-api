# ReverseBall API - Football Player Scouting System

Node.js ve Express ile geliştirilmiş profesyonel futbol oyuncuları scouting API'si. MongoDB ve Elasticsearch entegrasyonu ile güçlü arama ve filtreleme özellikleri sunar.

## 🚀 Özellikler

- **Pozisyon Bazlı Oyuncu Listeleme**: ST, AM, LW, RW, DM, MC, RM, LM, DC, GK
- **Elasticsearch Entegrasyonu**: Gelişmiş arama ve filtreleme
- **İstatistik Bazlı Sıralama**: Performans metriklerine göre otomatik sıralama
- **Benzer Oyuncu Bulma**: İstatistiklere göre benzer oyuncular
- **Top Performers**: Pozisyonlara göre en iyi oyuncular
- **Gelişmiş Filtreleme**: Yaş, gol, asist, lig, ülke vb.

## 📋 Gereksinimler

- Node.js (v16 veya üstü)
- MongoDB (v5 veya üstü)
- Elasticsearch (v8 veya üstü) - Opsiyonel

## 🔧 Kurulum

### 1. Projeyi İndirin

```bash
cd reverseball-api
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

`.env` dosyasını düzenleyin:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DBNAME=ScoutDatabase
MONGODB_COLLECTION=players

# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=players

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:3000
```

### 4. MongoDB'yi Başlatın

```bash
mongod --dbpath /path/to/your/data
```

### 5. Elasticsearch'ü Başlatın (Opsiyonel)

```bash
# Docker ile
docker run -d -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.11.0

# Veya lokal kurulum
./bin/elasticsearch
```

### 6. Sunucuyu Başlatın

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

### Base URL
```
http://localhost:3000/api/v1/reverseball
```

### Pozisyon Bazlı Endpointler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/stPlayers` | Forvet oyuncuları |
| GET | `/amPlayers` | Ofansif orta saha oyuncuları |
| GET | `/lwPlayers` | Sol kanat oyuncuları |
| GET | `/rwPlayers` | Sağ kanat oyuncuları |
| GET | `/dmPlayers?type=defensive` | Defansif orta saha |
| GET | `/mcPlayers?type=central` | Merkez orta saha |
| GET | `/rmPlayers` | Sağ orta saha |
| GET | `/lmPlayers` | Sol orta saha |
| GET | `/dcPlayers` | Stoper oyuncular |
| GET | `/gkPlayers` | Kaleci oyuncular |

### Arama ve Filtreleme

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/search-player?player=Messi` | İsme göre oyuncu ara |
| GET | `/playersDetail/:playerId` | Oyuncu detayları |
| GET | `/formPlayers` | Tüm oyuncular |

### Elasticsearch Endpointleri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/search/advanced?positions=ST,AM&minGoals=10&minAge=20&maxAge=25` | Gelişmiş arama |
| GET | `/search/by-metrics?position=ST&minGoals=15&minAssists=5` | Metrik bazlı arama |
| GET | `/top-performers?position=ST&metric=goals&limit=10` | En iyi oyuncular |
| GET | `/similar-players/:playerId?limit=10` | Benzer oyuncular |
| GET | `/statistics/:position` | Pozisyon istatistikleri |

## 📖 Kullanım Örnekleri

### 1. Forvet Oyuncularını Getir

```bash
curl http://localhost:3000/api/v1/reverseball/stPlayers
```

Response:
```json
{
  "success": true,
  "count": 150,
  "data": [
    {
      "id": 1,
      "name": "Erling Haaland",
      "country": "Norway",
      "team": "Manchester City",
      "league": "Premier League",
      "age": 23,
      "statistics": {
        "goals": 36,
        "assists": 8,
        "appearances": 35
      }
    }
  ]
}
```

### 2. İsme Göre Oyuncu Ara

```bash
curl "http://localhost:3000/api/v1/reverseball/search-player?player=Messi&limit=5"
```

### 3. Gelişmiş Filtreleme

```bash
curl "http://localhost:3000/api/v1/reverseball/search/advanced?positions=ST,AM&minGoals=10&minAge=20&maxAge=25&country=Brazil&limit=20"
```

### 4. En İyi Gol Kralları

```bash
curl "http://localhost:3000/api/v1/reverseball/top-performers?position=ST&metric=goals&limit=10"
```

### 5. Benzer Oyuncular Bul

```bash
curl http://localhost:3000/api/v1/reverseball/similar-players/12345?limit=10
```

## 🔍 Query Parametreleri

### Gelişmiş Arama Parametreleri

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `positions` | string | Pozisyonlar (virgülle ayrılmış: ST,AM,LW) |
| `minAge` | number | Minimum yaş |
| `maxAge` | number | Maximum yaş |
| `minGoals` | number | Minimum gol sayısı |
| `minAssists` | number | Minimum asist sayısı |
| `minAppearances` | number | Minimum maç sayısı |
| `country` | string | Ülke adı |
| `league` | string | Lig adı |
| `limit` | number | Sonuç limiti (varsayılan: 50) |
| `sortBy` | string | Sıralama alanı |
| `sortOrder` | string | Sıralama yönü (asc/desc) |

## 🏗️ Proje Yapısı

```
reverseball-api/
├── src/
│   ├── config/
│   │   ├── database.js           # MongoDB bağlantısı
│   │   └── elasticsearch.js      # Elasticsearch yapılandırması
│   ├── controllers/
│   │   └── playersController.js  # Controller mantığı
│   ├── routes/
│   │   └── playerRoutes.js       # API route tanımları
│   ├── services/
│   │   ├── playerService.js      # İş mantığı servisi
│   │   └── searchService.js      # Elasticsearch servisi
│   ├── utils/
│   │   └── helpers.js            # Yardımcı fonksiyonlar
│   ├── middleware/
│   │   ├── errorHandler.js       # Hata yönetimi
│   │   └── cors.js               # CORS yapılandırması
│   └── app.js                    # Express app
├── .env                          # Ortam değişkenleri
├── .gitignore
├── package.json
├── server.js                     # Ana giriş noktası
└── README.md
```

## 🔐 Güvenlik

- Helmet.js ile HTTP header güvenliği
- CORS politikaları
- Input validasyonu
- Error handling

## 📊 Elasticsearch Index Oluşturma

Elasticsearch kullanmak için ilk önce oyuncuları index'lemeniz gerekir:

```javascript
// Örnek index script'i
const database = require('./src/config/database');
const esClient = require('./src/config/elasticsearch');

async function indexPlayers() {
    await database.connect();
    const collection = database.getCollection();
    const players = await collection.find({}).toArray();
    
    await esClient.bulkIndexPlayers(players);
    console.log('Players indexed successfully');
}

indexPlayers();
```

## 🐛 Debugging

Geliştirme modunda detaylı loglar:

```bash
NODE_ENV=development npm run dev
```

## 📝 Notlar

- Tüm POST istekleri GET'e çevrildi
- Query parametreleri kullanılıyor (örn: `?type=defensive`)
- Elasticsearch opsiyonel - olmadan da çalışır
- Performans için caching eklenebilir

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License

## 👥 İletişim

Sorularınız için issue açabilirsiniz.

---

**Not**: Bu proje PHP kodundan Node.js'e dönüştürülmüştür. Tüm POST istekleri GET'e çevrilmiş ve modern best practices uygulanmıştır.