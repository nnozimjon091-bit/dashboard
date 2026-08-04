# Marketing Dashboard

Marketing hisobotlarini kunlik yuritish va kuzatish uchun panel. Ma'lumot qo'lda
kiritiladi va **umumiy bulut bazasida** (Upstash Redis) saqlanadi — barcha
brauzer va qurilma xuddi shu ma'lumotni ko'radi va tahrirlaydi. Login yo'q:
link orqali kirgan har kim ko'ra va o'zgartira oladi.

Valyuta: **USD**. Interfeys: **o'zbek tilida**. Yorug'/qorong'i rejim almashtirgich bilan.

## Ishga tushirish

`.env.local` fayl yarating (`.env.example`ga qarang) va Upstash Redis
ma'lumotlarini kiriting:

```bash
UPSTASH_REDIS_REST_URL="https://....upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."
```

Bepul Redis bazasini https://upstash.com da (ro'yxatdan o'tib, "Create Database")
2 daqiqada yaratish mumkin — "REST API" bo'limidan URL va tokenni oling.

```bash
npm install
npm run dev      # http://localhost:3000
```

Ishlab chiqarish uchun (Vercel'ga joylashtirilganda shu 2 ta environment
variable'ni loyiha sozlamalarida ham qo'shish kerak):

```bash
npm run build
npm run start
```

## Sahifalar

| Sahifa | Nima ko'rsatadi |
|---|---|
| **Umumiy ko'rinish** | Daromad, xarajat, ROAS, CAC, lidlar, konversiya, auditoriya o'sishi, tagida operatorlar bo'limi |
| **Ijtimoiy tarmoq** | Instagram va Telegram: obunachilar, qamrov, faollik (ER); Instagram Story alohida kartochkada |
| **Reklama** | To'rt bo'lim: Umumiy, Meta Ads, Google Ads, Klinikalar katalogi; Meta Ads'da lead yo'nalishi bo'yicha ROMI |
| **Video** | YouTube va TikTok: ko'rishlar, obunachilar, ko'rish soatlari; YouTube uchun alohida bo'lim (videolar, shorts, yangi obunachilar) |
| **Sotuv va lidlar** | Lid → bitim yo'li, kanallarning daromadga hissasi (Sotuv + Chiquvchi operator jami), chiquvchi lidlarning yo'nalish kesimi |
| **Ma'lumot kiritish** | Kunlik ko'rsatkichlarni qo'shish va tahrirlash |
| **Sozlamalar** | Mavzu, zaxira nusxa (JSON), CSV eksport, demo/tozalash |

Yuqoridagi bitta filtr qatori (7 kun / 30 kun / 90 kun / Shu oy / Hammasi)
sahifadagi **barcha** grafiklarga birdek amal qiladi. Har bir ko'rsatkich
oldingi teng uzunlikdagi davr bilan solishtiriladi.

## Qanday ma'lumot kiritiladi

Har bir yozuv — **bitta kun + bitta kanal**. Shu sana va kanal uchun ikkinchi
marta kiritsangiz, yangi yozuv qo'shilmaydi — eskisi yangilanadi.

| Bo'lim | Maydonlar |
|---|---|
| Ijtimoiy tarmoq | sana, platforma (Instagram / Telegram / Instagram Story), obunachilar (kun oxiriga), qamrov, faollik, postlar |
| Reklama | sana, platforma, kampaniya, xarajat, ko'rsatishlar, kliklar, lidlar (Meta Ads uchun qo'shimcha: lead yo'nalishi) |
| Video | sana, platforma, videolar soni, shorts soni, ko'rishlar, obunachilar (kun oxiriga), ko'rish soatlari, likelar |
| Sotuv | sana, kanal, lidlar, bitimlar, daromad |
| Chiquvchi operator | sana, lead yo'nalishi, lidlar, bitimlar, daromad |
| Klinikalar katalogi | sana, katalog (Clinics.uz / Med24), lidlar, bitimlar, daromad, xarajat |

**Muhim:** _Reklama_ bo'limidagi lid — faqat pullik reklamadan kelgan murojaat
(CPL shundan hisoblanadi). _Sotuv_ bo'limidagi lid — sotuv voronkasiga tushgan
barcha murojaat (konversiya shundan hisoblanadi). Ikkalasi bir-birini takrorlamaydi.

Obunachilar soni — **zaxira** ko'rsatkich: davr bo'yicha qo'shilmaydi, davr
oxiridagi qiymat olinadi, o'sish esa boshi va oxiri farqi sifatida chiqadi.

## Formulalar

```
CTR        = kliklar / ko'rsatishlar
CPC        = xarajat / kliklar
CPM        = xarajat / ko'rsatishlar × 1000
CPL        = xarajat / reklama lidlari
ER         = faollik / qamrov
Konversiya = bitimlar / lidlar
O'rt. chek = daromad / bitimlar
ROAS       = daromad / reklama xarajati
CAC        = reklama xarajati / bitimlar
Sof foyda  = daromad − reklama xarajati

Klinikalar ROAS = daromad / xarajat
Klinikalar CPL  = xarajat / lidlar

Chiquvchi konversiya  = bitimlar / lidlar

ROMI (yo'nalish) = chiquvchi operator daromadi / Meta Ads xarajati (shu yo'nalish)
```

**Chiquvchi operator bo'limi.** Operatorlar qilgan chiquvchi qo'ng'iroqlarning
natijasi, lead yo'nalishi (Urolog, Dermatolog va h.k.) kesimida, daromad bilan;
yo'nalish bo'yicha hisobot _Sotuv va lidlar_ sahifasida chiqadi, lidlari/
bitimlari/daromadi esa **Sotuv va lidlar** sahifasining o'z jami (Daromad,
Lidlar, Bitimlar, Konversiya, O'rt. chek, ROAS, CAC, Sof foyda) va Umumiy
ko'rinishning **Umumiy lidlar / bitimlar / daromad** jamiga ham qo'shiladi
(Klinikalar katalogi kabi) — faqat xarajat tomoni yo'q, chunki bu lidlarning
Meta Ads xarajati reklama xarajatida
allaqachon hisobga olingan.

**Meta Ads → Chiquvchi operator bog'lanishi.** Meta Ads kampaniyasi kiritilganda
lead yo'nalishi (Urolog, Dermatolog va h.k.) tanlanadi — bu xuddi Chiquvchi
operator formasidagi yo'nalish ro'yxati bilan bir xil. Meta Ads sahifasida shu
yo'nalish bo'yicha ROMI hisoblanadi: chiquvchi operatorlar shu yo'nalishdagi
lidlar bilan gaplashib yopgan daromad ÷ shu yo'nalishga sarflangan Meta Ads
xarajati.

**Klinikalar katalogi** (Reklama guruhi ichida). Clinics.uz va Med24 kabi
klinika kataloglaridan kelgan lidlar qo'lda kiritiladi. Sahifada "Barchasi /
Clinics.uz / Med24" filtri bor — filtrga qarab bitta yoki ikkita seriyali
grafik ko'rsatiladi.

Klinikalar katalogining xarajati va daromadi **Umumiy ko'rinishdagi asosiy
ko'rsatkichlarga qo'shib hisoblanadi** — alohida bo'lim sifatida emas:

```
Umumiy xarajat = Reklama xarajati (barcha platforma) + Klinikalar xarajati
Umumiy daromad = Sotuv daromadi + Klinikalar daromadi
Lidlar / Bitimlar / Konversiya — xuddi shunday, Sotuv + Klinikalar yig'indisi
```

Shu sababli Sof foyda, ROAS va CAC har doim to'liq rasmni ko'rsatadi: xarajat
oshsa, unga mos daromad ham hisobga kiradi. "Lidlar manba bo'yicha" grafigida
ham Clinics.uz va Med24 boshqa kanallar qatorida alohida ustun bo'lib chiqadi.

Xarajat maydoni ikki xil mantiqqa ega:
- **Clinics.uz** — oylik obuna to'lovi, qo'lda kiritiladi.
- **Med24** — har lid uchun to'lov (standart $1). Kiritish formasida
  "Xarajat" maydonini **bo'sh qoldirsangiz**, lidlar soniga qarab avtomatik
  hisoblanadi. Narx o'zgarsa, maydonga qiymat kiritib qo'lda ham yozish mumkin.

## Google Ads hisobotini yuklash

Google Ads sahifasidagi **"Hisobot yuklash"** tugmasi orqali kampaniya
hisobotini to'g'ridan-to'g'ri yopishtirish mumkin — qo'lda kiritish shart emas.
Hammasi brauzerda o'qiladi, serverga hech narsa yuborilmaydi.

Google Ads → Kampaniyalar → jadvalni sarlavhasi va tepasidagi sana qatori
bilan birga nusxalang:

```
Отчет о кампании
30 июля 2026 г. - 30 июля 2026 г.
Статус кампании  Кампания   ...  Показы  Взаимодействия  ...  Расходы
Включено         Уролог1    ...  212     34              ...  8,94
Итого (Кампании) --         ...  1462    244             ...  81,69   ← tashlanadi
```

| Hisobotdagi ustun | Dashboardda |
|---|---|
| `Кампания` | kampaniya nomi |
| `Показы` | ko'rsatishlar |
| `Взаимодействия` (yoki `Клики`) | kliklar |
| `Расходы` | xarajat |
| `Конверсии` (bo'lsa) | lidlar |
| `День` (bo'lsa) | har qatorning o'z sanasi |

Parser ustunlarni **nomi bo'yicha** topadi — tartibi yoki soni o'zgarsa ham
ishlaydi. Rus formatidagi sonlar (`10,5`, `1 462`) va sanalar
(`30 июля 2026 г.`) tushuniladi. `Итого (...)` qatorlari tashlanadi, aks holda
xarajat ikki barobar chiqib ketardi. Ingliz tilidagi hisobot ham qabul
qilinadi.

Yozuvlar *sana + platforma + kampaniya* bo'yicha solishtiriladi: bitta
hisobotni ikki marta yuklasangiz takror yig'ilmaydi, mavjudi yangilanadi.

**Ikki narsaga e'tibor bering.** Hisobotda `Конверсии` ustuni bo'lmasa lidlar
nol bo'lib qoladi va CPL hisoblanmaydi — kerak bo'lsa uni Google Ads'da
ustunlar ro'yxatiga qo'shing. Va agar hisobot bir necha kunlik **jami** bo'lsa,
uni kunlarga bo'lib bo'lmaydi: hammasi oxirgi kunga yoziladi va ogohlantirish
chiqadi. Kunlik kesim uchun hisobotga `День` ustunini qo'shing.

## Ma'lumot xavfsizligi

Ma'lumot **umumiy Upstash Redis bazasida** turadi (`/api/data` orqali
o'qiladi/yoziladi), shuning uchun:

- qaysi brauzer yoki qurilmadan kirsangiz ham xuddi shu ma'lumotni ko'rasiz
  va tahrirlaysiz;
- **login yo'q** — havola (URL) kimda bo'lsa, o'sha ko'radi va o'zgartira
  oladi. Havolani faqat ishonchli odamlarga bering;
- brauzer ma'lumotlarini tozalash endi yozuvlarga ta'sir qilmaydi (ular
  serverda turadi) — faqat mavzu va filtr sozlamalari mahalliy qoladi;
- server bilan aloqa uzilsa (internet yo'q, token noto'g'ri va h.k.), sahifa
  yuqorisida qizil ogohlantirish va "Qayta urinish" tugmasi chiqadi.

**Sozlamalar → Zaxira nusxa** bo'limidan vaqti-vaqti bilan JSON yuklab oling —
bu qo'shimcha strahovka (baza o'chib qolsa ham ma'lumot fayl sifatida qoladi).
Excel uchun har bir bo'limni alohida CSV qilib ham yuklab olsa bo'ladi.

Birinchi ochilganda (yoki ma'lumot hali kiritilmagan bo'lsa) panel bo'sh
turmasligi uchun demo ma'lumot ko'rsatiladi — bu haqda yuqorida ogohlantiruvchi
qator chiqadi va birinchi o'z yozuvingizni kiritganingizda demo belgisi o'chadi.

## Texnologiyalar

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — ranglar CSS o'zgaruvchilari orqali, `data-theme` bilan almashadi
- Recharts — grafiklar
- Saqlash: Upstash Redis (`/api/data` route handler orqali, umumiy — login yo'q)

## Grafiklar bo'yicha qoidalar

Kod ichida quyidagilarga qat'iy amal qilingan:

- **Ikkinchi Y o'qi yo'q.** O'lchov birligi har xil bo'lsa (masalan xarajat va
  lidlar) — ikkita alohida grafik chiziladi.
- **Rang seriyaga biriktirilgan**, reytingga emas: Instagram qaysi grafikda
  bo'lmasin, doim bir xil rangda.
- Kategorik palitra rang ko'rligi (CVD) bo'yicha tekshirilgan; ikkala rejimda ham
  qo'shni ranglar orasidagi farq talab qilingan chegaradan yuqori.
- Har bir grafikning **jadval ko'rinishi** bor — ma'lumot faqat rang orqali
  uzatilmaydi. O'zgarish yo'nalishi rang bilan birga **strelka** bilan ham ko'rsatiladi.
- Ingichka belgilar, hairline to'r, har bir ko'rinishda bitta bosh raqam.

## Loyiha tuzilishi

```
src/
  app/                 sahifalar (App Router)
    api/data/route.ts  umumiy ma'lumotni o'qish/yozish (Upstash Redis)
  components/          UI va grafik komponentlari
  lib/
    types.ts           ma'lumot modellari
    google-ads.ts      Google Ads hisobotini o'qiydigan parser
    store.tsx          /api/data'ga bog'langan umumiy kontekst
    metrics.ts         sana, guruhlash va KPI hisoblari
    palette.ts         grafik ranglari (yorug'/qorong'i)
    format.ts          raqam va sana formatlari
    seed.ts            demo ma'lumot generatori
    export.ts          JSON/CSV eksport va import
```
